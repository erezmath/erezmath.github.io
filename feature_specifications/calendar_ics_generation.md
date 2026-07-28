I want to add the following functionality.

Summary:
Generate a calendar file (that can be integrated with google calendar and apple calendar) for each class json file.
open for discussion whether ics, csv or any other format.

In detail:
currenlty, json files are created for each class, for example class-yud-571-tashpav.json.
Inside each class json file, there are numerous topics, inside lessons, and inside some of the lessons there is "lesson_json" that has info on when the lesson was given ("lesson_date"), and when homework is given ("due_date").

The same structure appears for every class, each with its own json file.

I want to create a calendar ics file for each class, and put it in the website, for example https://erezmath.github.io/class-yud-571-tashpav-calendar.ics
The aim is for me to register each class calendar to my google calendar and apple calendar, and be in sync.

In the calendar, I want a different event for when the lesson was given ("due_date"), event name should be the topic_name/lesson_name, and a different event for when homework is due ("due_date"), event name should be ש.ב topic_name/lesson_name (ש.ב in hebrew means homework)

I'm attaching the json file, and the python script that currently reads the json file and does additional things.

there are currently no hours but only dates, so they should be "all day events".
If a lesson doesn't have a "lesson_json", skip without breaking.
If a lesson has the same date for both "lesson_date" and "due_date", create two sepearte all-day events.

additionaly, i want to add a functionality so that each calendar event will have a link with hash to the appropriate lesson in the website.
The link and hashing generation appears in static/main.js code, specifically in Section 6 (SHARE FOOTER LOGIC), and Section 8 (HASH NAVIGATION).

Look at the templates in the template directory for how class id's are created.


before you write any code, I want you to first review my request and the implementation i suggested, suggest several ways and which is best to approach, ask anything that is not defined, and anything that might help. code comes last.