import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from config import settings
import logging
import atexit

logger = logging.getLogger(__name__)

class DatabasePool:
    """Singleton connection pool manager"""
    
    _instance = None
    _pool = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._pool is None:
            self._initialize_pool()
            atexit.register(self.close_pool)
    
    def _initialize_pool(self):
        """Initialize connection pool"""
        try:
            db_url = settings.DATABASE_URL
            
            self._pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=db_url,
                connect_timeout=10,
                keepalives=1,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=5
            )
            
            logger.info("Database connection pool initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    def get_connection(self):
        """Get a connection from the pool"""
        try:
            if self._pool is None:
                self._initialize_pool()
            
            conn = self._pool.getconn()
            if conn:
                conn.cursor().execute("SELECT 1")
                return conn
            else:
                raise Exception("Failed to get connection from pool")
        except Exception as e:
            logger.error(f"Error getting connection from pool: {e}")            
            try:
                logger.warning("Falling back to direct connection")
                return psycopg2.connect(settings.DATABASE_URL)
            except Exception as fallback_error:
                logger.error(f"Fallback connection also failed: {fallback_error}")
                raise
    
    def return_connection(self, conn):
        """Return connection to pool"""
        try:
            if self._pool and conn:
                self._pool.putconn(conn)
        except Exception as e:
            logger.error(f"Error returning connection to pool: {e}")
            try:
                conn.close()
            except:
                pass
    
    def close_pool(self):
        """Close all connections in pool"""
        try:
            if self._pool:
                self._pool.closeall()
                logger.info("Database connection pool closed")
        except Exception as e:
            logger.error(f"Error closing pool: {e}")
    
    def get_cursor(self, cursor_factory=None):
        """Get a connection and cursor from pool (context manager)"""
        return DatabaseConnection(self, cursor_factory)

class DatabaseConnection:
    def __init__(self, pool_manager, cursor_factory=None):
        self.pool_manager = pool_manager
        self.cursor_factory = cursor_factory or RealDictCursor
        self.conn = None
        self.cursor = None
    
    def __enter__(self):
        self.conn = self.pool_manager.get_connection()
        self.cursor = self.conn.cursor(cursor_factory=self.cursor_factory)
        return self.cursor
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cursor:
            try:
                if exc_type:
                    self.conn.rollback()
                else:
                    self.conn.commit()
            except Exception as e:
                logger.error(f"Error in transaction: {e}")
                if self.conn:
                    try:
                        self.conn.rollback()
                    except:
                        pass
            finally:
                self.cursor.close()
        
        if self.conn:
            self.pool_manager.return_connection(self.conn)
        
        return False

db_pool = DatabasePool()

