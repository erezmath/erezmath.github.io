## iteration 1 - first prompt to gemini pro:

build a full working computer program in python, that recieves as input multiple tests, and extracts questions from them.

as proof of concept, create the main function that will be called extract_questions().
input: pdf_file_path: the specific pdf file.
output: pdf_folder_path: the folder path to the extracted questions.

each question should be extracted as a separate pdf file, and the file name should be the question number, 
and the file should be saved in the pdf_folder_path. the pdf_folder_path should be created if it does not exist.



function requirements:
- the function should be able to handle pdf files with multiple pages.
- the function should be able to handle pdf files with multiple questions per test
- each question can have multiple words, images, symbols, numbers letters, etc.
- questions can span over multiple pages.

for each question:
- detect the rows where the question begins and ends.
- detect the images attached to the question.
- extract all words, images, symbols, numbers letters, etc of the question.
- extract and preserve all parameters and layout of the original question. 

the tests can have multiple origin and different test formats.
It is better to create a general function that detects and extrcacts questions of any test. 
however, if the need arises and a general function is sub optimal, you can detect the test format, and create multiple extraction plans, for multiple test formats.


## iteration 2:
attaching several tests as examples.

i gave a few pdf examples. 

run the program you suggested and visually display to me the cropped questions.

detect questions that were not sliced optimally (some image or text is cut), and display them as well.

After reviewing the cases where the slicing was not optimal, review your code and improve it.

do this repeatedly 3 times and improve your code.

## iteration 3:
run 5 more iterations to further improve your code.

## iteration 4:
attaching additional tests.

run your final program on all tests including the 2 additional tests, and iterate 2 more times to improve your program.

## iteration 5:
run the program final time on all pdfs - list all questions that were not extracted optimally.



## result:
Bagrut - 100% extracted correctly.
other tests - have issues.