import logging
from datetime import datetime
import pytz

LOG_FILE = 'build.log'
ISRAEL_TZ = pytz.timezone('Asia/Jerusalem')

logging.basicConfig(filename=LOG_FILE, level=logging.INFO, format='%(asctime)s %(message)s')

def log_event(msg):
    """Log a message with a timestamp in Israel local time (IST)."""
    now = datetime.now(ISRAEL_TZ).strftime('%Y-%m-%d %H:%M:%S')
    logging.info(f'[{now} IST] {msg}') 