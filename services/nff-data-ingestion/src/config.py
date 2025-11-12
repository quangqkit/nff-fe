import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/nff_db")
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    SENTRY_DSN: str | None = os.getenv("SENTRY_DSN")
    
    FRED_API_KEY: str | None = os.getenv("FRED_API_KEY")
    POLYGON_API_KEY: str | None = os.getenv("POLYGON_API_KEY")
    TE_API_KEY: str | None = os.getenv("TE_API_KEY")
    TE_API_SECRET: str | None = os.getenv("TE_API_SECRET")
    CFTC_ACCESS_KEY: str | None = os.getenv("CFTC_ACCESS_KEY")
    CFTC_SECRET_KEY: str | None = os.getenv("CFTC_SECRET_KEY")

    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    NEST_API_URL: str = os.getenv("NEST_API_URL", "http://localhost:3000")
    PYTHON_URL: str = os.getenv("PYTHON_URL", "http://localhost:8000")
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()