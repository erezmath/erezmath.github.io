# Feature specifications

## Create submit soon topic

**Feature name:** Create submit soon topic  
**File:** `static/main.js`

### Purpose

Add a first topic "0. להגשה בקרוב" (Submit soon) that lists all lessons with a due date that is today or in the future, so students can quickly find items due soon.

### Behavior

1. **Feature flag:** A global boolean `globalCreateSubmitSoonTopic` (default `true`) turns the feature on or off.

2. **New topic:** When the feature is on and there is at least one submit-soon lesson, a new topic is created as the **first** topic:
   - Title: "0. להגשה בקרוב"
   - Section id: `0-הגשה-בקרוב`
   - A matching button is added at the start of the topics nav.

3. **Submit soon:** A lesson is "submit soon" if its due date (from `.lesson-due-date`) is **today or any future date** (same as existing `is_date_today_or_future` logic).

4. **Lesson source:** Each `.lesson-due-date` is a descendant of a single `.lesson`. That lesson’s `id` is collected; the same lesson is not added twice.

5. **Duplication:** Submit-soon lessons stay in their original topic and also appear in "0. להגשה בקרוב" (intentional double display).

6. **Cloned lessons:**
   - Each copied lesson gets a new id: original id + suffix `-submit-soon`.
   - The first inner link (`a[href^="#"]`) in the clone is set to `#` + the new id (so hash links target the clone).

### Implementation details

- **Globals:** `globalCreateSubmitSoonTopic` (boolean), `globalSubmitSoonLessons` (array of lesson ids).
- **Execution order:** On `DOMContentLoaded`: run `is_date_today_or_future()` (which fills `globalSubmitSoonLessons` when the feature is on), then `createSubmitSoonTopic()`, then the rest of the setup (expand, nav, scrollspy, folders, assignments).
- **Empty state:** The topic "0. להגשה בקרוב" is created only when `globalSubmitSoonLessons.length > 0`.

### Clarifications (from README)

- Edit `static/main.js`, not `docs/static/main.js`.
- `.lesson-due-date` is always a descendant of the lesson to add to the new topic.
- Submit soon = all future and today.
- Id suffix format: `-submit-soon`.
- href of cloned items: set to the new id (`#<id>-submit-soon`).
