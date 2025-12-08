Verify this issue exists and fix it:
issue:
The daily automated build runs with `--regen-data`, which regenerates JSON files from Google Drive, overwriting the committed data files. Any `lesson_json` metadata manually added to the JSON files (like due dates at lines 306-310) will be lost on the next automated build unless corresponding `lesson.json` files exist in the Google Drive folders. This creates a data loss issue where manually entered lesson metadata cannot be persisted across automated rebuilds. @data/class-yud-571-tashpav.json:305-310 
fix:
build "due_date_display" on demand, as a django custom template filter, see https://docs.djangoproject.com/en/5.2/howto/custom-template-tags/




add to <div class="lesson-due-row"> in class.html, another css class "alert", which will be present if the due date is for today or in the future.
add to the css "alert" the color orange so it will be more visible to the user.
