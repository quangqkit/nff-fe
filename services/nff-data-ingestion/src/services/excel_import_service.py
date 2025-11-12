"""
Enhanced Excel Import Service with Default Selection Logic
"""
import pandas as pd
import requests
import tempfile 
from services.indicator_metadata_service import IndicatorMetadataService
from services.excel_config_service import ExcelConfigService
from core.default_selection import DefaultSelectionProcessor
from utils.logger import get_logger
from core.monitoring import monitor, ErrorCategory

logger = get_logger(__name__)

class ExcelImportService:
    SUPPORTED_SOURCES = ['FRED', 'Polygon', 'Shiller', 'Polygon (ETF proxy)', 'Polygon (Forex)', 'Polygon (Completed)', 'TradingEconomics']
    
    def __init__(self):
        self.indicator_metadata_service = IndicatorMetadataService()
        self.default_processor = DefaultSelectionProcessor()
        self.excel_config = ExcelConfigService()

    async def get_excel_file_path(self, excel_path: str) -> str:
        if excel_path.startswith(('http://', 'https://')):
            logger.info(f"Detected URL, downloading file: {excel_path}")
            return await self.download_file_from_url(excel_path)
        else:
            logger.info(f"Using local file path: {excel_path}")
            return excel_path

    async def download_file_from_url(self, url: str) -> str:
        try:
            logger.info(f"Downloading file from URL: {url}")
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            temp_path = temp_file.name
            temp_file.close()
            
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"File downloaded successfully: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Failed to download file from URL: {str(e)}")
            raise Exception(f"Failed to download file from URL: {str(e)}")

    async def import_indicators_from_excel(self, excel_path: str, sheet_name: str, category_name: str, job_id: str = None):
        try:
            if job_id:
                monitor.start_job(job_id)
            
            logger.info(f"Loading Excel file: {excel_path}, sheet: {sheet_name}")
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
            logger.info(f"Loaded {len(df)} indicators from '{sheet_name}' sheet")

            category = await self.indicator_metadata_service.get_or_create_category(category_name)
            if not category:
                error_msg = f"Failed to get or create category: {category_name}"
                logger.error(error_msg)
                if job_id:
                    monitor.fail_job(job_id, "CATEGORY_ERROR", error_msg, ErrorCategory.CONFIG_ERROR)
                return {"success": False, "message": error_msg}

            
            df = self.default_processor.process_default_selection(df)
            
            processed_count = 0
            error_count = 0
            
            for idx, row in df.iterrows():
                try:
                    indicator_en = str(row.get('Indicator_EN', f'Unnamed Indicator Row {idx+1}')).strip()
                    if not indicator_en or indicator_en == 'nan':
                        logger.warning(f"Skipping row {idx+1} due to missing Indicator_EN.")
                        continue

                    relevant_reports_value = row.get('Relevant_Reports')
                    if pd.notna(relevant_reports_value) and str(relevant_reports_value).strip() and str(relevant_reports_value).strip().lower() != 'nan':
                        relevantReports = [r.strip() for r in str(relevant_reports_value).split(',') if r.strip() and r.strip().lower() != 'nan']
                    else:
                        relevantReports = []
                    
                        source_value = row.get('Source')
                    if pd.isna(source_value) or str(source_value).strip().lower() in ['nan', 'none', 'null', '']:
                        source = 'N/A'
                    else:
                        source = str(source_value).strip()
                    
                    if source not in self.SUPPORTED_SOURCES and source != 'N/A':
                        logger.info(f"Indicator '{indicator_en}' has unsupported source '{source}'. ETL will be BLOCKED but source will be preserved.")
                        etl_status = 'BLOCKED'
                        etl_notes = f"Unsupported data source: {source}"
                    else:
                        etl_status = 'UNKNOWN'
                        etl_notes = None
                    
                    series_ids = str(row.get('Series_IDs', None)).strip() if pd.notna(row.get('Series_IDs')) else None
                    if source in self.SUPPORTED_SOURCES and (not series_ids or series_ids.lower() in ['none', 'null', 'nan', '']):
                        logger.warning(f"Indicator '{indicator_en}' has source '{source}' but no valid Series_IDs")
                        etl_status = 'BLOCKED'
                        etl_notes = f"No series ID configured for {source} source"
                    
                    indicator_data = {
                        'moduleEN': str(row.get('Module_EN', 'Unknown')).strip(),
                        'moduleHE': str(row.get('Module_HE', None)).strip() if pd.notna(row.get('Module_HE')) else None,
                        'indicatorEN': indicator_en,
                        'indicatorHE': str(row.get('Indicator_HE', None)).strip() if pd.notna(row.get('Indicator_HE')) else None,
                        'categoryId': category.id,
                        'source': source,
                        'seriesIDs': series_ids,
                        'apiExample': str(row.get('API_Example', None)).strip() if pd.notna(row.get('API_Example')) else None,
                        'calculation': str(row.get('calculation', None)).strip() if pd.notna(row.get('calculation')) else None,
                        'notes': str(row.get('Notes', None)).strip() if pd.notna(row.get('Notes')) else None,
                        'importance': int(row.get('importance', 3)) if pd.notna(row.get('importance')) else 3,
                        'relevantReports': relevantReports,
                        'etlStatus': etl_status,
                        'etlNotes': etl_notes,
                        'isActive': True,
                    }
                    
                    indicator = await self.indicator_metadata_service.upsert_indicator_metadata(indicator_data)
                    
                    await self._create_default_mappings_for_indicator(indicator, row)
                    
                    processed_count += 1

                except Exception as e:
                    error_count += 1
                    logger.error(f"Error processing indicator from row {idx+1}: {e}")

            default_mappings = self.default_processor.create_default_mappings(df)
            
            result = {
                "success": True, 
                "message": f"Imported {processed_count} indicators successfully",
                "processed_count": processed_count,
                "error_count": error_count,
                "default_mappings_created": len(default_mappings),
                "category": category_name
            }
            
            try:
                sync_result = await self._sync_indicator_defaults(category_name)
                result['defaults_synced'] = sync_result
                logger.info(f"Auto-synced defaults for category {category_name}: {sync_result}")
            except Exception as e:
                logger.warning(f"Failed to auto-sync defaults (can be done manually): {e}")
                result['defaults_sync_warning'] = str(e)
            
            if job_id:
                monitor.complete_job(job_id, records_count=processed_count)
            
            logger.info(f"Excel import completed: {result}")
            return result

        except FileNotFoundError:
            error_msg = f"Excel file not found at {excel_path}"
            logger.error(error_msg)
            if job_id:
                monitor.fail_job(job_id, "FILE_NOT_FOUND", error_msg, ErrorCategory.SYSTEM_ERROR)
            return {"success": False, "message": error_msg}
        except Exception as e:
            error_msg = f"Failed to import indicators from Excel: {str(e)}"
            logger.error(error_msg)
            if job_id:
                monitor.fail_job(job_id, "EXCEL_IMPORT_FAILED", error_msg, ErrorCategory.SYSTEM_ERROR)
            return {"success": False, "message": error_msg}

    async def _sync_indicator_defaults(self, category_name: str):
        import httpx
        from config import settings
        
        nest_api_url = settings.NEST_API_URL
        sync_url = f"{nest_api_url}/api/report-types/sync-defaults/category/{category_name}"
        
        logger.info(f"Calling sync API: {sync_url}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(sync_url)
            response.raise_for_status()
            return response.json()
    
    async def _create_default_mappings_for_indicator(self, indicator, row: pd.Series):
        report_type_mapping = {
            'Default_MorningBrief': 'Morning Brief',
            'Default_WeeklyTacticalReview': 'Weekly Tactical Review', 
            'Default_SectorsPlaybook': 'Sectors Playbook',
            'Default_EquityDeepDives': 'Equity Deep Dives',
            'Default_GlobalMacro': 'Global Macro'
        }
        
        for excel_col, report_name in report_type_mapping.items():
            if excel_col in row.index:
                default_flag = row.get(excel_col, False)
                importance = row.get('importance', 3)
                relevant_reports_value = row.get('Relevant_Reports')
                if pd.notna(relevant_reports_value) and str(relevant_reports_value).strip() and str(relevant_reports_value).strip().lower() != 'nan':
                    relevant_reports = [r.strip() for r in str(relevant_reports_value).split(',') if r.strip() and r.strip().lower() != 'nan']
                else:
                    relevant_reports = []
                
                is_default = False
                
                if importance == 5 and self.default_processor._is_true_value(default_flag):
                    is_default = True
                
                elif importance == 5 and report_name in relevant_reports:
                    is_default = True
                
                if is_default:
                    try:
                        report_type = await self.indicator_metadata_service.get_report_type_by_name(report_name)
                        if report_type:
                            await self.indicator_metadata_service.create_indicator_report_default({
                                'indicatorId': indicator.id,
                                'reportTypeId': report_type.id,
                                'isDefault': True
                            })
                            logger.debug(f"Created default mapping: {indicator.indicatorEN} -> {report_name}")
                    except Exception as e:
                        logger.error(f"Failed to create default mapping for {indicator.indicatorEN} -> {report_name}: {e}")

    async def import_all_categories_from_excel(self, excel_path: str, job_id: str = None):
        try:
            if job_id:
                monitor.start_job(job_id)
            
            xl = pd.ExcelFile(excel_path)
            sheet_names = xl.sheet_names
            
            logger.info(f"Found {len(sheet_names)} sheets: {sheet_names}")
            
            results = {}
            total_processed = 0
            
            for sheet_name in sheet_names:
                try:
                    category_mapping = {
                        'Macro': 'Macro',
                        'Micro': 'Micro', 
                        'Options': 'Options',
                        'CTA': 'CTA',
                        'Combinations': 'Combination',
                        'NFF- Exclusive Indicators': 'Exclusive'
                    }
                    
                    category_name = category_mapping.get(sheet_name, sheet_name)
                    
                    result = await self.import_indicators_from_excel(
                        excel_path, 
                        sheet_name, 
                        category_name, 
                        job_id
                    )
                    
                    results[category_name] = result
                    if result.get('success'):
                        total_processed += result.get('processed_count', 0)
                    
                except Exception as e:
                    logger.error(f"Failed to import sheet '{sheet_name}': {e}")
                    results[sheet_name] = {"success": False, "message": str(e)}
            
            summary = {
                "success": True,
                "message": f"Imported all categories. Total indicators: {total_processed}",
                "results": results,
                "total_processed": total_processed
            }
            
            if job_id:
                monitor.complete_job(job_id, records_count=total_processed)
            
            logger.info(f"All categories import completed: {summary}")
            return summary
            
        except Exception as e:
            error_msg = f"Failed to import all categories: {str(e)}"
            logger.error(error_msg)
            if job_id:
                monitor.fail_job(job_id, "BULK_IMPORT_FAILED", error_msg, ErrorCategory.SYSTEM_ERROR)
            return {"success": False, "message": error_msg}