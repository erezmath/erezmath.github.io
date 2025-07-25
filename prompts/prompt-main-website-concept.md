you are given a task to create a static multi page website. 

I'm a high school teacher, teaching math, and the website is aim to display my math lessons for my students, similar to google classroom. the website is free, no money interaction.

target audience meet all the following parameters:  
- High school students learning math. 
- Hebrew speakers. 
- learn in one of my classes.
- ages 14-18

Currently i have 4 classes, to each class there will be a separate web page.
for each class, there are several topics, and for each topic, there are many lessons.
The classes, topics, and lessons are organized in google drive

the google drive layout is:
- each of the main folders are classes.
- each of the folders beneath the classes, are topics of that class.
- each of the folders beneath the topics, are lessons.
- each lesson folder contains files or folders.

It is important that all the html will be right to left oriented.

Html layout:
1. home page: should display a welcome banner in hebrew, and boxes for each class where each box witll have the class name and tags which topics are in it and the number of lessons in it. 
2. each class will be a different page. the html page for a class should look like this:
- banner with learning high school math.
- on the banner, write the class name.
- below the banner, there should be topics navigation bar for the different topics of the class to allow easy navigation. the navigation bar should be sticky and represent the current topic viewed.
- below the topics navigation bar, will be a container for each topic, with a h2 tag of the topic name, and each lesson in a separate expand/collapse button.
- when expanding/collapsing the lesson:
   - there can (but not must) be some brief text explaining the lesson with mathematic notations
   - then it will display a list of links to the files, or if there is a folder, it will the folder name, and the links to the files in the folder will be tabbed so that the user understand that it's inside a folder. do not show icons of file or folder, and do not show file extension (for example if a file is "myfile.pdf", display without the ".pdf" extension)
- make the layout responsive, so that if width allows it, put 2 lessons in the same row, and when expanding/collapsing one of them, the other should. 

for example:
class name: "כיתה י 571 תשפה", "כיתה ט מצוינות תשפה"
there are 6 topics, for example: "אלגברה", "גאומטריה", גאומטריה אנליטית"
and in each topic add a random number of lessons between 10-30 lessons. 
an example of a lesson names: 
"7. בוחן לדוגמא משוואות נוסחאות כפל מקוצר", 
"1. נוסחת השורשים - הוכחה של הנוסחה המלאה"


website navbar: 
the navbar should currently have a the following fields:
- home button (icon home only, no text )
- dropdown selection of classes.
when you are viewing the home page, the home button should color should change to represent that this is the page you are viewing. 
when you are viewing a page, the class name should appear in the dropdown as selected, and its color should change, representing that this is the page you are viewing.


theme:
- engaging, friendly, and fit for ages 14-18
- background image has to do with math. search for a free image that you can incorporate. 
- class banner should be a vibrant image that has to do with math. search for a free image that you can incorporate.
- I prefer a light blue pallete.

restrictions:
- use only the computer languages html, css, python, javascript.


requirements:
- desktop and mobile friendly.

# Sort folders and files using Windows/natural order

the crawler in drive_to_class_json.py should read google drive urls sorted in the same order as windows displays it. i suggest the use of the package natsorted
the crawler that crawls in 