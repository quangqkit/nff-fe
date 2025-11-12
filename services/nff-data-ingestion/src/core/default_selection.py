"""
Default Selection Logic Implementation
Handles importance=5 and default report mapping logic
"""
import pandas as pd
from typing import Dict, List, Any, Optional
from utils.logger import get_logger

logger = get_logger(__name__)

class DefaultSelectionProcessor:
    """
    Processes default selection logic based on importance=5 rule
    and Default_* flags from Excel
    """
    
    def __init__(self):
        self.report_type_mapping = {
            'Default_MorningBrief': 'Morning Brief',
            'Default_WeeklyTacticalReview': 'Weekly Tactical Review', 
            'Default_SectorsPlaybook': 'Sectors Playbook',
            'Default_EquityDeepDives': 'Equity Deep Dives',
            'Default_GlobalMacro': 'Global Macro'
        }
    
    def process_default_selection(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Process default selection logic for indicators
        
        Logic:
        1. If importance = 5 AND Default_<Report> = TRUE -> isDefault = True
        2. If importance = 5 AND Relevant_Reports contains report name -> isDefault = True
        3. Otherwise -> isDefault = False
        """
        logger.info(f"Processing default selection for {len(df)} indicators")
        
        # Add default selection columns
        df['isDefault_MorningBrief'] = False
        df['isDefault_WeeklyTacticalReview'] = False
        df['isDefault_SectorsPlaybook'] = False
        df['isDefault_EquityDeepDives'] = False
        df['isDefault_GlobalMacro'] = False
        
        for idx, row in df.iterrows():
            importance = row.get('importance', 3)
            # Handle relevantReports - check for NaN and empty strings
            relevant_reports_value = row.get('Relevant_Reports')
            if pd.notna(relevant_reports_value) and str(relevant_reports_value).strip() and str(relevant_reports_value).strip().lower() != 'nan':
                relevant_reports = [r.strip() for r in str(relevant_reports_value).split(',') if r.strip() and r.strip().lower() != 'nan']
            else:
                relevant_reports = []
            
            # Process each report type
            for excel_col, report_name in self.report_type_mapping.items():
                if excel_col in df.columns:
                    default_flag = row.get(excel_col, False)
                    
                    # Logic 1: importance = 5 AND Default_<Report> = TRUE
                    if importance == 5 and self._is_true_value(default_flag):
                        df.at[idx, f'isDefault_{report_name.replace(" ", "")}'] = True
                        logger.debug(f"Indicator '{row.get('Indicator_EN', 'Unknown')}' marked as default for {report_name} (importance=5 + flag=True)")
                    
                    # Logic 2: importance = 5 AND Relevant_Reports contains report name
                    elif importance == 5 and report_name in relevant_reports:
                        df.at[idx, f'isDefault_{report_name.replace(" ", "")}'] = True
                        logger.debug(f"Indicator '{row.get('Indicator_EN', 'Unknown')}' marked as default for {report_name} (importance=5 + relevant_reports)")
        
        # Count defaults by report type
        default_counts = {}
        for excel_col, report_name in self.report_type_mapping.items():
            col_name = f'isDefault_{report_name.replace(" ", "")}'
            if col_name in df.columns:
                count = df[col_name].sum()
                default_counts[report_name] = int(count)
        
        logger.info(f"Default selection processed. Counts: {default_counts}")
        return df
    
    def _is_true_value(self, value: Any) -> bool:
        """Check if value represents True (handles various formats)"""
        if pd.isna(value):
            return False
        
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            return value.lower() in ['true', '1', 'yes', 'y', 't']
        
        if isinstance(value, (int, float)):
            return bool(value)
        
        return False
    
    def get_default_indicators_for_report(self, df: pd.DataFrame, report_name: str) -> pd.DataFrame:
        """
        Get indicators that should be default selected for a specific report
        """
        col_name = f'isDefault_{report_name.replace(" ", "")}'
        
        if col_name not in df.columns:
            logger.warning(f"No default column found for report: {report_name}")
            return pd.DataFrame()
        
        default_indicators = df[df[col_name] == True].copy()
        logger.info(f"Found {len(default_indicators)} default indicators for {report_name}")
        
        return default_indicators
    
    def create_default_mappings(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Create default report mappings for database insertion
        """
        mappings = []
        
        for idx, row in df.iterrows():
            indicator_en = row.get('Indicator_EN', f'Indicator_{idx}')
            
            for excel_col, report_name in self.report_type_mapping.items():
                col_name = f'isDefault_{report_name.replace(" ", "")}'
                
                if col_name in df.columns and row.get(col_name, False):
                    mappings.append({
                        'indicatorEN': indicator_en,
                        'reportName': report_name,
                        'isDefault': True,
                        'source': 'excel_import'
                    })
        
        logger.info(f"Created {len(mappings)} default mappings")
        return mappings
