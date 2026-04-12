import logging
import json
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def get_logger(name: str):
    """
    Returns a configured logger instance.
    - Production: JSON logging to stdout
    - Development: Pretty-printed console and file logging
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        level_name = os.getenv("LOG_LEVEL", "INFO").upper()
        level = getattr(logging, level_name, logging.INFO)
        logger.setLevel(level)
        
        env = os.getenv("ENV", "development").lower()
        
        if env == "production":
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(JSONFormatter())
            logger.addHandler(console_handler)
        else:
            # Robust root directory finding
            current_file = Path(__file__).resolve()
            # Climb up from /backend/utils/logger.py to root (3 levels)
            project_root = current_file.parents[2] 
            log_dir = project_root / "logs"
            
            if not log_dir.exists():
                log_dir.mkdir(parents=True, exist_ok=True)
            
            log_filename = "cinesync.log"
            file_handler = RotatingFileHandler(
                log_dir / log_filename,
                maxBytes=5*1024*1024, # 5MB
                backupCount=3
            )
            file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(logging.Formatter('%(name)s - %(levelname)s - %(message)s'))
            
            logger.addHandler(file_handler)
            logger.addHandler(console_handler)
            
    return logger
