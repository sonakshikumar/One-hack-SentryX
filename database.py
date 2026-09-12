from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database - just a single file, no server setup needed. Perfect for a hackathon.
DATABASE_URL = "sqlite:///./sentryx.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# This function gives each API request its own database connection,
# and closes it automatically when the request is done.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
