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


log_event('Drive-to-class JSON generation started')

# If modifying these SCOPES, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_PATH = 'secrets/credentials.json'
TOKEN_PATH = 'secrets/token.pickle'
DATA_DIR = 'data'

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
    'albumart.gif'          # folder images
]

class_info = [
    {
        'id': 1,
        'name': 'כיתה ט מצוינות תשפה',
        'url_name': 'tet-metzuyanut-tashpa',
        'google_drive_url': 'https://drive.google.com/drive/folders/1kmeVVOKVB6BpEYtTl6Ykm8I_w6ZgeJRV',
        'banner_url': 'images/banner1.png',
        'active': False         # whether to show the class is tought this year, or was tought in previous years
    },
    {
        'id': 2,
        'name': 'כיתה י 571 תשפה',
        'url_name': 'yud-571-tashpa',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1gekcNiBMvx5iOAN-3VvKJICSTnGXDlNa',
        'banner_url': 'images/banner2.jpg',
        'active': False
    },
    {
        'id': 3,
        'name': 'כיתה י 571 תשפו',
        'url_name': 'yud-571-tashpav',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1tKiopu97rtKIrS08k7ye4cYBhWMdilVK',
        'banner_url': 'images/banner3.png',
        'active': True
    },
    {
        'id': 4,
        'name': 'כיתה יא 571 תשפו',
        'url_name': 'yud-aleph-571-tashpav',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1AlDviHsoPnyfxxdUx6E46gBH1JrON4-k',
        'banner_url': 'images/banner4.png',
        'active': True
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

def read_readme_file(service, folder_id):
    """Read README.md file from a Google Drive folder and return its HTML content."""
    try:
        # Look for README.md file in the folder
        query = f"'{folder_id}' in parents and name = 'README.md' and trashed = false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get('files', [])
        
        if not files:
            return ""
        
        # Get the first README.md file found
        readme_file_id = files[0]['id']
        
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

def read_assignments_file(service, folder_id):
    """
    Read assignments.md file from a Google Drive folder and return its HTML content and file ID.
    Only the content up to and including the 4th <hr> tag is kept in the HTML for performance.
    NOTE: If you change the number of blocks here, you must also update the JS logic in static/main.js
    to keep the frontend and backend in sync.
    """
    try:
        # Look for assignments.md file in the folder
        query = f"'{folder_id}' in parents and name = '{ASSIGNMENTS_FILENAME}' and trashed = false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get('files', [])
        
        if not files:
            return "", ""
        
        # Get the first assignments.md file found
        assignments_file_id = files[0]['id']
        
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

def list_folder_contents(service, folder_id):
    """List all files and folders in a Google Drive folder."""
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name, mimeType)", pageSize=1000).execute()
    files = results.get('files', [])
    return natsorted(files, key=lambda x: x['name'])

def crawl_lesson_content(service, folder_id):
    """Recursively crawl the contents of a lesson folder."""
    items = list_folder_contents(service, folder_id)
    content = []
    for item in items:
        if item['mimeType'] == 'application/vnd.google-apps.folder':
            content.append({
                'type': 'folder',
                'name': item['name'],
                'content': crawl_lesson_content(service, item['id'])
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

def crawl_class(service, class_name, folder_id, banner_url, url_name, active, class_id):
    """Crawl all topics and lessons for a class."""
    # Read assignments.txt file first
    assignments_content, assignments_file_id = read_assignments_file(service, folder_id)
    
    topics = []
    topic_folders = [f for f in list_folder_contents(service, folder_id) if f['mimeType'] == 'application/vnd.google-apps.folder']
    for topic_index, topic in enumerate(topic_folders, 1):
        topic_obj = {
            'name': topic['name'],
            'id': topic['name'].replace(' ', '-').replace('.', '').replace('/', '-').lower(),
            'lessons': []
        }
        lesson_folders = [f for f in list_folder_contents(service, topic['id']) if f['mimeType'] == 'application/vnd.google-apps.folder']
        for lesson_index, lesson in enumerate(lesson_folders, 1):
            # Read README.md file for lesson description
            lesson_description = read_readme_file(service, lesson['id'])
            
            lesson_obj = {
                'name': lesson['name'],
                'desc': lesson_description,
                'id': f"{topic_index}-{lesson_index}",  # Add lesson ID in format "topic-lesson"
                'content': crawl_lesson_content(service, lesson['id'])
            }
            topic_obj['lessons'].append(lesson_obj)
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
    """Main process: cleans data dir, crawls all classes, writes JSON."""
    log_event('Main process started')
    print('Main process started!')
    # Clean data directory before generating new JSON files
    if os.path.exists(DATA_DIR):
        shutil.rmtree(DATA_DIR)
    os.makedirs(DATA_DIR, exist_ok=True)
    service = get_drive_service()
    
    # Create base64 credentials for GitHub Actions if needed
    create_base64_credentials()
    
    # Use hardcoded ids from class_info
    for cls in class_info:
        class_name = cls['name']
        class_id = cls['id']  # Use hardcoded id
        url_name = cls['url_name']  # Keep hardcoded url_name
        folder_url = cls['google_drive_url']
        banner_url = cls.get('banner_url', '')
        active = cls.get('active', False)
        folder_id = extract_folder_id(folder_url)
        log_event(f'Crawling url_name: {url_name} (folder_url: {folder_url})')
        class_json = crawl_class(service, class_name, folder_id, banner_url, url_name, active, class_id)
        # Use url_name for output filename
        out_path = os.path.join(DATA_DIR, f'class-{url_name}.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(class_json, f, ensure_ascii=False, indent=2)
        log_event(f'Wrote {out_path}')
        print(f'Wrote {out_path}')
    log_event('All classes processed. JSON generation complete.')
    print('All classes processed. JSON generation complete.')

if __name__ == '__main__':
    main() 