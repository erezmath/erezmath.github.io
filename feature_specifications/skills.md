# Project Engineering Standards (`skills.md`)

## 1. Core Philosophy

* **KISS (Keep It Simple, Stupid)**: Prioritize code readability and maintainability over cleverness or brevity. Explicit is always better than implicit.
* **DRY (Don't Repeat Yourself)**: Avoid duplicating logic or hardcoding data in multiple places. Logic and configuration must be centralized.
* **Single Source of Truth (SSOT)**: Data originates from Google Drive, is processed into JSON, and only then rendered. Never hardcode data in the HTML/JS that already exists in the source JSON files.
* **Modular Layers**: Maintain a strict separation of concerns across the pipeline:
  1. **Data Acquisition**: Python/Google Drive API (`drive_to_class_json.py`, `drive_changes.py`).
  2. **Data Transformation & Build**: JSON processing, caching, and HTML generation (`build_site.py`).
  3. **Presentation**: Jinja2 templates (`.html`), Vanilla JS (`main.js`), and pure CSS (`main.css`).

## 2. Python Backend & Build Standards

* **Strings**: Use single quotes (`'`) for string literals by default, unless double quotes (`"`) are explicitly required to avoid escaping inside the string.
* **Path Management**: Always use `os.path` (e.g., `os.path.join()`, `os.path.exists()`) for file path manipulations to ensure cross-platform compatibility.
* **Type Hinting**: Use Python type hints (e.g., `def load_data(file_path: str) -> dict:`) to enhance IDE support, readability, and catch bugs early.
* **Configuration**: Define all constants, folder paths (e.g., `DATA_DIR`, `DIST_DIR`), and flags at the very top of the script using `UPPER_CASE` naming conventions.
* **Error Handling & Logging**: Always use the custom `logger.py` module (which tracks IST time) for logging major events and errors. Avoid using raw `print()` statements for core logical flows; reserve `print()` only for direct CLI user feedback.
* **Documentation**: 
  * Every function must have a clear Docstring explaining its purpose, arguments, and return values.
  * Use inline comments for complex logical blocks or API interactions.

## 3. Frontend Standards (HTML/JS/CSS)

* **Vanilla Tech Stack**: Do not introduce external frontend frameworks (like React, Vue, or Tailwind). Rely strictly on Vanilla JavaScript (ES6+) and modern CSS.
* **CSS Architecture**:
  * Use **CSS Variables** (`:root`) for colors, spacing, and transitions to maintain a unified global design system.
  * Organize `main.css` into heavily documented, numbered sections with clear comment banners (e.g., `/* 1. Variables & Global Settings */`).
  * Ensure full RTL (Right-to-Left) support and prioritize mobile-first responsive design using modern CSS capabilities.
* **JavaScript Architecture**:
  * Organize `main.js` into numbered sections (e.g., Global Variables, Utilities, Logic, Initialization).
  * Strictly use `const` and `let`; never use `var`.
  * Maintain existing performance patterns, such as "Progressive Loading" for assignments and "Hover Previews" for Drive/YouTube links.
* **Templating (Jinja2)**:
  * Heavily utilize Template Inheritance (`{% extends 'base.html' %}`).
  * Keep templates logic-light. Perform heavy data manipulation, sorting, and filtering in Python before passing the context variables to Jinja2.

## 4. Build & Deployment

* **Static Site Generation**: The output must always target the `docs/` folder to maintain compatibility with GitHub Pages deployment.
* **Caching Strategy**: Respect and maintain the `cache/` directory logic. The build process must intelligently use cached API responses and JSON files to prevent redundant network calls and speed up the generation process.
* **Build Cleanliness**: Ensure temporary build artifacts or specific hidden files (like `desktop.ini`) are cleaned up using the existing utility scripts before final deployment.

## 5. AI Collaboration Protocol

* **Full File Outputs**: When generating code to implement a feature or fix a bug, provide the complete, updated file content. This allows for direct copy-pasting to replace the existing file so changes can be tracked easily using IDE diff tools.
* **Surgical Edits**: Code modifications must be as surgical as possible. Only alter the specific lines required to implement the request.
* **Zero Unnecessary Changes**: Strictly preserve all existing code, logic, formatting, and comments that do not need to change. Do not refactor, reformat, or rephrase unrelated code or documentation unless explicitly asked to do so.