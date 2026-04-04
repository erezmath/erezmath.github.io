i want to add the following functionaility:

# feature short descrtiption:
When a user hovers a file that came from google drive or youtube, on demand display a high resolution thumbnail image of it. 
google drive should have it stored and available for fething without reducing the website's speed .
for example: https://drive.google.com/thumbnail?id=FILE_ID&sz=s1200

## Limit behavior to:
- Desktop only, and only on hover:
This behaviour should only be on desktop. use window.matchMedia("(hover: hover) and (pointer: fine)").matches to ensure it only activates on non-touch desktop devices. 
- hover delay:
Additionaly, hover preview after 200ms, This prevents accidental popups when a user is quickly moving their mouse across the screen, but feels responsive when they intentionally stop on a link. 
The paramter 200ms should be a global variable, to allow to easily change it.
- non google drive links:
do not display any thubmnail.
- google drive links that are not files that have a thumbnails:
do not display any thubmnail.

## thubmnail position:
the website is hebrew, reading right to left.
- Image should not be cropped.
- The image should be to the immediate left of the mouse position. 
- Ideally, the middle of the image vertically, should be where the mouse position is. If it is too close to the edges to fit the whole image, offset the middle of the image. For example, if you're too close to the top side to fit the whole image, move the image down so that it fits completely.


## Changes in the code:
- you should not delete any code lines. change only what's required, and do not delete or change existing code and functionality.
- changes should be elegant and adhere to insustry standadard and avoid code smell.
- if you changed code in a file or multiple files (for example, js, and css), provide the full changed files as response, so I can copy and paste the entire code to my ide and easily diff any changes in my ide.
- comments should be added in the style of the current comments

## output:
output the full working changed files, so i can diff in my ide. In gemini dialouge, only display what's changed and the line numbers.

## create thumbnails from the following providers:
- google drive
- youtube