import os
import shutil
import json
import subprocess
import argparse
from jinja2 import Environment, FileSystemLoader
import logging
from datetime import datetime
import pytz
from icalendar import Calendar, Event
from logger import log_event
from drive_to_class_json import SITE_CATEGORIES

# Paths & Constants
BASE_URL = "https://erezmath.github.io"
TEMPLATES_DIR = 'templates'
STATIC_DIR = 'static'
DATA_DIR = 'data'
# github pages hardcoded for "docs" folder, and can't use 'dist'. 
#DIST_DIR = 'dist'
DIST_DIR = 'docs'
CALENDAR_DIR = os.path.join(DIST_DIR, 'calendar')

# Argument parsing for optional data regeneration
# if --regen-data is passed, the data will be regenerated from the data directory,
# command: 'python build_site.py --regen-data'
# otherwise, the data will be loaded from the data/ directory
# --clear-cache clears folder listing and lesson caches before regen (e.g. python build_site.py --regen-data --clear-cache)
# --no-cache disables all caching inside drive_to_class_json (full fetch, for testing/major changes)
parser = argparse.ArgumentParser(description='Build the static site.')
parser.add_argument('--regen-data', action='store_true', help='Regenerate class JSON data before building')
parser.add_argument('--clear-cache', action='store_true', help='Clear folder/lesson cache before regenerating data (use with --regen-data)')
parser.add_argument('--no-cache', action='store_true', help='Regenerate data without any caching (slow, but safest for major changes)')
args = parser.parse_args()

if args.clear_cache:
    from drive_to_class_json import clear_folder_listing_cache
    clear_folder_listing_cache()
    log_event('Cleared folder listing and lesson caches')

if args.regen_data:
    from drive_to_class_json import generate_data
    log_event('Regenerating data with drive_to_class_json.generate_data')
    use_cache = not args.no_cache
    generate_data(use_cache=use_cache)
    log_event('Data regeneration complete')

# Ensure dist exists before any file operations
if not os.path.exists(DIST_DIR):
    os.makedirs(DIST_DIR)


########################################################
# Jinja2 setup
env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR), 
    autoescape=True,
    trim_blocks=True,      # Added this
    lstrip_blocks=True     # Added this
)

# Jinja2 custom filter for highlighting future due dates differently in the html.
# currently disabled, not working as expected, and i preferred to implement it in javascript.
def is_future_date(date_string):
    return datetime.strptime(date_string, "%d.%m.%y") > datetime.now()

env.tests["future_date"] = is_future_date


########################################################

def parse_date_str(date_str):
    """Safely parse a date string into a datetime.date object for all-day calendar events."""
    if not date_str or not isinstance(date_str, str):
        return None
    clean_str = date_str.replace('.', '-').strip()
    for fmt in ("%d-%m-%Y", "%d-%m-%y"):
        try:
            return datetime.strptime(clean_str, fmt).date()
        except ValueError:
            continue
    return None

def minify_html(html_content):
    """Remove blank lines and excessive whitespace from HTML."""
    lines = html_content.split('\n')
    # Remove completely blank lines and lines with only whitespace
    non_blank_lines = [line for line in lines if line.strip()]
    return '\n'.join(non_blank_lines)

def load_class_jsons():
    """Load all class JSON files from the data directory."""
    class_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.json')]
    classes = []
    for filename in class_files:
        with open(os.path.join(DATA_DIR, filename), encoding='utf-8') as f:
            class_data = json.load(f)
            # Keep the id as is (unique numeric ID from JSON)
            classes.append(class_data)
    log_event(f'Loaded {len(classes)} class JSON files')
    return classes

def render_index(classes):
    """Render the main index.html page from class summaries."""
    template = env.get_template('index.html')
    # For index, pass only summary info for each class
    class_summaries = [
        {
            'id': c.get('id', ''),  # Use the hardcoded id from JSON
            'url_name': c.get('url_name', ''),
            'category': c.get('category', 'past'),
            'name': c.get('name', ''),
            'desc': c.get('desc', ''),
            'banner_url': c.get('banner_url', ''),
            'tags': c.get('tags', ''),
            'num_topics': len(c.get('topics', [])),
            'num_lessons': sum(len(t.get('lessons', [])) for t in c.get('topics', [])),
            'drive_url': c.get('drive_url', '')
        }
        for c in classes
    ]
    html = template.render(classes=class_summaries, categories=SITE_CATEGORIES)
    html = minify_html(html)  # minify html strip for blank lines
    with open(os.path.join(DIST_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    log_event('Rendered index.html')

def render_class_pages(classes):
    """Render an HTML page for each class."""
    template = env.get_template('class.html')
    for c in classes:
        url_name = c.get('url_name', '') or c.get('name', '').replace(' ', '_')
        html = template.render(class_info=c, classes=classes, categories=SITE_CATEGORIES)
        html = minify_html(html)  # minify html strip for blank lines
        filename = f'class-{url_name}.html'
        with open(os.path.join(DIST_DIR, filename), 'w', encoding='utf-8') as f:
            f.write(html)
    log_event('Rendered all class pages')

def generate_calendars(classes):
    """Generate separate .ics calendar files for lessons and due dates under calendar/ directory."""
    if not os.path.exists(CALENDAR_DIR):
        os.makedirs(CALENDAR_DIR)

    for c in classes:
        url_name = c.get('url_name', '') or c.get('name', '').replace(' ', '_')
        class_name = c.get('name', 'שיעורי מתמטיקה')
        base_url = f"{BASE_URL}/class-{url_name}.html"

        # 1. Calendar for Lesson Dates
        lessons_cal = Calendar()
        lessons_cal.add('prodid', f'-//ErezMath//Class {url_name} Lessons//HE')
        lessons_cal.add('version', '2.0')
        lessons_cal.add('calscale', 'GREGORIAN')
        lessons_cal.add('x-wr-calname', f"{class_name} - שיעורים")

        # 2. Calendar for Homework/Due Dates
        due_cal = Calendar()
        due_cal.add('prodid', f'-//ErezMath//Class {url_name} Due Dates//HE')
        due_cal.add('version', '2.0')
        due_cal.add('calscale', 'GREGORIAN')
        due_cal.add('x-wr-calname', f"{class_name} - משימות וש.ב")

        for topic in c.get('topics', []):
            topic_name = topic.get('name', '')
            for lesson in topic.get('lessons', []):
                lesson_json = lesson.get('lesson_json')
                if not lesson_json:
                    continue

                lesson_name = lesson.get('name', '')
                lesson_id = lesson.get('id', '')
                lesson_url = f"{base_url}#{lesson_id}" if lesson_id else base_url

                # Populate Lessons Calendar
                lesson_date_str = lesson_json.get('lesson_date')
                lesson_date = parse_date_str(lesson_date_str)
                if lesson_date:
                    event = Event()
                    event.add('summary', f"{topic_name} / {lesson_name}")
                    event.add('dtstart', lesson_date)
                    event.add('url', lesson_url)
                    event.add('description', f"קישור לשיעור באתר:\n{lesson_url}")
                    event.add('uid', f"lesson-{lesson_id}-{lesson_date_str}@erezmath")
                    lessons_cal.add_component(event)

                # Populate Due Dates Calendar
                due_date_str = lesson_json.get('due_date')
                due_date = parse_date_str(due_date_str)
                if due_date:
                    due_event = Event()
                    due_event.add('summary', f"ש.ב {topic_name} / {lesson_name}")
                    due_event.add('dtstart', due_date)
                    due_event.add('url', lesson_url)
                    due_event.add('description', f"קישור למשימה באתר:\n{lesson_url}")
                    due_event.add('uid', f"due-{lesson_id}-{due_date_str}@erezmath")
                    due_cal.add_component(due_event)

        # Write files to docs/calendar/
        lessons_filename = f'class-{url_name}-lessons-calendar.ics'
        with open(os.path.join(CALENDAR_DIR, lessons_filename), 'wb') as f:
            f.write(lessons_cal.to_ical())

        due_filename = f'class-{url_name}-due-calendar.ics'
        with open(os.path.join(CALENDAR_DIR, due_filename), 'wb') as f:
            f.write(due_cal.to_ical())

    log_event('Generated all calendar files in calendar/ directory')

def copy_static():
    """Copy static assets to the output directory."""
    static_dist = os.path.join(DIST_DIR, 'static')
    if os.path.exists(static_dist):
        shutil.rmtree(static_dist)
    if os.path.exists(STATIC_DIR):
        shutil.copytree(STATIC_DIR, static_dist)
    else:
        print('Warning: static/ directory does not exist. No static assets copied.')
    log_event('Copied static assets')

def copy_images():
    """Copy images to the output directory."""
    images_dist = os.path.join(DIST_DIR, 'images')
    if os.path.exists(images_dist):
        shutil.rmtree(images_dist)
    if os.path.exists('images'):
        shutil.copytree('images', images_dist)
    else:
        print('Warning: images/ directory does not exist. No images copied.')
    log_event('Copied images')

def copy_quizes():
    """Copy quizes to the output directory."""
    quizes_dist = os.path.join(DIST_DIR, 'quizes')
    if os.path.exists(quizes_dist):
        shutil.rmtree(quizes_dist)
    if os.path.exists('quizes'):
        shutil.copytree('quizes', quizes_dist)
    else:
        print('Warning: quizes/ directory does not exist. No quizes copied.')
    log_event('Copied quizes')


def main():
    """Main build process: cleans output, loads data, renders pages, generates calendars, copies assets."""
    log_event('Main build process started')
    print('Main build process started!')
    # Clean dist directory before building
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
        
    os.makedirs(DIST_DIR)
    classes = load_class_jsons()
    render_index(classes)
    render_class_pages(classes)
    generate_calendars(classes)
    copy_static()
    copy_images()
    copy_quizes()
    log_event('Site built successfully!')
    print('site built successfully!')

if __name__ == '__main__':
    main()