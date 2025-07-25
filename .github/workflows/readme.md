#Explanation of Each Section

- name: The name of the workflow as it appears in GitHub Actions UI.
- on.schedule:
    - Uses cron syntax to run at 00:00 UTC every day.
    - Israel Standard Time is UTC+2 (winter) or UTC+3 (summer).
    - 00:00 UTC = 3am IST during daylight saving (summer), 2am IST in winter.
    - If you want strict 3am IST year-round, you’d need a more complex solution (see below).
- on.workflow_dispatch: Allows you to trigger the workflow manually from the GitHub UI.
- jobs.build.runs-on: Uses the latest Ubuntu runner.
- steps:
    - Checkout repository: Gets your code.
    - Set up Python: Installs Python (adjust version as needed).
    - Install dependencies: Installs your Python requirements.
    - Set up Google credentials:
        - You must add your Google Drive API credentials as a GitHub Actions secret named GOOGLE_CREDENTIALS_JSON.
        - This step writes the secret to secrets/credentials.json for your scripts.
    - Build site: Runs your build script, regenerating data and building the site.
    - Commit and push changes:
        - Configures git for the bot.
        - Adds and commits changes in docs/.
        - Pushes to your repository.


# Additional Info & Recommendations

- Google Credentials:
    - In your repo’s Settings → Secrets and variables → Actions, add a new secret named GOOGLE_CREDENTIALS_JSON with the contents of your credentials.json file.
- Token Expiry:
    - If your Google Drive token expires, you may need to refresh it manually or automate the OAuth flow.
- DST Handling:
    - If you need the workflow to always run at 3am IST regardless of daylight saving, you’ll need to update the cron schedule twice a year, or use a more advanced solution (e.g., a custom time check in the workflow).
- Commit Fails Gracefully:
    - If there are no changes, the commit step will fail, but the workflow will continue. This is normal.


