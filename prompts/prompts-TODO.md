1

Verify this issue exists and fix it:
issue:
The daily automated build runs with `--regen-data`, which regenerates JSON files from Google Drive, overwriting the committed data files. Any `lesson_json` metadata manually added to the JSON files (like due dates at lines 306-310) will be lost on the next automated build unless corresponding `lesson.json` files exist in the Google Drive folders. This creates a data loss issue where manually entered lesson metadata cannot be persisted across automated rebuilds. @data/class-yud-571-tashpav.json:305-310 
fix:
build "due_date_display" on demand, as a django custom template filter, see https://docs.djangoproject.com/en/5.2/howto/custom-template-tags/




2
the following is not good in python, it should be implemented in javascript and not be depended on the build.

add to <div class="lesson-due-row"> in class.html, another css class "alert", which will be present if the due date is for today or in the future.
add to the css "alert" the color orange so it will be more visible to the user.




For context, the webpage is at https://erezmath.github.io/class-yud-571-tashpav.html
create a function in javascript called is_date_today_or_future, that for every <div class="lesson-due-row"> it encounters, it extracts the date written in it (the date format will be dd.mm.yyyy but there can be additional text in the div). If the date was not found or not extracted correctly, nothing is done. If the date was exctracted correctly, and the date matches that of today (israel standard time), add class "color-alert" to <div class="lesson-due-row">. If the date was extracted correctly and the date mathes a future date (israel standard time), add class "color-warning" to <div class="lesson-due-row">. else, do not do anything.


3

remove #hrefs from header, it stops the page from refershing. move functionality to ? strings, for example, ?6-7 wil go to 6-7 and highlight it.


מענבל

יש תקלה 
כשאתה נכנס לכיתה אח״כ לדוגמא גיאומטרי זה בכל מקרה מוביל אותך לנושא הראשון בתפריט
אם ממש משעמם לך ורוצה להפוך את האתר לידידותי תהפוך את הגישה לשעורים ללחצנים.
דף נוסחאות לכל נושא גם יכול להועיל להם


יש באג בעלייה ירידה כשעושים סקרול. זה קופץ שם ולא יודע למה בדיוק בגאואסקריפט, אבל זה משהו לקלוד לזהות

fix urls to videos.