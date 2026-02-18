Your caching implementation can be far more efficient. 
if a folder hasn't changed, there's no read to read the readme file again, no need to read the lesson.json.
no need to do any process on them either.

What can be done, is first check if any items in the folder changed. 
if all items haven't changed, cache the entire lesson_obj of crawl_class() - no need to invest time in recreating it.
if there's any change in the folder, fallback to creating the lesson_obj.

---
Implementation (done):
- list_folder_contents() now returns (items, cache_info) with cache_info = { "modified_time", "from_cache" }.
- Added lesson-object cache: cache/lesson_objects/{folder_id}.json stores { modified_time, lesson_obj } (name, desc, content, lesson_json).
- In crawl_class(), when lesson folder listing is from cache (unchanged), we try get_cached_lesson_obj(lesson_id, modified_time). If hit, use it (set id) and skip read_readme_file, read_lesson_json, crawl_lesson_content. If miss or folder changed, build lesson_obj as before and save_lesson_obj_cache().
- clear_folder_listing_cache() also clears lesson object cache (per folder when folder_id given, or all when clearing all).