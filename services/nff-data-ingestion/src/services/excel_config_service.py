import os

class ExcelConfigService:
    def __init__(self):
        self.excel_path = self._get_excel_path()
    
    def _get_excel_path(self) -> str:
        env_path = os.getenv("EXCEL_IMPORT_PATH")
        if env_path:
            return env_path
        
        default_path = "src/data/NFF_Indicators.xlsx"
        return default_path
    
    def get_excel_path(self) -> str:
        return self.excel_path
    
    def is_url(self) -> bool:
        return self.excel_path.startswith(('http://', 'https://'))
    
    def get_path_info(self) -> dict:
        return {
            "path": self.excel_path,
            "is_url": self.is_url(),
            "source": "environment" if os.getenv("EXCEL_IMPORT_PATH") else "default"
        }
