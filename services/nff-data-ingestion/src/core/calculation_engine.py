"""
Calculation Engine for Indicator Processing
Handles different types of calculations based on the calculation column
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import re
import logging
from datetime import datetime, timedelta

@dataclass
class CalculationResult:
    """Result of a calculation operation"""
    success: bool
    data: Optional[pd.DataFrame] = None
    error_message: Optional[str] = None
    calculation_type: Optional[str] = None
    metadata: Dict[str, Any] = None

class CalculationEngine:
    """Engine for processing different types of indicator calculations"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.calculation_patterns = {
            'average': self._calculate_average,
            'spread': self._calculate_spread,
            'ratio': self._calculate_ratio,
            'shiller_erp': self._calculate_shiller_erp,
            'moving_average': self._calculate_moving_average,
            'volatility': self._calculate_volatility,
            'z_score': self._calculate_z_score,
            'percentile': self._calculate_percentile,
            'composite': self._calculate_composite
        }
    
    def process_calculation(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                          indicator_name: str) -> CalculationResult:
        """
        Process calculation based on the calculation string
        
        Args:
            calculation: Calculation string from Excel
            series_data: Dict of series_id -> DataFrame with 'date' and 'value' columns
            indicator_name: Name of the indicator for context
            
        Returns:
            CalculationResult with processed data
        """
        if not calculation or pd.isna(calculation):
            return CalculationResult(success=False, error_message="No calculation specified")
        
        # Handle Unicode characters in calculation string
        calculation = str(calculation).strip()
        # Normalize Unicode characters to ASCII equivalents
        calculation = calculation.replace('Δ', 'delta').replace('α', 'alpha').replace('β', 'beta').replace('γ', 'gamma')
        
        try:
            # Determine calculation type and execute
            calc_type, result = self._identify_and_execute(calculation, series_data, indicator_name)
            
            if result is not None and not result.empty:
                return CalculationResult(
                    success=True,
                    data=result,
                    calculation_type=calc_type,
                    metadata={'original_calculation': calculation}
                )
            else:
                return CalculationResult(
                    success=False,
                    error_message=f"Calculation '{calculation}' produced no results",
                    calculation_type=calc_type
                )
                
        except Exception as e:
            self.logger.error(f"Calculation error for '{indicator_name}': {e}")
            return CalculationResult(
                success=False,
                error_message=str(e),
                metadata={'original_calculation': calculation}
            )
    
    def _identify_and_execute(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                            indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Identify calculation type and execute appropriate method"""
        
        calculation_lower = calculation.lower()
        self.logger.info(f"Processing calculation for {indicator_name}: '{calculation}'")
        
        # Pattern 1: Month-over-month changes (ΔMoM, ?MoM) - check BEFORE percentile
        if any(keyword in calculation_lower for keyword in ['?mom', 'deltamom', 't - t-1', 'mom =', '= t - t']):
            self.logger.info(f"Matched MoM pattern")
            return self._calculate_mom_difference(calculation, series_data, indicator_name)
        
        # Pattern 2: Level/Percent as published (check BEFORE percentile)
        if any(keyword in calculation_lower for keyword in ['percent as published', 'level', 'as published']):
            self.logger.info(f"Matched level_data pattern")
            return self._calculate_level_data(calculation, series_data, indicator_name)
        
        # Pattern 3: Descriptive calculations (check BEFORE other patterns)
        if any(keyword in calculation_lower for keyword in ['use target rate', 'use published', 'preferred', 'headwind', 'tailwind', 'sensitivity', 'driver for', 'monitor', 'context', 'pair with', 'utilities/chemicals', 'rolling corr']):
            self.logger.info(f"Matched descriptive pattern, treating as level_data")
            return self._calculate_level_data(calculation, series_data, indicator_name)
        
        # Pattern 4: Yield curve series (already calculated)
        if any(keyword in calculation_lower for keyword in ['t10y2y', 'yield curve', 'curve inversion']) or 'T10Y2Y' in str(series_data.keys()):
            self.logger.info(f"Matched yield curve pattern")
            return self._calculate_level_data(calculation, series_data, indicator_name)
        
        # Pattern 5: Z-score calculations (including YoY z-score, 20D)
        if any(keyword in calculation_lower for keyword in ['z-score', 'zscore', '12m z-score', 'optional z-score']):
            self.logger.info(f"Matched z-score pattern")
            return self._calculate_z_score(calculation, series_data, indicator_name)
        
        # Pattern 6: YoY calculations (Year-over-year percentage changes)
        if any(pattern in calculation_lower for pattern in ['yoy', 'year-over-year', 't/t-12', '100*(t/t-12']):
            return self._calculate_yoy_percentage(calculation, series_data, indicator_name)
        
        # Pattern 7: Moving Average calculations
        if any(keyword in calculation_lower for keyword in ['ma', 'moving average', 'avg', '3-month', '3m']):
            return self._calculate_moving_average(calculation, series_data, indicator_name)
        
        # Pattern 8: Spread calculations (subtraction)
        if any(keyword in calculation_lower for keyword in ['spread', 'subtract', '-', 'dgs10 - dgs2']):
            return self._calculate_spread(calculation, series_data, indicator_name)
        
        # Pattern 9: Ratio calculations (division)
        if any(keyword in calculation_lower for keyword in ['ratio', 'divide', '/', 'per']):
            return self._calculate_ratio(calculation, series_data, indicator_name)
        
        # Pattern 10: Shiller ERP calculation
        if 'shiller' in calculation_lower and 'erp' in calculation_lower:
            return self._calculate_shiller_erp(calculation, series_data, indicator_name)
        
        # Pattern 11: Volatility calculations
        if any(keyword in calculation_lower for keyword in ['vol', 'volatility', 'std']):
            return self._calculate_volatility(calculation, series_data, indicator_name)
        
        # Pattern 12: Percentile calculations (check AFTER "percent as published")
        if 'percentile' in calculation_lower:
            self.logger.info(f"Matched percentile pattern")
            return self._calculate_percentile(calculation, series_data, indicator_name)
        
        # Pattern 13: Weekly changes with Unicode (check for specific weekly patterns)
        if any(keyword in calculation_lower for keyword in ['weekly change', 'weekly delta', 'weekly ?', 'wow', 'x_t']):
            self.logger.info(f"Matched weekly changes pattern")
            return self._calculate_weekly_changes(calculation, series_data, indicator_name)
        
        # Pattern 14: Composite calculations (multiple operations)
        if len(series_data) > 2 or '+' in calculation or '*' in calculation:
            return self._calculate_composite(calculation, series_data, indicator_name)
        
        # Default: try to parse as simple arithmetic
        self.logger.warning(f"No specific pattern matched, trying simple arithmetic")
        return self._calculate_simple_arithmetic(calculation, series_data, indicator_name)
    
    def _calculate_moving_average(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                                indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate moving averages"""
        try:
            # Get the main series (first one)
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'moving_average', None
            
            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)
            
            # Determine window size from calculation text
            window = 3  # Default for "3-month average"
            
            # Extract period from calculation (e.g., "20D", "60M", "3m", "3-month")
            period_match = re.search(r'(\d+)([DMWY])', calculation, re.IGNORECASE)
            if period_match:
                period = int(period_match.group(1))
                unit = period_match.group(2).upper()
                
                # Calculate moving average based on unit
                if unit == 'D':
                    window = min(period, len(df))
                elif unit == 'M':
                    window = min(period, len(df))
                elif unit == 'W':
                    window = min(period * 4, len(df))  # Approximate weeks to data points
                else:  # Y
                    window = min(period * 12, len(df))  # Approximate years to data points
            else:
                # Try to extract number from text patterns
                if '3-month' in calculation.lower() or '3m' in calculation.lower():
                    window = min(3, len(df))
                elif '20' in calculation.lower() or 'ma20' in calculation.lower():
                    window = min(20, len(df))
                elif '60' in calculation.lower():
                    window = min(60, len(df))
            
            # Calculate moving average
            df['value'] = df['value'].rolling(window=window, min_periods=1).mean()
            
            return 'moving_average', df
            
        except Exception as e:
            self.logger.error(f"Moving average calculation error: {e}")
            return 'moving_average', None
    
    def _calculate_spread(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                         indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate spreads (subtraction between two series)"""
        try:
            # Handle single series with spread calculation (e.g., T10Y2Y)
            if len(series_data) == 1:
                series_id = list(series_data.keys())[0]
                
                # Check if it's a yield curve series like T10Y2Y
                if 't10y2y' in series_id.lower() or 'yield curve' in indicator_name.lower():
                    df = series_data[series_id].copy()
                    if not df.empty:
                        # T10Y2Y is already a spread, no calculation needed
                        return 'spread', df
                
                return 'spread', None
            
            # Handle two series spread calculation
            if len(series_data) < 2:
                return 'spread', None
            
            series_ids = list(series_data.keys())
            df1 = series_data[series_ids[0]].copy()
            df2 = series_data[series_ids[1]].copy()
            
            # Merge on date
            merged = pd.merge(df1, df2, on='date', suffixes=('_1', '_2'))
            if merged.empty:
                return 'spread', None
            
            # Calculate spread (series1 - series2)
            merged['value'] = merged['value_1'] - merged['value_2']
            result = merged[['date', 'value']].copy()
            
            return 'spread', result
            
        except Exception as e:
            self.logger.error(f"Spread calculation error: {e}")
            return 'spread', None
    
    def _calculate_ratio(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                        indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate ratios (division between two series)"""
        try:
            if len(series_data) < 2:
                return 'ratio', None
            
            series_ids = list(series_data.keys())
            df1 = series_data[series_ids[0]].copy()
            df2 = series_data[series_ids[1]].copy()
            
            # Merge on date
            merged = pd.merge(df1, df2, on='date', suffixes=('_1', '_2'))
            if merged.empty:
                return 'ratio', None
            
            # Calculate ratio (series1 / series2), avoid division by zero
            merged['value'] = merged['value_1'] / merged['value_2'].replace(0, np.nan)
            result = merged[['date', 'value']].copy()
            result = result.dropna()
            
            return 'ratio', result
            
        except Exception as e:
            self.logger.error(f"Ratio calculation error: {e}")
            return 'ratio', None
    
    def _calculate_shiller_erp(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                              indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate Shiller Earnings Risk Premium (EY - 10Y Treasury)"""
        try:
            # This would require fetching Shiller data and 10Y Treasury
            # For now, return None - this needs special handling
            self.logger.warning("Shiller ERP calculation requires special data fetching")
            return 'shiller_erp', None
            
        except Exception as e:
            self.logger.error(f"Shiller ERP calculation error: {e}")
            return 'shiller_erp', None
    
    def _calculate_volatility(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                             indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate volatility (standard deviation)"""
        try:
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'volatility', None
            
            # Extract period
            period_match = re.search(r'(\d+)([DMWY])', calculation, re.IGNORECASE)
            period = int(period_match.group(1)) if period_match else 30
            unit = period_match.group(2).upper() if period_match else 'D'
            
            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)
            
            # Calculate rolling volatility
            if unit == 'D':
                window = min(period, len(df))
            else:
                window = min(period * 4, len(df))  # Approximate
            
            df['value'] = df['value'].rolling(window=window, min_periods=1).std()
            
            return 'volatility', df
            
        except Exception as e:
            self.logger.error(f"Volatility calculation error: {e}")
            return 'volatility', None
    
    def _calculate_z_score(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                          indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate z-scores (standardized values)"""
        try:
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'z_score', None
            
            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)
            
            # Extract window size from calculation (e.g., "20D", "12M")
            window = None
            period_match = re.search(r'(\d+)([DMY])', calculation, re.IGNORECASE)
            if period_match:
                period = int(period_match.group(1))
                unit = period_match.group(2).upper()
                
                if unit == 'D':
                    window = min(period, len(df))
                elif unit == 'M':
                    window = min(period, len(df))
                elif unit == 'Y':
                    window = min(period * 12, len(df))
            
            # Check if it's a rolling z-score (e.g., 12m z-score, 20D)
            if '12m' in calculation.lower() or '12m' in calculation.lower():
                window = min(12, len(df))
            elif '20d' in calculation.lower() and window is None:
                window = min(20, len(df))
            
            if window:
                # Calculate rolling z-score
                df['rolling_mean'] = df['value'].rolling(window=window, min_periods=1).mean()
                df['rolling_std'] = df['value'].rolling(window=window, min_periods=1).std()
                
                # Calculate z-score
                df['value'] = (df['value'] - df['rolling_mean']) / df['rolling_std'].replace(0, 1)
                df = df.drop(columns=['rolling_mean', 'rolling_std'])
            else:
                # Calculate overall z-score
                mean_val = df['value'].mean()
                std_val = df['value'].std()
                
                if std_val == 0:
                    df['value'] = 0
                else:
                    df['value'] = (df['value'] - mean_val) / std_val
            
            return 'z_score', df
            
        except Exception as e:
            self.logger.error(f"Z-score calculation error: {e}")
            return 'z_score', None
    
    def _calculate_percentile(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                             indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate percentile rankings"""
        try:
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'percentile', None
            
            # Calculate percentile rank
            df['value'] = df['value'].rank(pct=True) * 100
            
            return 'percentile', df
            
        except Exception as e:
            self.logger.error(f"Percentile calculation error: {e}")
            return 'percentile', None
    
    def _calculate_average(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                          indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate simple averages"""
        try:
            if len(series_data) == 1:
                # Single series - calculate rolling average
                return self._calculate_moving_average(calculation, series_data, indicator_name)
            else:
                # Multiple series - calculate cross-sectional average
                all_dates = set()
                for df in series_data.values():
                    all_dates.update(df['date'].tolist())
                
                result_data = []
                for date in sorted(all_dates):
                    values = []
                    for df in series_data.values():
                        val = df[df['date'] == date]['value'].values
                        if len(val) > 0:
                            values.append(val[0])
                    
                    if values:
                        avg_value = np.mean(values)
                        result_data.append({'date': date, 'value': avg_value})
                
                if result_data:
                    return 'average', pd.DataFrame(result_data)
                else:
                    return 'average', None
                    
        except Exception as e:
            self.logger.error(f"Average calculation error: {e}")
            return 'average', None
    
    def _calculate_composite(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                           indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Handle complex composite calculations"""
        try:
            # This is a placeholder for complex calculations
            # In practice, you'd parse the calculation string and build a computation tree
            self.logger.warning(f"Complex composite calculation not fully implemented: {calculation}")
            return 'composite', None
            
        except Exception as e:
            self.logger.error(f"Composite calculation error: {e}")
            return 'composite', None
    
    def _calculate_simple_arithmetic(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                                   indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Handle simple arithmetic expressions"""
        try:
            # Try to parse simple expressions like "A + B", "A - B", "A / B", "A * B"
            if len(series_data) == 2:
                series_ids = list(series_data.keys())
                
                # Try different operators
                if '+' in calculation:
                    return self._calculate_addition(series_data, series_ids)
                elif '-' in calculation:
                    return self._calculate_spread(calculation, series_data, indicator_name)
                elif '/' in calculation:
                    return self._calculate_ratio(calculation, series_data, indicator_name)
                elif '*' in calculation:
                    return self._calculate_multiplication(series_data, series_ids)
            
            return 'simple_arithmetic', None
            
        except Exception as e:
            self.logger.error(f"Simple arithmetic calculation error: {e}")
            return 'simple_arithmetic', None
    
    def _calculate_addition(self, series_data: Dict[str, pd.DataFrame], 
                          series_ids: List[str]) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate addition of two series"""
        try:
            df1 = series_data[series_ids[0]].copy()
            df2 = series_data[series_ids[1]].copy()
            
            merged = pd.merge(df1, df2, on='date', suffixes=('_1', '_2'))
            if merged.empty:
                return 'addition', None
            
            merged['value'] = merged['value_1'] + merged['value_2']
            result = merged[['date', 'value']].copy()
            
            return 'addition', result
            
        except Exception as e:
            self.logger.error(f"Addition calculation error: {e}")
            return 'addition', None
    
    def _calculate_multiplication(self, series_data: Dict[str, pd.DataFrame], 
                                series_ids: List[str]) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate multiplication of two series"""
        try:
            df1 = series_data[series_ids[0]].copy()
            df2 = series_data[series_ids[1]].copy()
            
            merged = pd.merge(df1, df2, on='date', suffixes=('_1', '_2'))
            if merged.empty:
                return 'multiplication', None
            
            merged['value'] = merged['value_1'] * merged['value_2']
            result = merged[['date', 'value']].copy()
            
            return 'multiplication', result
            
        except Exception as e:
            self.logger.error(f"Multiplication calculation error: {e}")
            return 'multiplication', None
    
    def _calculate_yoy_percentage(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                                 indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate Year-over-Year percentage changes"""
        try:
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'yoy_percentage', None
            
            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)
            
            # Calculate YoY percentage change: 100 * (current / lag_12 - 1)
            df['value'] = 100 * (df['value'] / df['value'].shift(12) - 1)
            
            # Remove NaN values (first 12 months)
            df = df.dropna(subset=['value'])
            
            return 'yoy_percentage', df
            
        except Exception as e:
            self.logger.error(f"YoY percentage calculation error: {e}")
            return 'yoy_percentage', None
    
    def _calculate_level_data(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                             indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Handle 'Level' or 'Percent as published' - no calculation needed"""
        try:
            if not series_data:
                self.logger.warning(f"Empty series_data for {indicator_name}")
                return 'level_data', None
            
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            self.logger.info(f"Level data for {indicator_name}: {len(df)} rows from series {series_id}")
            
            if df.empty:
                self.logger.warning(f"Empty DataFrame for {indicator_name} with series_id {series_id}")
                return 'level_data', None
            
            # Ensure proper column names
            if 'date' not in df.columns or 'value' not in df.columns:
                self.logger.error(f"Missing required columns for {indicator_name}. Columns: {df.columns.tolist()}")
                return 'level_data', None
            
            # No calculation needed, just return the data as-is
            # But we can optionally apply moving average if specified
            if 'ma20' in calculation.lower() or 'ma 20' in calculation.lower():
                df = df.sort_values('date').reset_index(drop=True)
                df['value'] = df['value'].rolling(window=20, min_periods=1).mean()
            
            return 'level_data', df
            
        except Exception as e:
            self.logger.error(f"Level data calculation error for {indicator_name}: {e}")
            return 'level_data', None
    
    def _calculate_mom_difference(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                                  indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate month-over-month differences (ΔMoM = t - t-1)"""
        try:
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'mom_difference', None
            
            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)
            
            # Calculate month-over-month difference
            df['value'] = df['value'].diff()
            
            # Drop the first row (which will be NaN)
            df = df.dropna()
            
            return 'mom_difference', df
            
        except Exception as e:
            self.logger.error(f"MoM difference calculation error: {e}")
            return 'mom_difference', None
    
    def _calculate_weekly_changes(self, calculation: str, series_data: Dict[str, pd.DataFrame], 
                                 indicator_name: str) -> Tuple[str, Optional[pd.DataFrame]]:
        """Calculate weekly changes, basis points, and handle Unicode characters"""
        try:
            series_id = list(series_data.keys())[0]
            df = series_data[series_id].copy()
            
            if df.empty:
                return 'weekly_changes', None
            
            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)
            
            # Handle different types of weekly calculations
            if 'bps' in calculation.lower() or 'basis points' in calculation.lower():
                # Calculate basis points change (multiply by 100)
                df['value'] = df['value'].diff() * 100
            elif 'wow' in calculation.lower() and 'x_t' in calculation.lower():
                # WoW = x_t - x_{t-1} pattern - calculate weekly difference
                df['value'] = df['value'].diff()
            elif 'Δ' in calculation or 'delta' in calculation.lower():
                # Calculate simple difference
                df['value'] = df['value'].diff()
            else:
                # Default to percentage change
                df['value'] = df['value'].pct_change() * 100
            
            # Remove first row (NaN from diff)
            df = df.dropna(subset=['value'])
            
            return 'weekly_changes', df
            
        except Exception as e:
            self.logger.error(f"Weekly changes calculation error: {e}")
            return 'weekly_changes', None

# Global calculation engine instance
calculation_engine = CalculationEngine()
