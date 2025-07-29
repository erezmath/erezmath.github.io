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
    class_1.json      # Nested JSON for class 1 (topics, lessons, files and folders)
    class_2.json      # Nested JSON for class 2
    ...
  docs/
    index.html        # home page
    class-1.html      # class 1 page
    class-2.html      # class 2 page
    ...
  build_site.py             #creates html and docs dir from json data folder.
  drive_to_class_json.py    #crawls google drive folders, creates json file in data folder.
  logger.py                 #logs key places to build.log
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

2. Review class_info in drive_to_class_json, and create JSON files into `data/` directory.

3. Edit templates in `templates/` as needed.

4. Build the site:
   ```
   #with flag to --regen-data, omit if JSON files were already created.
   python build_site.py --regen-data
   ```
   This will generate static HTML files in the `docs/` directory and copy static assets.

## Customization
- Edit `templates/` for layout and design.
- Edit `data/` for your content.
- Edit `static/` for CSS, JS, and images.
- Edit 'class_info'

## Deployment
- Upload the contents of `docs/` to your static hosting provider (e.g., GitHub Pages, Cloudflare Pages). 

## git actions before commiting
git status
git add .
git commit -m "my message"
git remote set-url origin https://github.com/<USER_NAME>/<USERNAME.github.io.git>     (if not already set)
git push -u origin main


# deployment to github pages and github page actions:
if you want to auto build project using gitactions, add secret to github actions, read .github\workflows\readme.md.

# logging
logs are written to build.log

# allowing google drive api
1. Go to Google Cloud Console, Sign in with your Google account
2. In the top navigation bar, click on the project dropdown, Either select an existing project or click "New Project"
If creating new: Give it a name like "Math Website Drive API" and click "Create"
3. In the left sidebar, click "APIs & Services" → "Library", Search for "Google Drive API", Click on "Google Drive API" from the results, Click "Enable" button
4. Go to "APIs & Services" → "Credentials", Click "Create Credentials" button, Select "OAuth 2.0 Client IDs"
5. (if first time) You'll be prompted to configure the OAuth consent screen, Choose "External" user type, Fill in required fields:
App name: "Math Website Drive Crawler"
User support email: Your email
Developer contact information: Your email
Click "Save and Continue", Skip "Scopes" section, click "Save and Continue", Add your email as a test user, click "Save and Continue", Click "Back to Dashboard"
6. Back in "Credentials", click "Create Credentials" → "OAuth 2.0 Client IDs", For Application type, select "Desktop application", Give it a name like "Math Website Drive Crawler", Click "Create"
7. After creation, you'll see a popup with your client ID and client secret, Click "Download JSON" button, This downloads a file named something like client_secret_123456789-abcdefghijklmnop.apps.googleusercontent.com.json, Rename the downloaded file to credentials.json, Place it in your secrets/ folder

# assignments.md
weekly assignments are stored in assignments.md per class.
a <hr> seperation line is needed between the weekly assignments, both for visual que for the user, and for the code.