I want to add an option to allow sending a link to a specific lesson by whatsapp or copy link.
I want to add a share fotter to each div class lesson in the generated html.
the share footer should be a minimilistic row of icons with "link" and whatsapp. 

an example can be seen in try folder, file try.html.

additionally, currently lessons and exapnd and collapse anywhere on the lesson. for the new implementation, change so that in expand/collapse only if you press on lesson-header.


now since there's designated share button, you need to remove the old implementation where clicking on any lesson, added a hash to the ur.
first go over the current js implementation, and make sure i didn't miss anything in the following change.
The new implementation should be:
1. when lesson is clicked on lesson-header to be expanded/collapsed it should not add hash.
2. when a lesson is clicked and a hash exists, it should be removed. this if for the case where a user entered through a url that was shared with a hash. 

working behaviour that should not change:
3. when lesson is clicked, it should still expand/collapse lessons on the same row (see current implementation)
4. when a user enters the website with a url with a hash, the lesson should be scrolled to (as it currenly does), and highlighted (as it currenlty does).

change is not working as intended. 
I think there's a difference in behaviour between normal desktop screens, and small screens (mimicing behaviour through deverloper tools)
1. lesson does not collase when pressing on lesson-header. it collapses on small screens but not on a normal desktop screen. check why the difference is, and the behaviour should not be screen size dependent.
2. when entering from a url with a hash, and expanding a different lesson, does not remove the hash as required. I think there's again a different behaviour in small screens vs desktop screens, and the implementation should be consistent.