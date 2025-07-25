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


log_event('Drive-to-class JSON generation started')

# If modifying these SCOPES, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_PATH = 'secrets/credentials.json'
TOKEN_PATH = 'secrets/token.pickle'
DATA_DIR = 'data'

class_info = [
    {
        'id': 1,
        'name': 'כיתה ט מצוינות תשפה',
        'url_name': 'tet-metzuyanut-tashpa',
        'google_drive_url': 'https://drive.google.com/drive/folders/11epRetDJViW9EWdomonlYWn6GUk55kC4',
        'banner_url': 'images/banner1.png',
        'active': False
    },
    {
        'id': 2,
        'name': 'כיתה י 571 תשפה',
        'url_name': 'yud-571-tashpa',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/18phQyja-bSXMpptBOYsg5ceGl0Y_WCC7',
        'banner_url': 'images/banner2.jpg',
        'active': False
    },
    {
        'id': 3,
        'name': 'כיתה י 571 תשפו',
        'url_name': 'yud-571-tashpav',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/1ntCk-M-LEXwF9evLkLkmW8IWlCTRyXVu',
        'banner_url': 'images/banner3.png',
        'active': True
    },
    {
        'id': 4,
        'name': 'כיתה יא 571 תשפו',
        'url_name': 'yud-aleph-571-tashpav',
        #'url_name': '271',
        'google_drive_url': 'https://drive.google.com/drive/folders/12g3Vabxfnlt8MXBgF_vBiY0aMnCeofcT',
        'banner_url': 'images/banner4.png',
        'active': True
    }
]

def get_drive_service():
    """Authenticate and return a Google Drive service client."""
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

def extract_folder_id(url):
    """Extract the folder ID from a Google Drive URL."""
    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url)
    return match.group(1) if match else url

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
    topics = []
    topic_folders = [f for f in list_folder_contents(service, folder_id) if f['mimeType'] == 'application/vnd.google-apps.folder']
    for topic in topic_folders:
        topic_obj = {
            'name': topic['name'],
            'id': topic['name'].replace(' ', '-').replace('.', '').replace('/', '-').lower(),
            'lessons': []
        }
        lesson_folders = [f for f in list_folder_contents(service, topic['id']) if f['mimeType'] == 'application/vnd.google-apps.folder']
        for lesson in lesson_folders:
            lesson_obj = {
                'name': lesson['name'],
                'desc': '',
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