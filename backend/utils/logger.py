import logging
import os
from datetime import datetime

def get_logger(name: str):
    """
    Returns a configured logger instance (Functional approach).
    Logs are written to both the console and a file in the logs/ directory.
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Create logs directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        # File handler
        log_filename = datetime.now().strftime("%Y-%m-%d") + "_cinesync.log"
        file_handler = logging.FileHandler(os.path.join(log_dir, log_filename))
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(name)s - %(levelname)s - %(message)s'
        ))
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
    return logger
