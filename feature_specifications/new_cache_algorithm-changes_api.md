# Replace cache algorithm with Drive Changes API

## Problem

- The current cache is **not robust enough** for all file/folder changes (we had to add extra validation for new folders and renames).
- It **did not improve performance as expected**: when cache exists we still do **2 API calls per folder** (one `files.get(modifiedTime)` and one `files.list(id, name)` to validate), so we get little benefit on “no change” runs.

## Goal

Replace the current per-folder validation with Google Drive’s **Changes API** ([manage-changes](https://developers.google.com/drive/api/guides/manage-changes)) so that:

1. We know exactly which files/folders changed since the last build.
2. We only refetch or invalidate **those** folders, minimizing API calls.
3. **No caching** remains an option (e.g. `use_cache=False` or `--no-cache`) for testing and for “major changes” runs.

## Workflow assumptions

- **99%** of folders and files don’t change between builds.
- Usually **1–2 folders** (e.g. new lessons) are added between builds.
- If major changes happen, the user will clear cache (e.g. `--clear-cache`).

## Changes API (short recap)

- **`changes.getStartPageToken()`** – returns a token representing “current state” of the account. Store it at the **end** of a successful build.
- **`changes.list(pageToken=…)`** – returns all changes **since** that token. Each change has:
  - `fileId` – ID of the changed file/folder
  - `removed` – true if deleted or lost access
  - `file` – current file resource (id, name, mimeType, parents, trashed, …) when still accessible; may be absent if `removed=true`.
- Paginate with `nextPageToken`; when there is no `nextPageToken`, the response includes **`newStartPageToken`** – save it for the next run.
- Use **`includeRemoved=True`** so we see deletions; use **`restrictToMyDrive=True`** if we only care about My Drive.
- We can request specific **fields** for `file` in the response (e.g. `fields="changes(fileId,removed,file(id,name,mimeType,parents,trashed))"`) to keep responses small.

## Implementation approaches

### Approach 1: Changes-driven invalidation (recommended)

**Idea:** At build start, call **changes.list** once (with last saved `startPageToken`). From the list of changes, compute **which folder IDs have “affected” contents**. Then run the existing crawl; for those folders only, **skip cache** and refetch from the API. All other folders use existing cache (no per-folder validation calls).

**Steps:**

1. **Load last token**  
   Read `cache/changes_state.json` (e.g. `{ "startPageToken": "…" }`). If missing or `use_cache=False`, run a **full crawl with cache writes disabled** (or clear cache and run), then call `getStartPageToken()`, save it, and exit.

2. **Fetch changes**  
   Call `changes.list(pageToken=..., includeRemoved=True, restrictToMyDrive=True, fields="changes(fileId,removed,file(id,name,mimeType,parents,trashed))")`, paginating until no `nextPageToken`. Collect all `changes`.

3. **Compute affected folder IDs**  
   - For each change with `file` and `file.parents`: add each **parent** (folder ID) to `affected_folder_ids` (the folder that “contains” this file/folder).
   - For each change with `removed=True` and no `file`: we don’t have `parents`. Options:
     - **A)** Scan existing folder-listing cache files: if any cached `items` contain this `fileId`, mark that cache’s `folder_id` as affected (then refetch that folder).
     - **B)** Store a small “fileId → parentFolderId” map from the previous run and use it for removed items; if not found, optionally mark all class roots as affected for safety.

4. **Crawl with invalidation**  
   Pass `affected_folder_ids` into the crawl. In `list_folder_contents(service, folder_id, use_cache=True, invalidated_ids=None)`:
   - If `folder_id in invalidated_ids`: skip cache, fetch from API, write cache.
   - Else: use existing logic (read cache if present; no extra validation calls).

5. **Save new token**  
   After a successful full build, save `newStartPageToken` from the last `changes.list` response to `cache/changes_state.json`.

**Pros:** One paginated `changes.list` at start; then only folders that actually changed get a `files.list`. No per-folder `files.get` or `files.list` for validation.  
**Cons:** Need to handle “removed” without parents (cache scan or parent map).  
**No-cache:** If `use_cache=False` or no saved token, do not call changes.list; do not read/write folder cache; do not save token.

---

### Approach 2: Changes + parent map (precise invalidation for removed)

Same as Approach 1, but maintain a **parent map** so that for **removed** items we know which folder to invalidate without scanning all caches.

- **Store:** When writing folder listing cache, also update a single file e.g. `cache/file_to_parent.json`: for each item in each folder listing, `file_id -> folder_id` (the folder that contains it).
- **Use:** When processing changes with `removed=True`, look up `fileId` in the map and add that `folder_id` to `affected_folder_ids`. If not found (e.g. first run after clearing cache), fall back to “invalidate all roots” or cache scan.
- **Update:** Rebuild the parent map at the end of each successful build from the current folder caches (or from the crawl result).

**Pros:** Precise invalidation for removals; no need to scan every cache file.  
**Cons:** Extra file to maintain; map can grow large for huge trees (could store only “folder IDs we care about” and their direct children).

---

### Approach 3: Changes only; no per-folder cache validation

Keep the **existing** folder-listing cache and lesson-object cache, but **stop** the current “validation” step (no `files.get(modifiedTime)` and no `files.list(id, name)` per folder when cache exists).

- At start: run **changes.list** once; compute **affected_folder_ids** as in Approach 1.
- **Only** for folders in `affected_folder_ids`: skip cache and refetch.
- For all other folders: **trust cache** (return cached listing without any API call). No (id, name) re-check.

So we remove the current 2-call validation entirely and rely on Changes API to tell us what’s stale.

**Pros:** Simplest change: add changes.list + affected set, add `invalidated_ids` to `list_folder_contents`, remove the existing validation block.  
**Cons:** Same as Approach 1 for “removed” (need cache scan or parent map). If for some reason the Changes API missed an edit (e.g. eventual consistency), we could serve stale data until next full refresh or cache clear.

---

### Approach 4: Full rebuild when changes “too many”

Same as Approach 1 or 3, but add a **safety valve**: if the number of changes since last token is above a threshold (e.g. 500), or if the token is older than N days, **clear cache and run a full crawl** (no cache reads), then save a new `startPageToken`. Optional and configurable.

**Pros:** Handles “major change” runs without requiring the user to remember `--clear-cache`.  
**Cons:** Heuristic; need to tune threshold.

---

## Recommendation

- **Implement Approach 1 (or 3)** first: one `changes.list` at start, compute `affected_folder_ids`, pass them into the crawl, and skip cache only for those folders. Remove the current per-folder validation (the `files.get` + `files.list(id, name)` block) so that unchanged folders use cache with **zero** extra API calls.
- For **removed** items without `file.parents`, use **cache scan** (which folder’s cached `items` contain this `fileId`) to keep the first version simple; optionally add a parent map later (Approach 2) if the scan is slow.
- Keep **`use_cache=False`** (and/or `--no-cache` / `--clear-cache`) so that builds without any caching remain possible for testing and for “I know I did major changes” runs.
- Optionally add Approach 4 (auto full rebuild when change count or age is high).

## Cache layout (Approach 1/3)

- **`cache/changes_state.json`**  
  `{ "startPageToken": "…" }`  
  Written at end of successful build; read at start when `use_cache=True`. If missing, treat as “no cache” (full crawl, then save token).

- **`cache/folder_listings/{folder_id}.json`**  
  Unchanged structure; used when `folder_id` not in `affected_folder_ids`.

- **`cache/lesson_objects/{folder_id}.json`**  
  Unchanged; still keyed by lesson folder and used when we use cached folder listing for that lesson.

- **No cache** when `use_cache=False`: do not read or write any of the above; do not call `changes.list`; do not save a new token.

## API usage comparison (typical “no change” run)

- **Current:** For each folder: 1× `files.get(modifiedTime)` + 1× `files.list(id, name)` (validation). So **2× N** calls for N folders before any “real” listing.
- **With Changes API:** 1× `getStartPageToken()` only when no saved token; then 1× paginated `changes.list` (often 1 request). **0** per-folder validation calls; only folders in `affected_folder_ids` do a `files.list` (and in a “no change” run that set is empty for class folders if nothing changed).

## Vital requirement

**Any implementation must retain the option to build without any caching**. This is implemented as:

- Internally, via `drive_to_class_json.generate_data(use_cache=False)` – no cache reads/writes and no Changes API calls.
- Externally, via a CLI flag on `build_site.py`:
  - `python build_site.py --regen-data --no-cache` → regenerate data with `use_cache=False`.
  - `python build_site.py --regen-data --clear-cache` → clear all caches and changes state, then regenerate with cache enabled.
  - `python build_site.py --regen-data --clear-cache --no-cache` → clear caches and regenerate without any caching.


## Implementation notes (as built)

- A new **`changes_api/`** directory (git-ignored) stores timestamped change snapshots:
  - Files are named `changes-dd-mm-yyyy_hh-mm-ss.json` (day, month, year, hour, minute, second).
  - Each file contains: `timestamp`, `saved_at`, `newStartPageToken`, `change_count`, and a `changes` array.
  - Files are never deleted by the code, for tracking and debugging. The `changes` array may be empty when no changes occurred.
- The `drive_changes.py` module encapsulates:
  - `fetch_changes(service, page_token)` → `(changes_list, new_start_page_token)`.
  - `persist_changes(changes_list, new_start_page_token)` → path under `changes_api/`.
  - `load_changes(path)` → full persisted dict, including `changes`.
  - `compute_affected_folder_ids(changes_list, CACHE_DIR)` → set of folder IDs whose listings must be refetched.
- `drive_to_class_json.py` provides:
  - `generate_data(use_cache=True)` – the main entrypoint used by both its CLI and `build_site.py`.
  - `main()` – CLI wrapper that always runs with cache enabled (no CLI flags on `drive_to_class_json.py` itself).
- `build_site.py`:
  - `--regen-data` regenerates `data/class-*.json` via `generate_data`.
  - `--clear-cache` clears folder/lesson caches and `cache/changes_state.json` before regeneration.
  - `--no-cache` calls `generate_data(use_cache=False)` for a full, non-cached fetch.