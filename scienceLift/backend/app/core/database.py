"""
Database connection and session management.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Log database configuration
db_type = "SQLite" if settings.DATABASE_URL.startswith('sqlite') else "PostgreSQL"
logger.info(f"Configuring {db_type} database connection...")

# Create database engine
if settings.DATABASE_URL.startswith('sqlite'):
    logger.info("Using SQLite database (local development)")
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={
            "check_same_thread": False,
            "timeout": 30  # 30 second timeout for locks
        },
        echo=settings.DEBUG,
        poolclass=NullPool  # No connection pooling for SQLite threading
    )
    
    # Enable WAL mode for better concurrent access
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging
        cursor.execute("PRAGMA synchronous=NORMAL")  # Faster writes for background job
        cursor.execute("PRAGMA query_only=OFF")  # Ensure we can write
        cursor.close()
else:
    logger.info("Using PostgreSQL database (production/Render)")
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.DEBUG,
        pool_size=5,  # Render has connection limits
        max_overflow=10,
        pool_recycle=3600  # Recycle connections every hour
    )
    
    # Log successful PostgreSQL connection
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        logger.info("PostgreSQL database connection established")

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db():
    """
    Dependency to get database session for API routes.
    Ensures proper cleanup after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
