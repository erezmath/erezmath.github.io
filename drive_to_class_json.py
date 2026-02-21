import os
import json
import re
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle
from natsort import natsorted
import shutil
from logger import log_event
from datetime import datetime
import pytz
import markdown
import base64
from bs4 import BeautifulSoup
from datetime import datetime


log_event('Drive-to-class JSON generation started')

# If modifying these SCOPES, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_PATH = 'secrets/credentials.json'
TOKEN_PATH = 'secrets/token.pickle'
DATA_DIR = 'data'

# Folder listing cache. Each folder_id has its own cache file.
CACHE_DIR = os.path.join('cache', 'folder_listings')
# Cached full lesson objects (when folder unchanged: skip README, lesson.json, crawl_lesson_content)
LESSON_OBJ_CACHE_DIR = os.path.join('cache', 'lesson_objects')
# Changes API: saved startPageToken for next run (cleared when clearing all cache)
CHANGES_STATE_PATH = os.path.join('cache', 'changes_state.json')

# Assignments filename (can be changed easily)
ASSIGNMENTS_FILENAME = 'assignments.md'

# List of filenames to ignore during crawling (case-insensitive)
IGNORED_FILENAMES = [
    'desktop.ini',          # Windows hidden files
    'readme.md',            # readme files
    'readme.txt',           # readme files
    'thumbs.db',            # Windows hidden files
    '.ds_store',            # Mac hidden files
    'autorun.inf',          # Windows hidden files
    'folder.jpg',           # folder images
    'albumart.jpg',          # folder images
    'folder.gif',           # folder images
    'albumart.gif',          # folder images
    'lesson.json',          # lesson json files
]

class_info = [
    {
        'id': 1,
        'name': 'כיתה ט מצוינות תשפה',
        'url_name': 'tet-metzuyanut-tashpa',
        'google_drive_url': 'https://drive.google.com/drive/folders/1kmeVVOKVB6BpEYtTl6Ykm8I_w6ZgeJRV',
        'banner_url': 'images/banner1.png',
        'active': False,         # whether to show the class is tought this year, or was tought in previous years
        'regenerate': False      # whether to recreate JSON files for this class (False = keep old files, True = recreate)
    },
    {
        'id': 2,
        'name': 'כיתה י 571 תשפה',
        'url_name': 'yud-571-tashpa',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1gekcNiBMvx5iOAN-3VvKJICSTnGXDlNa',
        'banner_url': 'images/banner2.jpg',
        'active': False,
        'regenerate': False
    },
    {
        'id': 3,
        'name': 'בגרויות 571 ופתרונות',
        'url_name': 'bagruyot-571',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/17RadCCMJ-XTzRpTnrhw_9lyGJNG-Wf37',
        'banner_url': 'images/banner571.png',
        'active': False,
        'regenerate': False
    },
    {
        'id': 4,
        'name': 'בגרויות 472 ופתרונות',
        'url_name': 'bagruyot-472',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1GA90OEL-eUycrz8saqRe4SBtBokhZCIO',
        'banner_url': 'images/banner472.png',
        'active': False,
        'regenerate': False
    },
    {
        'id': 5,
        'name': 'בגרויות 471 ופתרונות',
        'url_name': 'bagruyot-471',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1wqO2uIe1VbEoff4xtj_rWIDF6O0bLBcW',
        'banner_url': 'images/banner471.png',
        'active': False,
        'regenerate': False
    },
    {
        'id': 6,
        'name': 'אולימפיאדה במתמטיקה',
        'url_name': 'olimpiada-matematica',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1qgRnXxYhzL_0_EVak6rChNcVJ1HKexpL',
        'banner_url': 'images/olympiad.png',
        'active': False,
        'regenerate': False
    },
    {
        'id': 7,
        'name': 'כיתה י 571 תשפו',
        'url_name': 'yud-571-tashpav',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1ao6g6Ox6XNi8HKuvmUpeXH9MNC66YwBZ',
        'banner_url': 'images/banner3.png',
        'active': True,
        'regenerate': True
    },
    {
        'id': 8,
        'name': 'כיתה יא 571 תשפו',
        'url_name': 'yud-aleph-571-tashpav',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1i5qAJbRhg4D5NjR5jbRVsWbunfGinyCK?usp=drive_link',
        'banner_url': 'images/banner4.png',
        'active': True,
        'regenerate': True
    }
]

def get_drive_service():
    """Authenticate and return a Google Drive service client. if changing credentials, delete token.pickle"""
    creds = None
    if os.path.exists(TOKEN_PATH):
        with open(TOKEN_PATH, 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_PATH, 'wb') as token:
            pickle.dump(creds, token)
    return build('drive', 'v3', credentials=creds)

def create_base64_credentials():
    """Create base64-encoded credentials file for GitHub Actions if it doesn't exist."""
    base64_path = os.path.join('secrets', 'credentials.b64')
    
    # Only create if the base64 file doesn't exist
    if not os.path.exists(base64_path):
        if os.path.exists(CREDENTIALS_PATH):
            # Read the credentials file
            with open(CREDENTIALS_PATH, 'rb') as f:
                credentials_content = f.read()
            
            # Encode to base64
            base64_content = base64.b64encode(credentials_content).decode('utf-8')
            
            # Write the base64 file
            with open(base64_path, 'w') as f:
                f.write(base64_content)
            
            print(f"Created {base64_path} for GitHub Actions")
            log_event(f"Created {base64_path} for GitHub Actions")
        else:
            print(f"Warning: {CREDENTIALS_PATH} not found, cannot create base64 credentials")
            log_event(f"Warning: {CREDENTIALS_PATH} not found, cannot create base64 credentials")

def extract_folder_id(url):
    """Extract the folder ID from a Google Drive URL."""
    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url)
    return match.group(1) if match else url

def read_readme_file(service, folder_id, folder_items):
    """
    Read README.md file from a Google Drive folder and return its HTML content.
    
    Args:
        service: Google Drive service object
        folder_id: ID of the folder to search
        folder_items: List of items already fetched from folder listing.
    """
    try:
        readme_file_id = None
        
        # Check folder_items for README.md
        for item in folder_items:
            if item.get('name') == 'README.md' and item.get('mimeType') != 'application/vnd.google-apps.folder':
                readme_file_id = item.get('id')
                break
        
        # If not found, return empty string (file doesn't exist)
        if not readme_file_id:
            return ""
        
        # Download the file content
        file_content = service.files().get_media(fileId=readme_file_id).execute()
        
        # Decode the content (assuming UTF-8 encoding)
        markdown_text = file_content.decode('utf-8')
        
        # Convert markdown to HTML with better options for Hebrew text
        html_content = markdown.markdown(markdown_text, extensions=['extra', 'codehilite'])
        
        return html_content
        
    except Exception as e:
        log_event(f"Error reading README.md from folder {folder_id}: {str(e)}")
        return ""

def read_lesson_json(service, folder_id, folder_items):
    """
    Read lesson.json file from a Google Drive folder and return its parsed JSON object.
    Returns an empty dict if the file does not exist or cannot be parsed.
    
    Args:
        service: Google Drive service object
        folder_id: ID of the folder to search
        folder_items: List of items already fetched from folder listing.
    """
    try:
        lesson_json_id = None
        
        # Check folder_items for lesson.json
        for item in folder_items:
            if item.get('name') == 'lesson.json' and item.get('mimeType') != 'application/vnd.google-apps.folder':
                lesson_json_id = item.get('id')
                break
        
        # If not found, return empty dict (file doesn't exist)
        if not lesson_json_id:
            return {}
        
        file_content = service.files().get_media(fileId=lesson_json_id).execute()
        json_text = file_content.decode('utf-8')
        return json.loads(json_text)
    except Exception as e:
        log_event(f"Error reading lesson.json from folder {folder_id}: {str(e)}")
        return {}

def _hebrew_day_name(weekday: int) -> str:
    # Python weekday(): Monday=0 ... Sunday=6
    # Correct Hebrew day names aligned to weekday()
    day_names = ["שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת", "ראשון"]
    return day_names[weekday] if 0 <= weekday < len(day_names) else ""

def _format_due_date(due_str: str) -> str:
    """
    Parse dd-mm-yyyy or dd.mm.yyyy (2 or 4 digit year) and return
    'יום, dd.mm.yyyy' in Hebrew. Returns empty string on failure.
    """
    if not due_str:
        return ""
    due_str = due_str.strip()
    # allow - or .
    parts = due_str.replace('.', '-').split('-')
    if len(parts) != 3:
        return ""
    try:
        d = int(parts[0])
        m = int(parts[1])
        y = int(parts[2])
        if y < 100:
            y += 2000
        dt = datetime(y, m, d)
        # weekday(): Monday=0 ... Sunday=6
        heb_day = _hebrew_day_name(dt.weekday())
        dd = f"{d:02d}"
        mm = f"{m:02d}"
        yyyy = f"{y:04d}"
        return f"{heb_day}, {dd}.{mm}.{yyyy}"
    except Exception:
        return ""

def read_assignments_file(service, folder_id, folder_items):
    """
    Read assignments.md file from a Google Drive folder and return its HTML content and file ID.
    Only the content up to and including the 4th <hr> tag is kept in the HTML for performance.
    NOTE: If you change the number of blocks here, you must also update the JS logic in static/main.js
    to keep the frontend and backend in sync.
    
    Args:
        service: Google Drive service object
        folder_id: ID of the folder to search
        folder_items: List of items already fetched from folder listing.
    """
    try:
        assignments_file_id = None
        
        # Check folder_items for assignments.md
        for item in folder_items:
            if item.get('name') == ASSIGNMENTS_FILENAME and item.get('mimeType') != 'application/vnd.google-apps.folder':
                assignments_file_id = item.get('id')
                break
        
        # If not found, return empty strings (file doesn't exist)
        if not assignments_file_id:
            return "", ""
        
        # Download the file content
        file_content = service.files().get_media(fileId=assignments_file_id).execute()
        
        # Decode the content (assuming UTF-8 encoding)
        markdown_text = file_content.decode('utf-8')
        
        # Clean up escaped characters that might interfere with markdown parsing
        # Remove backslashes before markdown syntax characters
        markdown_text = markdown_text.replace('\\#', '#')
        markdown_text = markdown_text.replace('\\-', '-')
        markdown_text = markdown_text.replace('\\*', '*')
        markdown_text = markdown_text.replace('\\_', '_')
        markdown_text = markdown_text.replace('\\`', '`')
        markdown_text = markdown_text.replace('\\>', '>')
        markdown_text = markdown_text.replace('\\|', '|')
        
        # Convert markdown to HTML with better options for Hebrew text
        html_content = markdown.markdown(markdown_text, extensions=['extra', 'codehilite'])
        
        # Truncate to only the content up to and including the 4th <hr> tag
        # If you change this, update static/main.js accordingly!
        N = 4
        hr_count = 0
        last_index = len(html_content)
        search_start = 0
        while hr_count < N:
            idx = html_content.find('<hr', search_start)
            if idx == -1:
                break
            hr_count += 1
            # Find the closing > of this <hr ...>
            close_idx = html_content.find('>', idx)
            if close_idx == -1:
                break
            last_index = close_idx + 1
            search_start = close_idx + 1
        truncated_html = html_content[:last_index]
        
        return truncated_html, assignments_file_id
        
    except Exception as e:
        log_event(f"Error reading {ASSIGNMENTS_FILENAME} from folder {folder_id}: {str(e)}")
        return "", ""


def extract_lesson_number(name):
    """Extract the leading number from a lesson name for proper sorting."""
    match = re.match(r'^(\d+(?:\.\d+)?)', name)
    if match:
        return float(match.group(1))
    return float('inf')  # Put items without numbers at the end


def _folder_cache_path(folder_id):
    """Return cache file path for a folder (safe for any folder_id including nested subfolders)."""
    # Folder IDs are alphanumeric with - and _; sanitize for filesystem
    safe_id = re.sub(r'[^\w\-]', '_', folder_id)
    return os.path.join(CACHE_DIR, f"{safe_id}.json")


def clear_folder_listing_cache(folder_id=None):
    """
    Clear folder listing cache (and lesson object cache when clearing all).
    If folder_id is given, clear only that folder's cache; otherwise clear all.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    if folder_id:
        path = _folder_cache_path(folder_id)
        if os.path.exists(path):
            os.remove(path)
            log_event(f"Cleared cache for folder {folder_id}")
        lesson_path = _lesson_cache_path(folder_id)
        if os.path.exists(lesson_path):
            os.remove(lesson_path)
    else:
        for name in os.listdir(CACHE_DIR):
            if name.endswith('.json'):
                os.remove(os.path.join(CACHE_DIR, name))
        log_event("Cleared all folder listing cache")
        if os.path.isdir(LESSON_OBJ_CACHE_DIR):
            for name in os.listdir(LESSON_OBJ_CACHE_DIR):
                if name.endswith('.json'):
                    os.remove(os.path.join(LESSON_OBJ_CACHE_DIR, name))
            log_event("Cleared all lesson object cache")
        if os.path.exists(CHANGES_STATE_PATH):
            os.remove(CHANGES_STATE_PATH)
            log_event("Cleared changes state (startPageToken)")


def _lesson_cache_path(folder_id):
    """Return cache file path for a lesson object (keyed by lesson folder_id)."""
    safe_id = re.sub(r'[^\w\-]', '_', folder_id)
    return os.path.join(LESSON_OBJ_CACHE_DIR, f"{safe_id}.json")


def get_cached_lesson_obj(lesson_folder_id, folder_modified_time):
    """
    Return cached lesson object if it exists and matches folder modified_time.
    Lesson object has keys: name, desc, content, lesson_json (id is set by caller).
    """
    path = _lesson_cache_path(lesson_folder_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if data.get('modified_time') != folder_modified_time:
            return None
        #log_event(f"Lesson object cache hit for folder {lesson_folder_id}")
        return data.get('lesson_obj')
    except Exception as e:
        log_event(f"Lesson cache read error for {lesson_folder_id}: {str(e)}")
        return None


def save_lesson_obj_cache(lesson_folder_id, folder_modified_time, lesson_obj):
    """Save lesson object to cache (stores name, desc, content, lesson_json; id set by caller)."""
    os.makedirs(LESSON_OBJ_CACHE_DIR, exist_ok=True)
    path = _lesson_cache_path(lesson_folder_id)
    # Store without 'id' so it's stable; caller sets id when using
    cache_obj = {
        'name': lesson_obj['name'],
        'desc': lesson_obj['desc'],
        'content': lesson_obj['content'],
        'lesson_json': lesson_obj['lesson_json'],
    }
    data = {
        'modified_time': folder_modified_time,
        'cached_at': datetime.now().isoformat(),
        'lesson_obj': cache_obj,
    }
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        log_event(f"Cached lesson object for folder {lesson_folder_id}")
    except Exception as e:
        log_event(f"Lesson cache write error for {lesson_folder_id}: {str(e)}")


def list_folder_contents(service, folder_id, use_cache=True, invalidated_ids=None):
    """
    List all files and folders in a Google Drive folder.
    When use_cache is True and folder_id is not in invalidated_ids, returns cached
    listing if present (no API calls). Otherwise fetches from API and updates cache.
    Invalidated folders are those known to have changed (from Drive Changes API).

    Returns:
        (items, cache_info): items is list of file/folder dicts; cache_info is
        {"modified_time": str|None, "from_cache": bool}.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_file = _folder_cache_path(folder_id)
    cache_info = {"modified_time": None, "from_cache": False}
    invalidated_ids = invalidated_ids or set()

    # Use cache only when enabled, folder not invalidated, and cache file exists
    if use_cache and folder_id not in invalidated_ids and os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            cache_info["modified_time"] = cache_data.get('modified_time')
            cache_info["from_cache"] = True
            return cache_data.get('items', []), cache_info
        except HttpError as e:
            if e.resp.status == 404:
                if os.path.exists(cache_file):
                    os.remove(cache_file)
                raise
            log_event(f"Cache check failed for {folder_id}: {e}, fetching fresh")
        except Exception as e:
            log_event(f"Cache read error for {folder_id}: {str(e)}, fetching fresh")

    log_event(f"Fetching folder {folder_id} from API")
    # Fetch full listing from API
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(
        q=query,
        fields="files(id, name, mimeType)",
        pageSize=1000
    ).execute()
    files = results.get('files', [])

    # Get folder's modifiedTime for cache
    try:
        folder_meta = service.files().get(
            fileId=folder_id,
            fields="modifiedTime"
        ).execute()
        modified_time = folder_meta.get('modifiedTime')
    except Exception as e:
        log_event(f"Could not get modifiedTime for {folder_id}: {e}")
        modified_time = None

    cache_info["modified_time"] = modified_time

    sorted_items = sorted(
        files,
        key=lambda x: (extract_lesson_number(x['name']), x['name'])
    )

    cache_data = {
        "folder_id": folder_id,
        "modified_time": modified_time,
        "cached_at": datetime.now().isoformat(),
        "items": sorted_items,
    }
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        log_event(f"Cached listing for folder {folder_id}")
    except Exception as e:
        log_event(f"Cache write error for {folder_id}: {str(e)}")

    return sorted_items, cache_info


# old implementation - had an issue with folders with the name 13.5 appearing before 13, and not after, that's why the above methods were introduced.
#def list_folder_contents(service, folder_id):
#    """List all files and folders in a Google Drive folder."""
#    query = f"'{folder_id}' in parents and trashed = false"
#    results = service.files().list(q=query, fields="files(id, name, mimeType)", pageSize=1000).execute()
#    files = results.get('files', [])
#    return natsorted(files, key=lambda x: x['name'])

def crawl_lesson_content(service, folder_id, use_cache=True, invalidated_ids=None):
    """Recursively crawl the contents of a lesson folder."""
    invalidated_ids = invalidated_ids or set()
    items, _ = list_folder_contents(service, folder_id, use_cache=use_cache, invalidated_ids=invalidated_ids)
    content = []
    for item in items:
        if item['mimeType'] == 'application/vnd.google-apps.folder':
            content.append({
                'type': 'folder',
                'name': item['name'],
                'content': crawl_lesson_content(service, item['id'], use_cache=use_cache, invalidated_ids=invalidated_ids)
            })
        else:
            # Check if the file should be ignored
            filename = item['name'].lower()
            if filename in [ignored.lower() for ignored in IGNORED_FILENAMES]:
                continue  # Skip this file
            
            # Remove .pdf extension for display, but keep original name for download
            name = re.sub(r'\.pdf$', '', item['name'], flags=re.IGNORECASE)
            content.append({
                'type': 'file',
                'name': name,
                'url': f'https://drive.google.com/file/d/{item["id"]}/view'
            })
    return content

def crawl_class(service, class_name, folder_id, banner_url, url_name, active, class_id, invalidated_ids=None, use_cache=True):
    """Crawl all topics and lessons for a class."""
    invalidated_ids = invalidated_ids or set()
    # Get root folder contents once
    root_folder_items, _ = list_folder_contents(service, folder_id, use_cache=use_cache, invalidated_ids=invalidated_ids)
    
    # Read assignments.md file first, using root folder items to avoid redundant query
    assignments_content, assignments_file_id = read_assignments_file(service, folder_id, root_folder_items)
    
    topics = []
    topic_folders = [f for f in root_folder_items if f['mimeType'] == 'application/vnd.google-apps.folder']
    for topic_index, topic in enumerate(topic_folders, 1):
        topic_obj = {
            'name': topic['name'],
            'id': topic['name'].replace(' ', '-').replace('.', '').replace('/', '-').lower(),
            'lessons': []
        }
        # Get topic folder contents once
        topic_folder_items, _ = list_folder_contents(service, topic['id'], use_cache=use_cache, invalidated_ids=invalidated_ids)
        lesson_folders = [f for f in topic_folder_items if f['mimeType'] == 'application/vnd.google-apps.folder']
        for lesson_index, lesson in enumerate(lesson_folders, 1):
            # Get lesson folder contents once
            lesson_folder_items, lesson_cache_info = list_folder_contents(service, lesson['id'], use_cache=use_cache, invalidated_ids=invalidated_ids)
            
            # If folder unchanged, try to use cached full lesson object (skip README, lesson.json, crawl)
            if lesson_cache_info.get("from_cache") and lesson_cache_info.get("modified_time"):
                cached_lesson = get_cached_lesson_obj(lesson['id'], lesson_cache_info["modified_time"])
                if cached_lesson is not None:
                    lesson_obj = {
                        'name': cached_lesson['name'],
                        'desc': cached_lesson['desc'],
                        'id': f"{topic_index}-{lesson_index}",
                        'content': cached_lesson['content'],
                        'lesson_json': cached_lesson['lesson_json'],
                    }
                    topic_obj['lessons'].append(lesson_obj)
                    continue
            
            # Build lesson object (folder changed or no cache)
            lesson_description = read_readme_file(service, lesson['id'], lesson_folder_items)
            lesson_meta = read_lesson_json(service, lesson['id'], lesson_folder_items)
            if 'due_date' in lesson_meta:
                display = _format_due_date(lesson_meta.get('due_date', ''))
                if display:
                    lesson_meta['due_date_display'] = display
            
            lesson_obj = {
                'name': lesson['name'],
                'desc': lesson_description,
                'id': f"{topic_index}-{lesson_index}",
                'content': crawl_lesson_content(service, lesson['id'], use_cache=use_cache, invalidated_ids=invalidated_ids),
                'lesson_json': lesson_meta
            }
            topic_obj['lessons'].append(lesson_obj)
            # Cache for next run when folder is unchanged
            if lesson_cache_info.get("modified_time"):
                save_lesson_obj_cache(lesson['id'], lesson_cache_info["modified_time"], lesson_obj)
        topics.append(topic_obj)
    tags = [t['name'] for t in topics]
    return {
        'id': class_id,  # Use the hardcoded id from class_info
        'name': class_name,
        'url_name': url_name,  # Hardcoded URL slug
        'banner_url': banner_url,
        'desc': '',
        'tags': tags,
        'topics': topics,
        'assignments': assignments_content,
        'assignments_file_id': assignments_file_id,
        'active': active
    }

def main():
    """Main process: selectively crawls classes based on regenerate flag, writes JSON only for classes that need updating."""
    import argparse
    parser = argparse.ArgumentParser(description='Generate class JSON from Google Drive.')
    parser.add_argument('--no-cache', action='store_true', help='Disable all caching (full fetch every time, for testing or major changes).')
    args = parser.parse_args()
    use_cache = not args.no_cache

    log_event('Main process started')
    print('Main process started!')
    # Record the start time
    start_time = datetime.now()

    # Create data directory if it doesn't exist
    os.makedirs(DATA_DIR, exist_ok=True)

    service = get_drive_service()

    # Resolve affected folder IDs and start token via Changes API when using cache
    affected_folder_ids = set()
    new_start_page_token = None
    if use_cache:
        import drive_changes
        saved_token = None
        if os.path.exists(CHANGES_STATE_PATH):
            try:
                with open(CHANGES_STATE_PATH, 'r', encoding='utf-8') as f:
                    state = json.load(f)
                saved_token = state.get('startPageToken')
            except Exception as e:
                log_event(f"Could not load changes state: {e}")
        if saved_token:
            try:
                changes_list, new_start_page_token = drive_changes.fetch_changes(service, saved_token)
                changes_path = drive_changes.persist_changes(changes_list, new_start_page_token)
                log_event(f"Persisted {len(changes_list)} changes to {changes_path}")
                data = drive_changes.load_changes(changes_path)
                affected_folder_ids = drive_changes.compute_affected_folder_ids(
                    data['changes'], CACHE_DIR
                )
                if affected_folder_ids:
                    log_event(f"Affected folder IDs (will refetch): {len(affected_folder_ids)}")
            except Exception as e:
                log_event(f"Changes API error: {e}; clearing changes state so next run does full crawl")
                if os.path.exists(CHANGES_STATE_PATH):
                    os.remove(CHANGES_STATE_PATH)
                affected_folder_ids = set()
                new_start_page_token = None
        else:
            # No previous token: full crawl this run; get token at end for next run
            new_start_page_token = None  # will fetch at end
    else:
        log_event('Cache disabled (--no-cache)')

    # Use hardcoded ids from class_info
    for cls in class_info:
        class_name = cls['name']
        class_id = cls['id']  # Use hardcoded id
        url_name = cls['url_name']  # Keep hardcoded url_name
        folder_url = cls['google_drive_url']
        banner_url = cls.get('banner_url', '')
        active = cls.get('active', False)
        regenerate = cls.get('regenerate', True)  # Default to True for backward compatibility

        # Check if we should regenerate this class
        if not regenerate:
            log_event(f'Skipping {url_name} - regenerate=False, keeping existing JSON file')
            print(f'Skipping {url_name} - regenerate=False, keeping existing JSON file')
            continue

        folder_id = extract_folder_id(folder_url)
        log_event(f'Crawling url_name: {url_name} (folder_url: {folder_url})')
        class_json = crawl_class(
            service, class_name, folder_id, banner_url, url_name, active, class_id,
            invalidated_ids=affected_folder_ids, use_cache=use_cache
        )
        # Use url_name for output filename
        out_path = os.path.join(DATA_DIR, f'class-{url_name}.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(class_json, f, ensure_ascii=False, indent=2)
        log_event(f'Wrote {out_path}')
        print(f'Wrote {out_path}')
    log_event('All classes processed. JSON generation complete.')

    # Save new start page token for next run when using cache
    if use_cache and new_start_page_token:
        os.makedirs(os.path.dirname(CHANGES_STATE_PATH), exist_ok=True)
        try:
            with open(CHANGES_STATE_PATH, 'w', encoding='utf-8') as f:
                json.dump({'startPageToken': new_start_page_token}, f, indent=2)
            log_event('Saved changes state for next run')
        except Exception as e:
            log_event(f"Could not save changes state: {e}")
    elif use_cache and not os.path.exists(CHANGES_STATE_PATH):
        # First run with cache: get current token so next run can use changes
        try:
            import drive_changes
            start_token_resp = service.changes().getStartPageToken().execute()
            token = start_token_resp.get('startPageToken')
            if token:
                os.makedirs(os.path.dirname(CHANGES_STATE_PATH), exist_ok=True)
                with open(CHANGES_STATE_PATH, 'w', encoding='utf-8') as f:
                    json.dump({'startPageToken': token}, f, indent=2)
                log_event('Saved initial changes state for next run')
        except Exception as e:
            log_event(f"Could not save initial changes state: {e}")

    # Record the end time
    end_time = datetime.now()
    # Calculate the total time taken
    total_time = end_time - start_time
    print(f"Total time taken: {total_time.total_seconds()} seconds to run.")
    print(f'Total time taken: {total_time}')
    print('All classes processed. JSON generation complete.')

if __name__ == '__main__':
    main() 