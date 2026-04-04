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
    
    # Step 1: Gather directly affected folders from API changes
    for change in changes_list:
        file_id = change.get('fileId')
        if not file_id:
            continue
            
        # IMPORTANT FIX: Mark the changed file/folder itself as affected!
        # If a Lesson folder is renamed, its own ID needs to be in the affected list
        # so the lesson cache builder knows to reject the stale cache and rebuild it.
        affected.add(file_id)
            
        file_obj = change.get('file')
        if file_obj and file_obj.get('parents'):
            affected.update(file_obj['parents'])
            
    # Step 2: Thoroughly scan local cache to find historic parents 
    # (Crucial for deletions, renames, and shortcut resolution)
    child_to_parent = {}
    shortcut_to_target = {}
    
    if os.path.isdir(folder_listings_cache_dir):
        for name in os.listdir(folder_listings_cache_dir):
            if not name.endswith('.json'):
                continue
            cache_path = os.path.join(folder_listings_cache_dir, name)
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Fallback to empty list if items is None in the JSON
                items = data.get('items') or []
                parent_id = data.get('folder_id')
                
                if not parent_id:
                    continue
                    
                # Build tree map for Step 3 and shortcut resolution
                for item in items:
                    i_id = item.get('id')
                    s_id = item.get('shortcutId')
                    
                    if i_id:
                        child_to_parent[i_id] = parent_id
                    if s_id:
                        child_to_parent[s_id] = parent_id
                        shortcut_to_target[s_id] = i_id
                        
                # Check if any changed file was historically in this folder
                for change in changes_list:
                    c_id = change.get('fileId')
                    if c_id and any(i.get('id') == c_id or i.get('shortcutId') == c_id for i in items):
                        affected.add(parent_id)
            except Exception:
                continue

    # Step 2.5: Translate shortcut invalidations to their targets!
    # drive_to_class_json relies on Target IDs. If the Drive API flags a 
    # Shortcut ID as renamed, we must also flag its Target ID as changed.
    targets_to_add = set()
    for f_id in affected:
        if f_id in shortcut_to_target:
            targets_to_add.add(shortcut_to_target[f_id])
    affected.update(targets_to_add)

    # Step 3: Bubble up invalidations safely
    ancestors = set()
    for f_id in affected:
        curr = f_id
        # Hard limit depth to 50 to prevent infinite loops or premature breaks
        for _ in range(50):
            if curr not in child_to_parent:
                break
            p_id = child_to_parent[curr]
            if p_id in ancestors or p_id in affected:
                break
            ancestors.add(p_id)
            curr = p_id
            
    affected.update(ancestors)
    return affected