import os
import shutil
import json
import subprocess
import argparse
from jinja2 import Environment, FileSystemLoader
import logging
from datetime import datetime
import pytz
from logger import log_event

# Paths
TEMPLATES_DIR = 'templates'
STATIC_DIR = 'static'
DATA_DIR = 'data'
# github pages hardcoded for "docs" folder, and can't use 'dist'. 
#DIST_DIR = 'dist'
DIST_DIR = 'docs'

# Argument parsing for optional data regeneration
# if --regen-data is passed, the data will be regenerated from the data directory,
# command: 'python build_site.py --regen-data'
# otherwise, the data will be loaded from the data/ directory
parser = argparse.ArgumentParser(description='Build the static site.')
parser.add_argument('--regen-data', action='store_true', help='Regenerate class JSON data before building')
args = parser.parse_args()

if args.regen_data:
    log_event('Regenerating data with drive_to_class_json.py')
    subprocess.run(['python', 'drive_to_class_json.py'], check=True)
    log_event('Data regeneration complete')

# Ensure dist exists before any file operations
if not os.path.exists(DIST_DIR):
    os.makedirs(DIST_DIR)


########################################################
# Jinja2 setup
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)




# Jinja2 custom filter for highlighting future due dates differently in the html.
# currently disabled, not working as expected, and i prefered to implement it in javascript.
def is_future_date(date_string):
    return datetime.strptime(date_string, "%d.%m.%y") > datetime.now()

env.tests["future_date"] = is_future_date


########################################################

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
            'active': c.get('active', False),
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
    html = template.render(classes=class_summaries)
    with open(os.path.join(DIST_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    log_event('Rendered index.html')

def render_class_pages(classes):
    """Render an HTML page for each class."""
    template = env.get_template('class.html')
    for c in classes:
        url_name = c.get('url_name', '') or c.get('name', '').replace(' ', '_')
        html = template.render(class_info=c, classes=classes)
        filename = f'class-{url_name}.html'
        with open(os.path.join(DIST_DIR, filename), 'w', encoding='utf-8') as f:
            f.write(html)
    log_event('Rendered all class pages')

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

def main():
    """Main build process: cleans output, loads data, renders pages, copies assets."""
    log_event('Main build process started')
    print('Main build process started!')
    # Clean dist directory before building
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
        
    os.makedirs(DIST_DIR)
    classes = load_class_jsons()
    render_index(classes)
    render_class_pages(classes)
    copy_static()
    copy_images()
    log_event('Site built successfully!')
    print('site built successfully!')

if __name__ == '__main__':
    main() 