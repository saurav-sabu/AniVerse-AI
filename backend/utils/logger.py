import logging
from logging.handlers import RotatingFileHandler
import os
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
    - Production: JSON logging to stdout (Defect 14)
    - Development: Pretty-printed console and file logging
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        # Configurable log level (Defect 14)
        level_name = os.getenv("LOG_LEVEL", "INFO").upper()
        level = getattr(logging, level_name, logging.INFO)
        logger.setLevel(level)
        
        env = os.getenv("ENV", "development").lower()
        
        if env == "production":
            # Production: JSON to stdout only (Defect 14)
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(JSONFormatter())
            logger.addHandler(console_handler)
        else:
            # Development: Console + File logging
            log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            log_filename = "cinesync.log"
            file_handler = RotatingFileHandler(
                os.path.join(log_dir, log_filename),
                maxBytes=5*1024*1024, # 5MB
                backupCount=3
            )
            file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(logging.Formatter('%(name)s - %(levelname)s - %(message)s'))
            
            logger.addHandler(file_handler)
            logger.addHandler(console_handler)
            
    return logger
