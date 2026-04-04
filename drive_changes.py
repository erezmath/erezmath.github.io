"""
Drive Changes API: fetch changes since last build, persist to timestamped files,
and compute which folder IDs need cache invalidation.
Files are kept for tracking and debugging (never deleted by this module).
"""
import os
import json
from datetime import datetime

CHANGES_API_DIR = 'changes_api'
# Timestamp format: dd-mm-yyyy_hh-mm-ss (day, month, year, hour, minute, second)
CHANGES_FILENAME_PREFIX = 'changes-'


def _timestamp_str():
    """Return current timestamp in format dd-mm-yyyy_hh-mm-ss."""
    now = datetime.now()
    return now.strftime('%d-%m-%Y_%H-%M-%S')


def fetch_changes(service, page_token):
    """
    Fetch all changes since page_token from Drive API. Paginates until done.
    Returns (changes_list, new_start_page_token).
    new_start_page_token is None until the last page is received.
    """
    changes_list = []
    new_start_page_token = None
    token = page_token
    fields = "nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, parents, trashed))"
    while token is not None:
        response = service.changes().list(
            pageToken=token,
            spaces='drive',
            includeRemoved=True,
            restrictToMyDrive=True,
            fields=fields,
            pageSize=1000,
        ).execute()
        changes_list.extend(response.get('changes', []))
        new_start_page_token = response.get('newStartPageToken')
        token = response.get('nextPageToken')
    return changes_list, new_start_page_token


def persist_changes(changes_list, new_start_page_token):
    """
    Save changes to a timestamped file in changes_api/.
    File name: changes-dd-mm-yyyy_hh-mm-ss.json
    Does not delete any existing files. Returns path to the written file.
    changes_list may be empty.
    """
    os.makedirs(CHANGES_API_DIR, exist_ok=True)
    ts = _timestamp_str()
    filename = f"{CHANGES_FILENAME_PREFIX}{ts}.json"
    path = os.path.join(CHANGES_API_DIR, filename)
    data = {
        'timestamp': ts,
        'saved_at': datetime.now().isoformat(),
        'newStartPageToken': new_start_page_token,
        'change_count': len(changes_list),
        'changes': changes_list,
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


def load_changes(filepath):
    """
    Load changes data from a persisted file into memory.
    Returns the full data dict (keys: timestamp, saved_at, newStartPageToken, change_count, changes).
    Use data['changes'] for the list of changes.
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def compute_affected_folder_ids(changes_list, folder_listings_cache_dir):
    """
    Compute which folder IDs need their cache invalidated because their
    folder listing cache is stale (they contain a changed or removed item).
    Bubbles up invalidations to ancestor folders (so Lesson caches correctly drop).
    """
    affected = set()
    for change in changes_list:
        file_id = change.get('fileId')
        if not file_id:
            continue
        file_obj = change.get('file')
        if file_obj and file_obj.get('parents'):
            affected.update(file_obj['parents'])
            continue
        if change.get('removed'):
            # Find which cached folder contained this file
            if not os.path.isdir(folder_listings_cache_dir):
                continue
            for name in os.listdir(folder_listings_cache_dir):
                if not name.endswith('.json'):
                    continue
                cache_path = os.path.join(folder_listings_cache_dir, name)
                try:
                    with open(cache_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    items = data.get('items', [])
                    folder_id = data.get('folder_id')
                    # Check for normal id or intercepted shortcutId
                    if folder_id and any(item.get('id') == file_id or item.get('shortcutId') == file_id for item in items):
                        affected.add(folder_id)
                        break
                except Exception:
                    continue

    # --- NEW LOGIC: Bubble up invalidations to ancestors ---
    # Build a map of child -> parent from the local cache
    child_to_parent = {}
    if os.path.isdir(folder_listings_cache_dir):
        for name in os.listdir(folder_listings_cache_dir):
            if name.endswith('.json'):
                try:
                    with open(os.path.join(folder_listings_cache_dir, name), 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        parent_id = data.get('folder_id')
                        if parent_id:
                            for item in data.get('items', []):
                                child_to_parent[item['id']] = parent_id
                                # Map shortcutId too, if it exists
                                if 'shortcutId' in item:
                                    child_to_parent[item['shortcutId']] = parent_id
                except Exception:
                    pass

    # Trace upwards to invalidate all ancestors (e.g., Lesson folders)
    ancestors = set()
    for f_id in affected:
        curr = f_id
        while curr in child_to_parent:
            p_id = child_to_parent[curr]
            if p_id in ancestors or p_id in affected:
                break # Already processed this branch
            ancestors.add(p_id)
            curr = p_id
            
    affected.update(ancestors)
    # -------------------------------------------------------

    return affected