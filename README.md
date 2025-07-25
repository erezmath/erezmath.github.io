# Math Website Static Site Generator

This project builds a static, multi-page math website using Python and Jinja2 templates.

## Directory Structure

```
math_website/
  templates/
    base.html         # Common layout (navbar, footer, etc.)
    index.html        # Homepage template
    class.html        # Class page template
  static/
    main.css
    main.js
    images/
  data/
    class_1.json      # Nested JSON for class 1 (topics, lessons, files)
    class_2.json      # Nested JSON for class 2
    ...
  dist/
    index.html
    class-1.html
    class-2.html
    ...
  build_site.py
  requirements.txt
  README.md
```

## Data Format

Each class has a JSON file (e.g., `class_1.json`) with the following structure:

```
{
  "name": "כיתה י 571 תשפה",
  "drive_url": "https://drive.google.com/drive/folders/11epRetDJViW9EWdomonlYWn6GUk55kC4",
  "topics": [
    {
      "name": "אלגברה",
      "lessons": [
        {
          "name": "משוואות ריבועיות",
          "content": [
            {
              "type": "file",
              "name": "תרגול.pdf",
              "url": "https://drive.google.com/file/d/FILE_ID/view"
            },
            {
              "type": "folder",
              "name": "פתרונות",
              "content": [
                {
                  "type": "file",
                  "name": "פתרון 1.pdf",
                  "url": "https://drive.google.com/file/d/FILE_ID/view"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

- Each `content` array can contain files or folders, and folders can be nested recursively.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Place your class JSON files in the `data/` directory.

3. Edit templates in `templates/` as needed.

4. Build the site:
   ```
   python build_site.py
   ```
   This will generate static HTML files in the `dist/` directory and copy static assets.

## Customization
- Edit `templates/` for layout and design.
- Edit `data/` for your content.
- Edit `static/` for CSS, JS, and images.

## Deployment
- Upload the contents of `dist/` to your static hosting provider (e.g., GitHub Pages, Cloudflare Pages). 