import pandas as pd
import requests
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from utils.logger import get_logger

logger = get_logger(__name__)

class BaseDataFetcher(ABC):
    @abstractmethod
    async def fetch(self, series_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        pass

class FREDDataFetcher(BaseDataFetcher):
    def __init__(self):
        self.api_key = self._get_api_key()
        self.base_url = "https://api.stlouisfed.org/fred"
        
        if not self.api_key:
            logger.error("FRED_API_KEY not found")
            raise ValueError("FRED_API_KEY is required for FREDDataFetcher.")
        
        logger.info("FRED API fetcher initialized successfully")

    def _get_api_key(self) -> Optional[str]:
        api_key = os.getenv('FRED_API_KEY')
        
        if api_key:
            logger.info("FRED API key found in environment variables")
            return api_key
        
        api_key = os.getenv('FRED_API_TOKEN') or os.getenv('FRED_TOKEN')
        if api_key:
            logger.info("FRED API key found in alternative environment variable")
            return api_key
        
        logger.warning("FRED API key not found in environment variables")
        return None

    async def fetch(self, series_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        all_series_data = []
        series_list = [s.strip() for s in series_id.split('|')] if '|' in series_id else [series_id.strip()]

        logger.info(f"Fetching FRED data for {len(series_list)} series: {series_list}")

        for sid in series_list:
            try:
                url = f"{self.base_url}/series/observations"
                params = {
                    'series_id': sid,
                    'api_key': self.api_key,
                    'file_type': 'json',
                    'observation_start': start_date.isoformat() if start_date else '1776-07-04',
                    'observation_end': end_date.isoformat() if end_date else datetime.now().isoformat().split('T')[0],
                    'limit': 100000,
                    'sort_order': 'asc'
                }
                
                logger.info(f"Fetching FRED data for series: {sid}")
                response = requests.get(url, params=params, timeout=30)
                
                if response.status_code == 401:
                    raise ValueError(f"FRED API authentication failed. Check your API key.")
                elif response.status_code == 403:
                    raise ValueError(f"FRED API access forbidden. Check your API key permissions.")
                elif response.status_code == 429:
                    raise ValueError(f"FRED API rate limit exceeded. Please wait and try again.")
                elif response.status_code == 400:
                    try:
                        error_data = response.json()
                        error_message = error_data.get('error_message', 'Bad Request')
                        raise ValueError(f"FRED API Bad Request (400): {error_message}")
                    except:
                        raise ValueError(f"FRED API Bad Request (400): Invalid request parameters")
                elif response.status_code == 404:
                    try:
                        error_data = response.json()
                        error_message = error_data.get('error_message', 'Not Found')
                        raise ValueError(f"FRED API Not Found (404): {error_message}")
                    except:
                        raise ValueError(f"FRED API Not Found (404): Series does not exist")
                
                response.raise_for_status()
                
                data = response.json()
                observations = data.get('observations', [])
                
                if not observations:
                    logger.warning(f"No observations found for FRED series: {sid}")
                    continue
                
                for obs in observations:
                    try:
                        obs_date = pd.to_datetime(obs['date']).date()
                        obs_value = float(obs['value']) if obs['value'] != '.' else None
                        
                        if obs_value is not None:
                            all_series_data.append({
                                'date': obs_date,
                                'value': obs_value,
                                'series_id': sid 
                            })
                    except (ValueError, KeyError) as e:
                        logger.debug(f"Skipping invalid observation: {e}")
                        continue
                
                logger.info(f"Fetched {len([d for d in all_series_data if d.get('series_id') == sid])} records for series {sid}")
                
            except requests.exceptions.RequestException as e:
                logger.error(f"FRED API request error for {sid}: {e}")
                raise
            except Exception as e:
                logger.error(f"Error processing FRED data for {sid}: {e}")
                raise

        if not all_series_data:
            logger.warning("No data fetched from any series")
            return []
        
        logger.info(f"Total FRED data: {len(all_series_data)} records from {len(series_list)} series")
        
        return all_series_data

    async def get_series_info(self, series_id: str) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/series"
            params = {
                'series_id': series_id,
                'api_key': self.api_key,
                'file_type': 'json'
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            series_info = data.get('seriess', [{}])[0] if data.get('seriess') else {}
            
            return {
                'id': series_info.get('id'),
                'title': series_info.get('title'),
                'units': series_info.get('units'),
                'frequency': series_info.get('frequency'),
                'seasonal_adjustment': series_info.get('seasonal_adjustment'),
                'last_updated': series_info.get('last_updated'),
                'observation_start': series_info.get('observation_start'),
                'observation_end': series_info.get('observation_end')
            }
            
        except Exception as e:
            logger.error(f"Failed to get series info for {series_id}: {e}")
            return {}

class ShillerDataFetcher(BaseDataFetcher):
    def __init__(self):
        self.data_url = os.getenv('SHILLER_DATA_URL')
        if not self.data_url:
            logger.warning("SHILLER_DATA_URL not set. Shiller data fetching might fail.")

    async def fetch(self, series_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        try:
            logger.info(f"Fetching Shiller data from: {self.data_url}")
            
            if self.data_url.endswith('.xlsx'):
                df = pd.read_excel(self.data_url)
            else:
                df = pd.read_csv(self.data_url)
            
            df['date'] = pd.to_datetime(df['Date'], errors='coerce').dt.date
            df['value'] = pd.to_numeric(df[series_id], errors='coerce')
            
            df = df[['date', 'value']].dropna()

            if start_date:
                df = df[df['date'] >= start_date]
            if end_date:
                df = df[df['date'] <= end_date]
            
            fetched_data = []
            for _, row in df.iterrows():
                fetched_data.append({
                    'date': row['date'],
                    'value': float(row['value'])
                })
            
            logger.info(f"Fetched {len(fetched_data)} records for Shiller series {series_id}")
            return fetched_data

        except Exception as e:
            logger.error(f"Error fetching Shiller data for {series_id}: {e}")
            raise

class DataFetcherFactory:
    @staticmethod
    def get_fetcher(source: str) -> Optional[BaseDataFetcher]:
        source_lower = source.lower()
        
        try:
            if "fred" in source_lower:
                logger.info("Using real FRED API")
                return FREDDataFetcher()
            
            elif "polygon" in source_lower:
                logger.error("Polygon API is no longer supported")
                raise ValueError("POLYGON_NOT_SUPPORTED: Polygon API is no longer available. Please use alternative data source.")
            
            elif "shiller" in source_lower:
                return ShillerDataFetcher()
            
            else:
                logger.warning(f"No data fetcher implemented for source: {source}")
                return None
        
        except Exception as e:
            logger.error(f"Failed to create data fetcher for source {source}: {e}")
            return None

    @staticmethod
    def get_available_sources() -> List[str]:
        available = []
        
        if os.getenv('FRED_API_KEY'):
            available.append('FRED')
        
        if os.getenv('SHILLER_DATA_URL'):
            available.append('Shiller')
        
        return available
    
    @staticmethod
    def get_api_keys_status() -> Dict[str, str]:
        return {
            'fred': 'configured' if os.getenv('FRED_API_KEY') else 'missing',
            'shiller': 'configured' if os.getenv('SHILLER_DATA_URL') else 'missing',
        }