#!/bin/sh
set -e

# initialize github:
git remote add origin https://github.com/erezmath/math-website.git



# Usage: ./deploy.sh "Your commit message"
COMMIT_MSG=${1:-"Update site"}

git add .
git commit -m "$COMMIT_MSG"
git branch -M main
git push -u origin main