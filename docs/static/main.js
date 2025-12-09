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
  
  // Assignments progressive loading (for HTML/Markdown)
  // Now: Each assignment block is the content between <hr> tags (weekly assignment)
  // Show first 2 blocks, then reveal one more per click, up to 2 more times, then show the link
  let assignmentsBlocks = null;
  let assignmentsCurrentBlocks = 2; // Start by showing 2 blocks
  const assignmentsMaxClicks = 2;   // User can click 'see more' 2 times (so up to 4 blocks)
  let assignmentsClicks = 0;

  function loadMoreAssignments() {
    if (!assignmentsBlocks) {
      setupAssignmentsBlocks();
    }
    if (!assignmentsBlocks) return;

    assignmentsClicks += 1;
    assignmentsCurrentBlocks += 1;
    renderAssignmentsBlocks();
  }
  

  function setupAssignmentsBlocks() {
    const assignmentsSection = document.getElementById('assignments');
    if (assignmentsSection) {
      const fullHtml = assignmentsSection.getAttribute('data-full-html');
      if (fullHtml) {
        // Parse the HTML into DOM nodes
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fullHtml;
        // Split content into blocks by <hr>, but keep <hr> visible at the end of each block (except last)
        assignmentsBlocks = [];
        let currentBlock = document.createElement('div');
        for (let node of tempDiv.childNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'HR') {
            // Add the <hr> to the current block before pushing
            currentBlock.appendChild(node.cloneNode(true));
            assignmentsBlocks.push(currentBlock);
            currentBlock = document.createElement('div');
          } else {
            currentBlock.appendChild(node.cloneNode(true));
          }
        }
        // Push the last block if it has content
        if (currentBlock.childNodes.length > 0) {
          assignmentsBlocks.push(currentBlock);
        }
      }
    }
  }

  function renderAssignmentsBlocks() {
    const assignmentsTextDiv = document.getElementById('assignments-text');
    if (!assignmentsBlocks || !assignmentsTextDiv) return;

    // Show up to assignmentsCurrentBlocks blocks
    assignmentsTextDiv.innerHTML = '';
    for (let i = 0; i < Math.min(assignmentsCurrentBlocks, assignmentsBlocks.length); i++) {
      assignmentsTextDiv.appendChild(assignmentsBlocks[i].cloneNode(true));
    }

    // Show/hide controls
    const loadMoreBtn = document.getElementById('load-more-btn');
    const viewFullLink = document.getElementById('view-full-link');
    if (
      assignmentsClicks >= assignmentsMaxClicks ||
      assignmentsCurrentBlocks >= assignmentsBlocks.length
    ) {
      loadMoreBtn.style.display = 'none';
      viewFullLink.style.display = 'inline-block';
    } else {
      loadMoreBtn.style.display = 'inline-block';
      viewFullLink.style.display = 'none';
    }
  }

  function setupAssignments() {
    assignmentsBlocks = null;
    assignmentsCurrentBlocks = 2;
    assignmentsClicks = 0;
    setupAssignmentsBlocks();
    renderAssignmentsBlocks();
  } 



  //Gets the current date in Israel Standard Time (IST)
  //Finds all elements with class lesson-due-date
  //Extracts dates matching the dd.mm.yyyy pattern using regex
  //Validates that the extracted date is legitimate
  //Adds color-alert if the date is today, or color-warning if it's in the future
  //Does nothing for past dates or invalid/missing dates
  function is_date_today_or_future() {
    // Get current date in Israel timezone
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all lesson-due-row divs
    const dueDivs = document.querySelectorAll('.lesson-due-date');
    
    //console.log(`Found ${dueDivs.length} lesson-due-date elements`); // Debug log
    
    dueDivs.forEach(div => {
      // Extract date using regex pattern dd.mm.yyyy
      const text = div.textContent;
      const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      
      if (!dateMatch) {
        //console.log('No date found in:', text); // Debug log
        return;
      }
      
      // Parse the extracted date
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
      const year = parseInt(dateMatch[3], 10);
      
      // Validate date
      const extractedDate = new Date(year, month, day);
      if (extractedDate.getDate() !== day || 
          extractedDate.getMonth() !== month || 
          extractedDate.getFullYear() !== year) {
        console.log('Invalid date:', dateMatch[0]); // Debug log
        return;
      }
      
      //console.log(`Checking date: ${dateMatch[0]}, Today: ${today.toLocaleDateString()}, Tomorrow: ${tomorrow.toLocaleDateString()}`); // Debug log
      
      // Compare dates
      if (extractedDate.getTime() === today.getTime() || extractedDate.getTime() === tomorrow.getTime()) {
        div.classList.add('color-alert');
        //console.log('Added color-alert to:', dateMatch[0]); // Debug log
      } else if (extractedDate > tomorrow) {
        div.classList.add('color-warning');
        //console.log('Added color-warning to:', dateMatch[0]); // Debug log
      } else {
        //console.log('Date is in the past:', dateMatch[0]); // Debug log
      }
    });
  }

  // Call the function when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', is_date_today_or_future);
  } else {
    // DOM is already loaded
    is_date_today_or_future();
  }