import os
import sqlalchemy
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {url}")

try:
    engine = create_engine(url)
    with engine.connect() as conn:
        result = conn.execute(sqlalchemy.text("SELECT version();"))
        print(f"Success! Database version: {result.fetchone()[0]}")
except Exception as e:
    print(f"Failed to connect: {e}")
