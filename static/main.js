// Expand/collapse for lessons with chevron
function setupLessonExpand() {
    document.querySelectorAll('.accordion').forEach(accordion => {
      const lessons = Array.from(accordion.querySelectorAll('.lesson'));
      accordion.querySelectorAll('.lesson-header').forEach((header, idx) => {
        header.addEventListener('click', function() {
          // Get ALL lessons on the page, not just in this accordion
          const allLessons = Array.from(document.querySelectorAll('.lesson'));
          
          // Determine columns: 2 on desktop, 1 on mobile
          const columns = window.matchMedia('(min-width: 700px)').matches ? 2 : 1;
          let rowStart;
          if (columns === 2) {
            rowStart = idx % 2 === 0 ? idx : idx - 1;
            const targetLesson = lessons[rowStart];
            const clickedLesson = lessons[idx]; // The actual lesson that was clicked
            const isRowExpanded = targetLesson.classList.contains('expanded');
            const currentHash = window.location.hash.substring(1);
            const isClickingCurrentHash = clickedLesson.id === currentHash;
            
            if (isRowExpanded && isClickingCurrentHash) {
              // Row is expanded and clicking on the lesson that's currently in hash - collapse
              allLessons.forEach(lesson => lesson.classList.remove('expanded'));
              history.replaceState(null, '', window.location.pathname);
            } else if (isRowExpanded && !isClickingCurrentHash) {
              // Row is expanded but clicking on the other lesson - switch focus
              history.replaceState(null, '', '#' + clickedLesson.id);
            } else {
              // Row is not expanded - expand and focus on clicked lesson
              allLessons.forEach(lesson => lesson.classList.remove('expanded'));
              [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
                if (lesson) lesson.classList.add('expanded');
              });
              history.replaceState(null, '', '#' + clickedLesson.id);
            }
          } else {
            const targetLesson = lessons[idx];
            const isExpanding = !targetLesson.classList.contains('expanded');
            
            // Close all lessons first (across all topics)
            allLessons.forEach(lesson => lesson.classList.remove('expanded'));
            
            // If we were expanding, expand the target lesson
            if (isExpanding) {
              lessons[idx].classList.add('expanded');
              // Update hash to this lesson
              history.replaceState(null, '', '#' + lessons[idx].id);
            } else {
              // If we were collapsing, remove hash from URL
              history.replaceState(null, '', window.location.pathname);
            }
          }
        });
        header.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            // Get ALL lessons on the page, not just in this accordion
            const allLessons = Array.from(document.querySelectorAll('.lesson'));
            
            const columns = window.matchMedia('(min-width: 700px)').matches ? 2 : 1;
            let rowStart;
            if (columns === 2) {
              rowStart = idx % 2 === 0 ? idx : idx - 1;
              const targetLesson = lessons[rowStart];
              const clickedLesson = lessons[idx]; // The actual lesson that was clicked
              const isRowExpanded = targetLesson.classList.contains('expanded');
              const currentHash = window.location.hash.substring(1);
              const isClickingCurrentHash = clickedLesson.id === currentHash;
              
              if (isRowExpanded && isClickingCurrentHash) {
                // Row is expanded and clicking on the lesson that's currently in hash - collapse
                allLessons.forEach(lesson => lesson.classList.remove('expanded'));
                history.replaceState(null, '', window.location.pathname);
              } else if (isRowExpanded && !isClickingCurrentHash) {
                // Row is expanded but clicking on the other lesson - switch focus
                history.replaceState(null, '', '#' + clickedLesson.id);
              } else {
                // Row is not expanded - expand and focus on clicked lesson
                allLessons.forEach(lesson => lesson.classList.remove('expanded'));
                [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
                  if (lesson) lesson.classList.add('expanded');
                });
                history.replaceState(null, '', '#' + clickedLesson.id);
              }
            } else {
              const targetLesson = lessons[idx];
              const isExpanding = !targetLesson.classList.contains('expanded');
              
              // Close all lessons first (across all topics)
              allLessons.forEach(lesson => lesson.classList.remove('expanded'));
              
              // If we were expanding, expand the target lesson
              if (isExpanding) {
                lessons[idx].classList.add('expanded');
                history.replaceState(null, '', '#' + lessons[idx].id);
              } else {
                // If we were collapsing, remove hash from URL
                history.replaceState(null, '', window.location.pathname);
              }
            }
            e.preventDefault();
          }
        });
      });
    });
  }
  
  // Sticky topics nav active state (click)
  function setupTopicsNav() {
    const nav = document.querySelector('.topics-nav');
    if (!nav) return;
    const btns = nav.querySelectorAll('.topic-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', function() {
        // Only scroll to the section, do not set .active here
        const id = this.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
        if (id) {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }
  
  // Scrollspy for topics nav
  function setupTopicsScrollSpy() {
    const nav = document.querySelector('.topics-nav');
    if (!nav) return;
    const btns = Array.from(nav.querySelectorAll('.topic-btn'));
    const ids = btns.map(btn => btn.getAttribute('onclick')?.match(/'(.*?)'/)?.[1]).filter(Boolean);
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);

    // Check if all topics are visible in the navigation - run once since screen width doesn't change
    function checkTopicsVisibility() {
      const navRect = nav.getBoundingClientRect();
      const lastBtnRect = btns[btns.length - 1].getBoundingClientRect();
      const firstBtnRect = btns[0].getBoundingClientRect();
      
      // A button is visible if its entire width is within the nav's bounds
      const firstButtonVisible = firstBtnRect.left >= navRect.left && firstBtnRect.right <= navRect.right;
      const lastButtonVisible = lastBtnRect.left >= navRect.left && lastBtnRect.right <= navRect.right;
      
      // If both first and last buttons are visible, all buttons in between are also visible
      return firstButtonVisible && lastButtonVisible;
    }
    
    // Store the result since screen width doesn't change
    const allTopicsVisible = checkTopicsVisibility();

    function onScroll() {
      // Always remove .active from all buttons first
      btns.forEach(b => b.classList.remove('active'));
      let found = false;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();
        
        // Check if section is in view (accounting for sticky header)
        if (rect.top <= 150) { // Adjusted threshold for sticky header
          found = true;
          btns[i].classList.add('active');
          
          // Only scroll the topics nav if not all topics are visible
          if (!allTopicsVisible) {
            btns[i].scrollIntoView({ 
              behavior: "smooth", 
              inline: "center", 
              block: "nearest" 
            });
          }
          
          break;
        }
      }
      
      // If we're at the very top of the page, activate first button
      if (!found && window.scrollY < 100) {
        btns[0].classList.add('active');
      }
    }

    // Throttle scroll events
    let ticking = false;
    document.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initial check
    onScroll();
}
  
  // Scroll to topic section
  function scrollToTopic(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

function setupLessonFolders() {
  document.querySelectorAll('.lesson-folder .folder-row').forEach(row => {
    row.addEventListener('click', function() {
      const li = this.closest('.lesson-folder');
      const content = li.querySelector('.folder-content');
      const icon = this.querySelector('.folder-icon');
      const closedSvg = icon.querySelector('.icon-folder-closed');
      const openSvg = icon.querySelector('.icon-folder-open');
      const expanded = li.classList.toggle('expanded');
      content.style.display = expanded ? 'block' : 'none';
      icon.setAttribute('data-state', expanded ? 'open' : 'closed');
      closedSvg.style.display = expanded ? 'none' : '';
      openSvg.style.display = expanded ? '' : 'none';
    });
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        this.click();
        e.preventDefault();
      }
    });
  });
}
  
  // Enhanced hash navigation for lesson IDs
  function scrollToHashTarget() {
    
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.substring(1));
      if (el) {
        // Get total sticky offset
        const header = document.querySelector('.site-header');
        const topicsNav = document.querySelector('.topics-nav');
        let offset = 0;
        if (header) offset += header.offsetHeight;
        if (topicsNav && getComputedStyle(topicsNav).position === 'sticky') offset += topicsNav.offsetHeight;
        
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetScroll = rect.top + scrollTop - offset - 8;
        
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
        // Pop effect: add a class that mimics .lesson:hover
        el.classList.add('lesson-pop');
        setTimeout(() => {
          el.classList.remove('lesson-pop');
        }, 1500); // Duration in ms for the pop effect, remember that it takes time to reach the target
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setupLessonExpand();
    setupTopicsNav();
    setupTopicsScrollSpy();
    setupLessonFolders();
    setupAssignments();
    
    // Handle hash navigation on page load with a small delay to ensure everything is rendered
    setTimeout(() => {
      scrollToHashTarget();
    }, 100); // Small delay to ensure sticky elements are fully rendered
  });

  // Handle hash changes (e.g., when user clicks a hash link)
  window.addEventListener('hashchange', scrollToHashTarget);
  
  // Assignments progressive loading
  let assignmentsData = null;
  let currentRows = 10;
  const maxRows = 30;
  
  function loadMoreAssignments() {
    if (!assignmentsData) {
      // Get the full assignments text from the page
      const assignmentsSection = document.getElementById('assignments');
      if (assignmentsSection) {
        // Store the full text in a data attribute or get it from the server
        // For now, we'll need to pass the full text via a data attribute
        const fullText = assignmentsSection.getAttribute('data-full-text');
        if (fullText) {
          assignmentsData = fullText.split('\n');
        }
      }
    }
    
    if (assignmentsData) {
      currentRows += 10;
      const displayText = assignmentsData.slice(0, currentRows).join('\n');
      document.getElementById('assignments-text').textContent = displayText;
      
      const loadMoreBtn = document.getElementById('load-more-btn');
      const viewFullLink = document.getElementById('view-full-link');
      
      if (currentRows >= maxRows) {
        loadMoreBtn.style.display = 'none';
        viewFullLink.style.display = 'inline-block';
      }
    }
  }
  
  function setupAssignments() {
    const assignmentsSection = document.getElementById('assignments');
    if (assignmentsSection) {
      const fullText = assignmentsSection.getAttribute('data-full-text');
      if (fullText) {
        assignmentsData = fullText.split('\n');
        const initialText = assignmentsData.slice(0, 10).join('\n');
        document.getElementById('assignments-text').textContent = initialText;
        
        // Show load more button if there are more than 10 rows
        if (assignmentsData.length > 10) {
          document.getElementById('load-more-btn').style.display = 'inline-block';
        }
      }
    }
  } 