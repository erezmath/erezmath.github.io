1

Verify this issue exists and fix it:
issue:
The daily automated build runs with `--regen-data`, which regenerates JSON files from Google Drive, overwriting the committed data files. Any `lesson_json` metadata manually added to the JSON files (like due dates at lines 306-310) will be lost on the next automated build unless corresponding `lesson.json` files exist in the Google Drive folders. This creates a data loss issue where manually entered lesson metadata cannot be persisted across automated rebuilds. @data/class-yud-571-tashpav.json:305-310 
fix:
build "due_date_display" on demand, as a jinja custom template filter.


3

remove #hrefs from header, it stops the page from refershing. move functionality to ? strings, for example, ?6-7 wil go to 6-7 and highlight it.


מענבל

יש תקלה 
כשאתה נכנס לכיתה אח״כ לדוגמא גיאומטרי זה בכל מקרה מוביל אותך לנושא הראשון בתפריט
אם ממש משעמם לך ורוצה להפוך את האתר לידידותי תהפוך את הגישה לשעורים ללחצנים.
דף נוסחאות לכל נושא גם יכול להועיל להם


יש באג בעלייה ירידה כשעושים סקרול. זה קופץ שם ולא יודע למה בדיוק בגאואסקריפט, אבל זה משהו לקלוד לזהות

fix urls to videos.

lessons can have relevant videos, or external links (not links that appear as files in google drive)
the data is stored in lesson.json files, in the lesson folder. 
the format can be seen in examples/lesson.json.
when you read for lesson.json data (you read it for due date), read the external_links data as well, and write it in the lesson-content html, after class="lesson-list" add "lesson-external-links" and write links to the lesson videos and titles.