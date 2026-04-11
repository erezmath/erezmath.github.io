# Project Engineering Standards (`skills.md`)

## 1. Project Context & Audience

* **Domain**: A free, static, multi-page educational website functioning similarly to Google Classroom. 
* **Target Audience**: High school math students (ages 14-18) who are Hebrew speakers. 
* **Language & Layout**: The website is exclusively in Hebrew. Right-to-Left (RTL) orientation is strictly mandatory across all HTML and CSS.

## 2. Data Structure (Google Drive Mapping)

The Google Drive folder structure is mapped to the website's hierarchy:
* **Level 1 (Main Folders)**: Classes (e.g., each class gets its own separate generated HTML page).
* **Level 2 (Subfolders)**: Topics within that specific class.
* **Level 3 (Sub-subfolders)**: Lessons within that specific topic.
* **Level 4 (Contents)**: The actual files, documents, or sub-folders belonging to a specific lesson.
* **Shortcuts**: google drive shortcuts are supported. 

## 3. Core Philosophy

* **KISS (Keep It Simple, Stupid)**: Prioritize code readability and maintainability over cleverness or brevity. Explicit is always better than implicit.
* **DRY (Don't Repeat Yourself)**: Avoid duplicating logic or hardcoding data in multiple places. Logic and configuration must be centralized.
* **Modular Layers**: Maintain a strict separation of concerns across the pipeline:
  1. **Data Acquisition**: Python/Google Drive API (`drive_to_class_json.py`, `drive_changes.py`).
  2. **Data Transformation & Build**: JSON processing, caching, and HTML generation (`build_site.py`).
  3. **Presentation**: Jinja2 templates (`.html`), Vanilla JS (`main.js`), and pure CSS (`main.css`).

## 4. Python Backend & Build Standards

* **Strings**: Use single quotes (`'`) for string literals by default, unless double quotes (`"`) are explicitly required to avoid escaping inside the string.
* **Path Management**: Always use `os.path` (e.g., `os.path.join()`, `os.path.exists()`) for file path manipulations to ensure cross-platform compatibility.
* **Type Hinting**: Use Python type hints (e.g., `def load_data(file_path: str) -> dict:`) to enhance IDE support, readability, and catch bugs early.
* **Configuration**: Define all constants, folder paths (e.g., `DATA_DIR`, `DIST_DIR`), and flags at the very top of the script using `UPPER_CASE` naming conventions.
* **Error Handling & Logging**: Always use the custom `logger.py` module (which tracks IST time) for logging major events and errors. Avoid using raw `print()` statements for core logical flows; reserve `print()` only for direct CLI user feedback.
* **Documentation**: 
  * Every function must have a clear Docstring explaining its purpose, arguments, and return values.
  * Use inline comments for complex logical blocks or API interactions.

## 5. Frontend Standards (HTML/JS/CSS)

* **Vanilla Tech Stack**: Do not introduce external frontend frameworks (like React, Vue, or Tailwind). Rely strictly on Vanilla JavaScript (ES6+) and modern CSS.
* **RTL & Hebrew**: All HTML documents must strictly define `<html lang="he" dir="rtl">`.
* **CSS Architecture**:
  * Use **CSS Variables** (`:root`) for colors, spacing, and transitions to maintain a unified global design system.
  * Organize `main.css` into heavily documented, numbered sections with clear comment banners (e.g., `/* 1. Variables & Global Settings */`).
  * Ensure full RTL support for margins, paddings, and absolute positioning. Prioritize mobile-first responsive design tailored to high schoolers using mobile devices.
* **JavaScript Architecture**:
  * Organize `main.js` into numbered sections (e.g., Global Variables, Utilities, Logic, Initialization).
  * Strictly use `const` and `let`; never use `var`.
  * Maintain existing performance patterns, such as "Progressive Loading" for assignments and "Hover Previews" for Drive/YouTube links.
* **Templating (Jinja2)**:
  * Heavily utilize Template Inheritance (`{% extends 'base.html' %}`).
  * Keep templates logic-light. Perform heavy data manipulation, sorting, and filtering in Python before passing the context variables to Jinja2.

### 5.1. Responsive Design & Breakpoints Logic
* **Two Breakpoint**: `768px` and `1024px`, dividing lines between mobile, tablet, and desktop.
* **Grid Layouts**: Use CSS Grid (e.g., `.class-cards`) with a mobile-first 1-column layout, expanding to 2+ columns at `min-width: 769px`.
* **Sticky Navigation Logic**: mobile and tablet support horizontal scrolling of the topics in `topics-nav`. no horizontal scrolling in desktop 


## 6. Build & Deployment

* **Static Site Generation**: The output must always target the `docs/` folder to maintain compatibility with GitHub Pages deployment.
* **Caching Strategy**: Respect and maintain the `cache/` directory logic. The build process must intelligently use cached API responses and JSON files to prevent redundant network calls and speed up the generation process.
* **Build Cleanliness**: Ensure temporary build artifacts or specific hidden files (like `desktop.ini`) are cleaned up using the existing utility scripts before final deployment.

## 7. AI Collaboration Protocol

* **Full File Outputs**: When generating code to implement a feature or fix a bug, provide the complete, updated file content. This allows for direct copy-pasting to replace the existing file so changes can be tracked easily using IDE diff tools.
* **Surgical Edits**: Code modifications must be as surgical as possible. Only alter the specific lines required to implement the request.
* **Zero Unnecessary Changes**: Strictly preserve all existing code, logic, formatting, and comments that do not need to change. Do not refactor, reformat, or rephrase unrelated code or documentation unless explicitly asked to do so.