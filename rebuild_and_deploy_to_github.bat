@echo off
REM 1. Build the website (including regenerating data)
python build_site.py --regen-data
IF %ERRORLEVEL% NEQ 0 (
    echo Build failed. Aborting deployment.
    exit /b %ERRORLEVEL%
)

REM 2. Commit changes with date and time as the message
for /f "tokens=1-5 delims=/: " %%d in ("%date% %time%") do (
    set datestr=%%d-%%e-%%f %%g:%%h
)
REM Remove any invalid characters for git commit
set datestr=%datestr:/=-%
set datestr=%datestr::=-%
git add .
git commit -m "%datestr%"

REM 3. Push to your GitHub repo
git branch -M main
git remote set-url origin https://github.com/erezmath/erezmath.github.io.git
git push -u origin main
