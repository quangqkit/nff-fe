"""
AI Features Calculator
Calculates derived features for machine learning and analysis
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AIFeaturesCalculator:
    """Calculate AI/ML features for time series data"""
    
    def calculate_features(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculate all AI features for time series data
        
        Features:
        - Z-score normalization
        - Min-max normalization
        - Percentage changes (1m, 3m, 12m)
        - Moving averages (30d, 90d, 365d)
        - Volatility (30d, 90d)
        - Lag features
        - Trend classification
        - Outlier detection
        """
        if not data or len(data) == 0:
            return []
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(data)
            df = df.sort_values('date')
            
            # Ensure value is numeric
            df['value'] = pd.to_numeric(df['value'], errors='coerce')
            df = df.dropna(subset=['value'])
            
            if len(df) == 0:
                return []
            
            # Calculate features
            df = self._calculate_normalization(df)
            df = self._calculate_percentage_changes(df)
            df = self._calculate_moving_averages(df)
            df = self._calculate_volatility(df)
            df = self._calculate_lag_features(df)
            df = self._classify_trend(df)
            df = self._detect_outliers(df)
            
            # Convert back to list of dicts
            result = []
            for _, row in df.iterrows():
                item = {
                    'date': row['date'] if isinstance(row['date'], str) else row['date'].date() if hasattr(row['date'], 'date') else row['date'],
                    'value': self._sanitize_numeric(row['value']),
                    'z_score': self._sanitize_numeric(row.get('z_score')),
                    'normalized': self._sanitize_numeric(row.get('normalized')),
                    'pct_change_1m': self._sanitize_numeric(row.get('pct_change_1m')),
                    'pct_change_3m': self._sanitize_numeric(row.get('pct_change_3m')),
                    'pct_change_12m': self._sanitize_numeric(row.get('pct_change_12m')),
                    'ma_30d': self._sanitize_numeric(row.get('ma_30d')),
                    'ma_90d': self._sanitize_numeric(row.get('ma_90d')),
                    'ma_365d': self._sanitize_numeric(row.get('ma_365d')),
                    'volatility_30d': self._sanitize_numeric(row.get('volatility_30d')),
                    'volatility_90d': self._sanitize_numeric(row.get('volatility_90d')),
                    'lag_1': self._sanitize_numeric(row.get('lag_1')),
                    'lag_3': self._sanitize_numeric(row.get('lag_3')),
                    'lag_6': self._sanitize_numeric(row.get('lag_6')),
                    'lag_12': self._sanitize_numeric(row.get('lag_12')),
                    'trend': row.get('trend'),
                    'is_outlier': bool(row.get('is_outlier', False))
                }
                result.append(item)
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating AI features: {e}")
            # Return original data if feature calculation fails
            return data
    
    def _calculate_normalization(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate z-score and min-max normalization"""
        try:
            # Z-score
            mean = df['value'].mean()
            std = df['value'].std()
            
            if std > 0:
                df['z_score'] = (df['value'] - mean) / std
            else:
                df['z_score'] = 0
            
            # Min-max normalization
            min_val = df['value'].min()
            max_val = df['value'].max()
            
            if max_val > min_val:
                df['normalized'] = (df['value'] - min_val) / (max_val - min_val)
            else:
                df['normalized'] = 0.5
            
        except Exception as e:
            logger.error(f"Error in normalization: {e}")
            df['z_score'] = None
            df['normalized'] = None
        
        return df
    
    def _calculate_percentage_changes(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate percentage changes over different periods"""
        try:
            # 1 month (~21 trading days)
            df['pct_change_1m'] = df['value'].pct_change(periods=21) * 100
            
            # 3 months (~63 trading days)
            df['pct_change_3m'] = df['value'].pct_change(periods=63) * 100
            
            # 12 months (~252 trading days)
            df['pct_change_12m'] = df['value'].pct_change(periods=252) * 100
            
        except Exception as e:
            logger.error(f"Error in percentage changes: {e}")
            df['pct_change_1m'] = None
            df['pct_change_3m'] = None
            df['pct_change_12m'] = None
        
        return df
    
    def _calculate_moving_averages(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate moving averages"""
        try:
            df['ma_30d'] = df['value'].rolling(window=30, min_periods=1).mean()
            df['ma_90d'] = df['value'].rolling(window=90, min_periods=1).mean()
            df['ma_365d'] = df['value'].rolling(window=365, min_periods=1).mean()
            
        except Exception as e:
            logger.error(f"Error in moving averages: {e}")
            df['ma_30d'] = None
            df['ma_90d'] = None
            df['ma_365d'] = None
        
        return df
    
    def _calculate_volatility(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate rolling volatility (standard deviation)"""
        try:
            df['volatility_30d'] = df['value'].rolling(window=30, min_periods=1).std()
            df['volatility_90d'] = df['value'].rolling(window=90, min_periods=1).std()
            
        except Exception as e:
            logger.error(f"Error in volatility: {e}")
            df['volatility_30d'] = None
            df['volatility_90d'] = None
        
        return df
    
    def _calculate_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate lag features"""
        try:
            df['lag_1'] = df['value'].shift(1)
            df['lag_3'] = df['value'].shift(3)
            df['lag_6'] = df['value'].shift(6)
            df['lag_12'] = df['value'].shift(12)
            
        except Exception as e:
            logger.error(f"Error in lag features: {e}")
            df['lag_1'] = None
            df['lag_3'] = None
            df['lag_6'] = None
            df['lag_12'] = None
        
        return df
    
    def _classify_trend(self, df: pd.DataFrame) -> pd.DataFrame:
        """Classify trend based on moving averages"""
        try:
            df['trend'] = 'FLAT'
            
            # Compare value with 30-day MA
            mask_up = df['value'] > df['ma_30d'] * 1.02  # 2% threshold
            mask_down = df['value'] < df['ma_30d'] * 0.98
            
            df.loc[mask_up, 'trend'] = 'UP'
            df.loc[mask_down, 'trend'] = 'DOWN'
            
        except Exception as e:
            logger.error(f"Error in trend classification: {e}")
            df['trend'] = 'UNKNOWN'
        
        return df
    
    def _detect_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect outliers using z-score method"""
        try:
            df['is_outlier'] = False
            
            # Mark as outlier if |z_score| > 3
            if 'z_score' in df.columns:
                df.loc[abs(df['z_score']) > 3, 'is_outlier'] = True
            
        except Exception as e:
            logger.error(f"Error in outlier detection: {e}")
            df['is_outlier'] = False
        
        return df
    
    def _sanitize_numeric(self, value, max_abs=999999.0):
        """Sanitize numeric values (remove inf, nan, too large values)"""
        try:
            if pd.isna(value):
                return None
            
            if np.isinf(value):
                return None
            
            value = float(value)
            
            if abs(value) > max_abs:
                return None
            
            return value
            
        except (ValueError, TypeError):
            return None
