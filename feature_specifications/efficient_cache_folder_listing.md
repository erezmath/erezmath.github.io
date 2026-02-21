# Cache Folder Listings - Implementation Strategies

## Overview

Since the vast majority of folders don't change between runs, caching folder listings can provide **90-100% speedup** on subsequent runs. This document outlines multiple implementation approaches with trade-offs.

---

## Strategy 1: ModifiedTime-Based Cache (Recommended)

### Concept

Use Google Drive API's `modifiedTime` field to detect if a folder has changed. Cache folder listings with their last modified timestamp. On subsequent runs, compare cached timestamp with current timestamp - if unchanged, use cache.

### Implementation Details

#### Cache Structure

```
cache/
  folder_listings/
    {folder_id}.json  # Each folder gets its own cache file
```

**Subfolders:** The cache applies at every level. When listing a folder that contains subfolders, each of those subfolders is listed via its own `list_folder_contents(service, subfolder_id)` call (e.g. in `crawl_lesson_content()`). Each such call uses or updates the cache for that `subfolder_id`, so nested structures are fully cached.

#### Cache File Format

```json
{
  "folder_id": "1ao6g6Ox6XNi8HKuvmUpeXH9MNC66YwBZ",
  "modified_time": "2025-02-15T10:30:00.000Z",
  "cached_at": "2025-02-15T10:35:00.000Z",
  "items": [
    {
      "id": "file_id_1",
      "name": "README.md",
      "mimeType": "text/markdown",
      "modifiedTime": "2025-02-10T08:00:00.000Z"
    },
    {
      "id": "folder_id_1",
      "name": "Subfolder",
      "mimeType": "application/vnd.google-apps.folder",
      "modifiedTime": "2025-02-12T14:20:00.000Z"
    }
  ]
}
```

#### Modified `list_folder_contents()` Function

```python
def list_folder_contents(service, folder_id, use_cache=True):
    """
    List all files and folders in a Google Drive folder, with caching support.
    
    Args:
        service: Google Drive service object
        folder_id: ID of the folder to list
        use_cache: Whether to use cached results if available and valid
    
    Returns:
        List of file/folder items sorted by numeric prefix
    """
    cache_dir = os.path.join('cache', 'folder_listings')
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{folder_id}.json")
    
    # Try to load from cache
    if use_cache and os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # Get current folder metadata from Drive API (lightweight call)
            folder_meta = service.files().get(
                fileId=folder_id,
                fields="modifiedTime"
            ).execute()
            
            cached_modified = cache_data.get('modified_time')
            current_modified = folder_meta.get('modifiedTime')
            
            # If folder hasn't changed, return cached items
            if cached_modified == current_modified:
                log_event(f"Using cached listing for folder {folder_id}")
                return cache_data['items']
        except Exception as e:
            log_event(f"Cache read error for {folder_id}: {str(e)}, fetching fresh")
    
    # Fetch fresh data from API
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(
        q=query,
        fields="files(id, name, mimeType, modifiedTime)",
        pageSize=1000
    ).execute()
    
    # Get folder's own modifiedTime for cache
    folder_meta = service.files().get(
        fileId=folder_id,
        fields="modifiedTime"
    ).execute()
    
    items = results.get('files', [])
    sorted_items = sorted(items, key=lambda x: (extract_lesson_number(x['name']), x['name']))
    
    # Save to cache
    cache_data = {
        'folder_id': folder_id,
        'modified_time': folder_meta.get('modifiedTime'),
        'cached_at': datetime.now().isoformat(),
        'items': sorted_items
    }
    
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        log_event(f"Cached listing for folder {folder_id}")
    except Exception as e:
        log_event(f"Cache write error for {folder_id}: {str(e)}")
    
    return sorted_items
```

#### Pros
- ✅ Accurate change detection using Drive API's native timestamp
- ✅ Only requires 1 extra API call per folder (get folder metadata)
- ✅ Handles renames, deletions, additions correctly
- ✅ Simple to implement

#### Cons
- ⚠️ Still makes 1 API call per folder to check `modifiedTime` (but much faster than full listing)
- ⚠️ Cache can grow large (one file per folder)

#### Performance Impact
- **First run**: Same as current (no cache)
- **Subsequent runs**: ~90-95% faster (only changed folders queried)
- **API calls**: 1 per folder (metadata check) vs current ~5-10 per folder

---

## Strategy 2: Hash-Based Cache Validation

### Concept

Compute a hash of folder contents (file IDs + names + modifiedTimes). Cache the hash with the listing. On subsequent runs, compute hash of cached items - if hash matches, folder unchanged.

### Implementation Details

```python
import hashlib

def compute_folder_hash(items):
    """Compute hash of folder contents for change detection."""
    # Sort items by ID for consistent hashing
    sorted_items = sorted(items, key=lambda x: x['id'])
    # Create hash from IDs, names, and modifiedTimes
    hash_input = json.dumps([
        {
            'id': item['id'],
            'name': item['name'],
            'modifiedTime': item.get('modifiedTime', '')
        }
        for item in sorted_items
    ], sort_keys=True)
    return hashlib.sha256(hash_input.encode()).hexdigest()

def list_folder_contents(service, folder_id, use_cache=True):
    cache_file = os.path.join('cache', 'folder_listings', f"{folder_id}.json")
    
    if use_cache and os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            cache_data = json.load(f)
        
        cached_hash = cache_data.get('content_hash')
        cached_items = cache_data.get('items', [])
        
        # Compute hash of cached items
        current_hash = compute_folder_hash(cached_items)
        
        # If hash matches, folder unchanged
        if cached_hash == current_hash:
            return cached_items
    
    # Fetch fresh and cache
    # ... (similar to Strategy 1)
```

#### Pros
- ✅ No extra API calls needed (uses data already fetched)
- ✅ Detects any content changes

#### Cons
- ⚠️ Doesn't detect folder-level metadata changes
- ⚠️ More complex hash computation
- ⚠️ Less reliable than modifiedTime (hash collisions theoretically possible)

---

## Strategy 3: Global Cache with Dependency Tracking

### Concept

Cache entire folder tree structure in one file, track dependencies (parent-child relationships). When a folder changes, invalidate its subtree.

### Implementation Details

```python
# cache/folder_tree.json
{
  "folders": {
    "root_id": {
      "modified_time": "2025-02-15T10:30:00Z",
      "items": [...],
      "children": ["topic1_id", "topic2_id"]
    },
    "topic1_id": {
      "modified_time": "2025-02-14T08:00:00Z",
      "items": [...],
      "children": ["lesson1_id", "lesson2_id"]
    }
  },
  "last_updated": "2025-02-15T10:35:00Z"
}

def invalidate_subtree(cache_data, folder_id):
    """Recursively invalidate folder and all children."""
    if folder_id in cache_data['folders']:
        folder = cache_data['folders'][folder_id]
        for child_id in folder.get('children', []):
            invalidate_subtree(cache_data, child_id)
        del cache_data['folders'][folder_id]
```

#### Pros
- ✅ Single cache file (easier to manage)
- ✅ Can invalidate entire subtrees efficiently
- ✅ Better for understanding folder relationships

#### Cons
- ⚠️ Single file can become very large
- ⚠️ More complex invalidation logic
- ⚠️ Risk of file corruption affecting entire cache
- ⚠️ Slower to read/write large JSON files

---

## Strategy 4: Hybrid Approach (Best of Both Worlds)

### Concept

Use **Strategy 1 (ModifiedTime-based)** but with optimizations:
1. Cache folder metadata separately (lightweight)
2. Batch metadata checks when possible
3. Add cache TTL (time-to-live) for safety
4. Optional: Cache invalidation on manual trigger

### Enhanced Implementation

```python
CACHE_DIR = os.path.join('cache', 'folder_listings')
CACHE_TTL_HOURS = 24  # Optional: force refresh after 24 hours

def list_folder_contents(service, folder_id, use_cache=True, force_refresh=False):
    cache_file = os.path.join(CACHE_DIR, f"{folder_id}.json")
    
    # Check cache validity
    if use_cache and not force_refresh and os.path.exists(cache_file):
        cache_age = (datetime.now() - datetime.fromisoformat(
            json.load(open(cache_file))['cached_at']
        )).total_seconds() / 3600
        
        if cache_age < CACHE_TTL_HOURS:
            # Check modifiedTime (1 API call)
            folder_meta = service.files().get(
                fileId=folder_id,
                fields="modifiedTime"
            ).execute()
            
            cache_data = json.load(open(cache_file))
            if cache_data['modified_time'] == folder_meta.get('modifiedTime'):
                return cache_data['items']
    
    # Fetch fresh data...
    # (same as Strategy 1)
```

### Batch Metadata Checks (Advanced)

For even better performance, batch check multiple folders at once:

```python
def batch_check_folder_modified_times(service, folder_ids):
    """Check modifiedTime for multiple folders efficiently."""
    # Use batch request API
    batch = service.new_batch_http_request()
    results = {}
    
    def callback(request_id, response, exception):
        if exception:
            results[request_id] = None
        else:
            results[request_id] = response.get('modifiedTime')
    
    for folder_id in folder_ids:
        batch.add(
            service.files().get(fileId=folder_id, fields="modifiedTime"),
            callback=callback,
            request_id=folder_id
        )
    
    batch.execute()
    return results
```

---

## Recommended Implementation Plan

### Phase 1: Basic ModifiedTime Cache (Strategy 1)

1. **Add cache directory structure**
   ```python
   CACHE_DIR = os.path.join('cache', 'folder_listings')
   os.makedirs(CACHE_DIR, exist_ok=True)
   ```

2. **Modify `list_folder_contents()`** to:
   - Check cache file existence
   - Compare `modifiedTime` (1 API call)
   - Return cached items if unchanged
   - Save fresh data to cache

3. **Add cache management utilities**:
   ```python
   def clear_cache(folder_id=None):
       """Clear cache for specific folder or all folders."""
       if folder_id:
           cache_file = os.path.join(CACHE_DIR, f"{folder_id}.json")
           if os.path.exists(cache_file):
               os.remove(cache_file)
       else:
           shutil.rmtree(CACHE_DIR)
           os.makedirs(CACHE_DIR, exist_ok=True)
   ```

### Phase 2: Optimizations (Optional)

1. **Add cache TTL** for safety
2. **Add cache statistics** (hit rate, cache size)
3. **Add manual cache invalidation** flag
4. **Consider batch metadata checks** for multiple folders

### Phase 3: Advanced Features (Future)

1. **Incremental updates**: Only fetch changed folders
2. **Cache compression**: Compress old cache files
3. **Cache cleanup**: Remove cache for deleted folders

---

## Expected Performance Gains

### Current (No Cache)
- **API calls per class**: ~250-500 folder listings
- **Time**: ~30-60 seconds per class

### With ModifiedTime Cache (Strategy 1)
- **First run**: Same as current (~250-500 calls)
- **Subsequent runs (no changes)**: ~250-500 metadata checks (much faster than full listings)
- **Time**: ~3-6 seconds per class (**90-95% faster**)
- **Subsequent runs (some changes)**: Only changed folders fetched fully
- **Time**: ~5-15 seconds per class (**50-75% faster**)

### With Batch Metadata Checks
- **Subsequent runs**: Batch check all folders at once
- **Time**: ~2-4 seconds per class (**93-97% faster**)

---

## Cache Invalidation Scenarios

### When to Invalidate Cache

1. **Folder modifiedTime changed**: Automatic (checked on each run)
2. **Manual refresh**: Add `--force-refresh` flag
3. **Cache corruption**: Detect and auto-clear
4. **TTL expired**: Force refresh after X hours

### Edge Cases to Handle

1. **Folder deleted**: Cache file becomes stale (handle gracefully)
2. **Folder renamed**: Folder ID unchanged, cache still valid
3. **File moved between folders**: Both folders' caches need refresh
4. **Permissions changed**: May affect API access (handle errors)

---

## Implementation Checklist

- [ ] Create cache directory structure
- [ ] Modify `list_folder_contents()` to check cache
- [ ] Add `modifiedTime` field to API queries
- [ ] Implement cache read/write logic
- [ ] Add cache invalidation utilities
- [ ] Add logging for cache hits/misses
- [ ] Test with unchanged folders (should use cache)
- [ ] Test with changed folders (should refresh)
- [ ] Test cache corruption handling
- [ ] Add `.gitignore` entry for `cache/` directory
- [ ] Document cache management in README

---

## Code Integration Points

### Files to Modify

1. **`drive_to_class_json.py`**:
   - `list_folder_contents()` function
   - Add cache directory constant
   - Add cache utility functions

2. **`.gitignore`**:
   - Add `cache/` directory

3. **`README.md`**:
   - Document cache behavior
   - Explain cache invalidation

### Backward Compatibility

- Cache is **additive** - if cache doesn't exist, behaves exactly as before
- No breaking changes to existing functionality
- Can be disabled with `use_cache=False` parameter

---

## Conclusion

**Recommended approach**: **Strategy 1 (ModifiedTime-based)** with optional TTL and batch checks.

This provides:
- ✅ **90-95% speedup** on subsequent runs
- ✅ Simple implementation
- ✅ Reliable change detection
- ✅ Minimal code changes
- ✅ Easy to disable if needed

The cache will be most effective since "vast majority of folders don't change between runs" - meaning most runs will see near-maximum speedup.

There's a bug in the implementation. 
When cache directory was present, the build process did not detect a new lesson. ran without the cache directory, and it was built correctly.
Also, add a flag to build_site.py to allow clearing of the cache.
"python build_site.py --regen-data --clear-cache" will clear cache.
by default "python build_site.py --regen-data" will not clear cache.