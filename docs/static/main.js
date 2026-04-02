/**
 * ============================================================================
 * MAIN JAVASCRIPT APP
 * * Sections:
 * 1. Global Variables & Config
 * 2. Utility Functions
 * 3. Due Date & "Submit Soon" Logic
 * 4. Topics Navigation & ScrollSpy
 * 5. Accordion & Lesson Folders
 * 6. Share Footer Logic
 * 7. Assignments Progressive Loading
 * 8. Hash Navigation
 * 9. Accessibility (Dropdowns)
 * 10. Initialization
 * ============================================================================
 */


// ============================================================================
// 1. GLOBAL VARIABLES & CONFIG
// ============================================================================

// Submit Soon Topic configuration
const globalCreateSubmitSoonTopic = true;
let globalSubmitSoonLessons = [];
let globalSubmitSoonLessonDueTimes = {};

const SUBMIT_SOON_TOPIC_ID = '0-הגשה-בקרוב';
const SUBMIT_SOON_TOPIC_TITLE = '0. להגשה בקרוב';
const SUBMIT_SOON_ID_SUFFIX = '-submit-soon';

// Assignments configuration
let assignmentsBlocks = null;
let assignmentsCurrentBlocks = 2; // Start by showing 2 blocks
const assignmentsMaxClicks = 2;   // User can click 'see more' 2 times (so up to 4 blocks)
let assignmentsClicks = 0;

const SHARE_ICONS = {
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`
};


// ============================================================================
// 2. UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines grid columns based on screen width.
 * Returns 2 on tablet/desktop, 1 on mobile.
 */
function getLessonGridColumns() {
  return window.matchMedia('(min-width: 769px)').matches ? 2 : 1;
}

/**
 * Gets the base URL for sharing links.
 */
function getBaseUrl() {
  return window.location.origin + window.location.pathname;
}


// ============================================================================
// 3. DUE DATE & "SUBMIT SOON" LOGIC
// ============================================================================

/**
 * Extracts dates from elements, checks if they are today/future.
 * Applies color coding and populates the globalSubmitSoonLessons list.
 */
function is_date_today_or_future() {
  if (globalCreateSubmitSoonTopic) {
    globalSubmitSoonLessons = [];
    globalSubmitSoonLessonDueTimes = {};
  }

  // Get current date in Israel timezone
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get all lesson-due-date elements
  const dueDivs = document.querySelectorAll('.lesson-due-date');
  
  dueDivs.forEach(div => {
    // Extract date using regex pattern dd.mm.yyyy
    const text = div.textContent;
    const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    
    if (!dateMatch) return;
    
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(dateMatch[3], 10);
    
    // Validate extracted date
    const extractedDate = new Date(year, month, day);
    if (extractedDate.getDate() !== day || 
        extractedDate.getMonth() !== month || 
        extractedDate.getFullYear() !== year) {
      console.log('Invalid date:', dateMatch[0]);
      return;
    }
    
    const isTodayOrFuture = extractedDate.getTime() >= today.getTime();
    if (isTodayOrFuture) {
      if (extractedDate.getTime() === today.getTime() || extractedDate.getTime() === tomorrow.getTime()) {
        div.classList.add('color-alert'); // Due today/tomorrow
      } else {
        div.classList.add('color-warning'); // Due in future
      }
      
      // Store lesson IDs for the submit soon block
      if (globalCreateSubmitSoonTopic) {
        const lesson = div.closest('.lesson');
        if (lesson && lesson.id && globalSubmitSoonLessons.indexOf(lesson.id) === -1) {
          globalSubmitSoonLessons.push(lesson.id);
          globalSubmitSoonLessonDueTimes[lesson.id] = extractedDate.getTime();
        }
      }
    }
  });
}

/**
 * Creates a dynamic "Submit Soon" topic section at the top of the page
 * populated with cloned lessons that have upcoming due dates.
 */
function createSubmitSoonTopic() {
  if (!globalCreateSubmitSoonTopic || !globalSubmitSoonLessons.length) return;
  const topicsList = document.querySelector('.topics-list');
  const topicsNav = document.querySelector('.topics-nav');
  if (!topicsList || !topicsNav) return;

  // Sort by due date ascending. Missing/invalid dates go last.
  const submitSoonLessonsSorted = globalSubmitSoonLessons
    .slice()
    .sort((a, b) => {
      const ta = Number.isFinite(globalSubmitSoonLessonDueTimes[a]) ? globalSubmitSoonLessonDueTimes[a] : Number.POSITIVE_INFINITY;
      const tb = Number.isFinite(globalSubmitSoonLessonDueTimes[b]) ? globalSubmitSoonLessonDueTimes[b] : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return String(a).localeCompare(String(b), 'he');
    });

  // Create section DOM elements
  const section = document.createElement('section');
  section.className = 'topic-section';
  section.id = SUBMIT_SOON_TOPIC_ID;
  
  const h2 = document.createElement('h2');
  h2.textContent = SUBMIT_SOON_TOPIC_TITLE;
  section.appendChild(h2);
  
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  section.appendChild(accordion);

  // Clone active lessons into the new block
  submitSoonLessonsSorted.forEach(lessonId => {
    const lessonEl = document.getElementById(lessonId);
    if (!lessonEl) return;
    const clone = lessonEl.cloneNode(true);
    const newId = lessonId + SUBMIT_SOON_ID_SUFFIX;
    clone.id = newId;
    const anchor = clone.querySelector('a[href^="#"]');
    if (anchor) anchor.setAttribute('href', '#' + newId);
    accordion.appendChild(clone);
  });

  topicsList.insertBefore(section, topicsList.firstChild);

  // Add nav button for the new block
  const navBtn = document.createElement('button');
  navBtn.className = 'topic-btn';
  navBtn.setAttribute('onclick', "scrollToTopic('" + SUBMIT_SOON_TOPIC_ID + "')");
  navBtn.textContent = SUBMIT_SOON_TOPIC_TITLE;
  
  topicsNav.querySelectorAll('.topic-btn').forEach(btn => btn.classList.remove('active'));
  topicsNav.insertBefore(navBtn, topicsNav.firstChild);
}


// ============================================================================
// 4. TOPICS NAVIGATION & SCROLLSPY
// ============================================================================

/**
 * Initialize topic navigation buttons (Event listener omitted to prevent conflict 
 * with the inline onclick="scrollToTopic(id)" HTML attribute).
 */
function setupTopicsNav() {
  // Logic intentionally empty. Relies on HTML onclick attribute.
}

/**
 * Handles smooth scrolling to a specific topic section.
 * Calculates exact position taking into account sticky headers.
 */
function scrollToTopic(id) {
  const section = document.getElementById(id);
  if (section) {
    // Target the h2 inside the section for precise scrolling
    const h2 = section.querySelector('h2');
    const targetEl = h2 ? h2 : section;
    
    const header = document.querySelector('.site-header');
    const topicsNav = document.querySelector('.topics-nav');
    
    let offset = 0;
    // Add offset only if headers are actually sticky
    if (header && getComputedStyle(header).position === 'sticky') {
      offset += header.offsetHeight;
    }
    if (topicsNav && getComputedStyle(topicsNav).position === 'sticky') {
      offset += topicsNav.offsetHeight;
    }
    
    const rect = targetEl.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate target scroll with 4px breathing room
    const targetScroll = rect.top + scrollTop - offset - 4;
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }
}

/**
 * Updates the active state of navigation buttons as the user scrolls.
 */
function setupTopicsScrollSpy() {
  const nav = document.querySelector('.topics-nav');
  if (!nav) return;
  
  const btns = Array.from(nav.querySelectorAll('.topic-btn'));
  const ids = btns.map(btn => btn.getAttribute('onclick')?.match(/'(.*?)'/)?.[1]).filter(Boolean);
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);

  function onScroll() {
    const refY = 150; // Reference line from viewport top
    btns.forEach(b => b.classList.remove('active'));

    let activeIndex = -1;
    // Find the section that currently intersects the reference line
    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= refY && rect.bottom > refY) {
        activeIndex = i;
        break;
      }
    }
    
    // Fallback if no section explicitly intersects
    if (activeIndex === -1) {
      if (sections.length && sections[0].getBoundingClientRect().top > refY) {
        activeIndex = 0;
      } else {
        for (let i = sections.length - 1; i >= 0; i--) {
          if (sections[i].getBoundingClientRect().top <= refY) {
            activeIndex = i;
            break;
          }
        }
      }
    }
    
    // Set active button and scroll nav horizontally if needed
    if (activeIndex >= 0) {
      const activeBtn = btns[activeIndex];
      activeBtn.classList.add('active');
      
      const navRect = nav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const btnVisibleInNav = btnRect.left >= navRect.left && btnRect.right <= navRect.right;
      
      if (!btnVisibleInNav) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }

  // Throttle scroll events using requestAnimationFrame
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

  onScroll(); // Initial check on load
}


// ============================================================================
// 5. ACCORDION & LESSON FOLDERS
// ============================================================================

/**
 * Initializes the expanding/collapsing logic for the lesson grid.
 * Ensures rows of 2 open together on desktop, and 1 opens independently on mobile.
 */
function setupLessonExpand() {
  document.querySelectorAll('.accordion').forEach(accordion => {
    const lessons = Array.from(accordion.querySelectorAll('.lesson'));
    
    accordion.querySelectorAll('.lesson-header').forEach((header, idx) => {
      // Click Handler
      header.addEventListener('click', function() {
        const allLessons = Array.from(document.querySelectorAll('.lesson'));
        const columns = getLessonGridColumns();
        let rowStart;
        
        if (columns === 2) {
          rowStart = idx % 2 === 0 ? idx : idx - 1;
          const targetLesson = lessons[rowStart];
          const clickedLesson = lessons[idx];
          const isRowExpanded = targetLesson.classList.contains('expanded');
          const clickedLessonInExpandedRow = isRowExpanded && (clickedLesson === lessons[rowStart] || clickedLesson === lessons[rowStart + 1]);
          
          if (clickedLessonInExpandedRow) {
            allLessons.forEach(lesson => lesson.classList.remove('expanded'));
            if (window.location.hash) history.replaceState(null, '', window.location.pathname);
          } else {
            allLessons.forEach(lesson => lesson.classList.remove('expanded'));
            [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
              if (lesson) lesson.classList.add('expanded');
            });
            if (window.location.hash) history.replaceState(null, '', window.location.pathname);
          }
        } else {
          // Mobile logic (1 column)
          const targetLesson = lessons[idx];
          const isExpanding = !targetLesson.classList.contains('expanded');
          allLessons.forEach(lesson => lesson.classList.remove('expanded'));
          if (isExpanding) {
            lessons[idx].classList.add('expanded');
            if (window.location.hash) history.replaceState(null, '', window.location.pathname);
          } else {
            if (window.location.hash) history.replaceState(null, '', window.location.pathname);
          }
        }
      });
      
      // Keyboard Handler (A11y)
      header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const allLessons = Array.from(document.querySelectorAll('.lesson'));
          const columns = getLessonGridColumns();
          let rowStart;
          
          if (columns === 2) {
            rowStart = idx % 2 === 0 ? idx : idx - 1;
            const targetLesson = lessons[rowStart];
            const clickedLesson = lessons[idx];
            const isRowExpanded = targetLesson.classList.contains('expanded');
            const clickedLessonInExpandedRow = isRowExpanded && (clickedLesson === lessons[rowStart] || clickedLesson === lessons[rowStart + 1]);
            
            if (clickedLessonInExpandedRow) {
              allLessons.forEach(lesson => lesson.classList.remove('expanded'));
              if (window.location.hash) history.replaceState(null, '', window.location.pathname);
            } else {
              allLessons.forEach(lesson => lesson.classList.remove('expanded'));
              [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
                if (lesson) lesson.classList.add('expanded');
              });
              if (window.location.hash) history.replaceState(null, '', window.location.pathname);
            }
          } else {
            const targetLesson = lessons[idx];
            const isExpanding = !targetLesson.classList.contains('expanded');
            allLessons.forEach(lesson => lesson.classList.remove('expanded'));
            if (isExpanding) {
              lessons[idx].classList.add('expanded');
              if (window.location.hash) history.replaceState(null, '', window.location.pathname);
            } else {
              if (window.location.hash) history.replaceState(null, '', window.location.pathname);
            }
          }
          e.preventDefault();
        }
      });
    });
  });
}

/**
 * Initializes toggle functionality for sub-folders inside lessons.
 */
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
    
    // Keyboard Handler (A11y)
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        this.click();
        e.preventDefault();
      }
    });
  });
}


// ============================================================================
// 6. SHARE FOOTER LOGIC
// ============================================================================

/**
 * Copies the lesson link to the clipboard and shows a tooltip.
 */
function copyLink(buttonElement, lessonId) {
  const linkToCopy = getBaseUrl() + '#' + lessonId;
  navigator.clipboard.writeText(linkToCopy).then(() => {
    buttonElement.classList.add('show-tooltip');
    setTimeout(() => buttonElement.classList.remove('show-tooltip'), 2000);
  }).catch(() => {
    alert('לא הצלחנו להעתיק את הקישור');
  });
}

/**
 * Opens WhatsApp with a pre-filled sharing message.
 */
function shareWhatsApp(lessonId, lessonTitle, topicTitle) {
  const linkToShare = getBaseUrl() + '#' + lessonId;
  const topicPrefix = topicTitle ? `נושא: ${topicTitle}\n` : '';
  const message = `${topicPrefix}שיעור: ${lessonTitle}\n\n${linkToShare}`;
  window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
}

/**
 * Lazily injects the share footer into a lesson only when it is expanded.
 */
function injectShareFooter(lessonElement) {
  if (!lessonElement) return;

  const content = lessonElement.querySelector('.lesson-content');
  if (!content) return;

  // Lazy Load Check: If footer already exists, exit
  if (content.querySelector('.share-footer')) return;

  let lessonId = lessonElement.id || 'unknown';
  
  // Resolve original ID if inside the "Submit Soon" section
  if (lessonId.endsWith(SUBMIT_SOON_ID_SUFFIX)) {
    lessonId = lessonId.replace(SUBMIT_SOON_ID_SUFFIX, '');
  }

  const lessonTitleEl = lessonElement.querySelector('.lesson-title');
  const lessonTitle = lessonTitleEl ? lessonTitleEl.textContent.trim() : '';

  // Retrieve topic name from original element
  let topicTitle = '';
  const originalLessonElement = document.getElementById(lessonId);
  if (originalLessonElement) {
    const topicSection = originalLessonElement.closest('.topic-section');
    if (topicSection) {
      const h2 = topicSection.querySelector('h2');
      if (h2) {
        topicTitle = h2.textContent.trim();
      }
    }
  }

  const footerHTML = `
    <div class="share-footer">
      <button type="button" class="share-btn whatsapp" data-lesson-id="${lessonId}" data-lesson-title="${lessonTitle}" data-topic-title="${topicTitle}" aria-label="שתף בוואטסאפ">
        ${SHARE_ICONS.whatsapp}
      </button>
      <button type="button" class="share-btn copy" data-lesson-id="${lessonId}" aria-label="העתק קישור">
        ${SHARE_ICONS.copy}
        <span class="tooltip">הקישור הועתק!</span>
      </button>
    </div>
  `;

  content.insertAdjacentHTML('beforeend', footerHTML);
}

/**
 * Uses a MutationObserver to detect when a lesson expands, triggering footer injection.
 */
function setupShareFooterObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('lesson') && target.classList.contains('expanded')) {
          injectShareFooter(target);
        }
      }
    });
  });

  document.querySelectorAll('.lesson').forEach(lesson => {
    observer.observe(lesson, { attributes: true });
  });
}

/**
 * Initializes global event listeners for share buttons.
 */
function setupShareFooter() {
  document.addEventListener('click', function(e) {
    const copyBtn = e.target.closest('.share-btn.copy');
    if (copyBtn) {
      e.preventDefault();
      const lessonId = copyBtn.getAttribute('data-lesson-id');
      if (lessonId) copyLink(copyBtn, lessonId);
      return;
    }
    
    const waBtn = e.target.closest('.share-btn.whatsapp');
    if (waBtn) {
      e.preventDefault();
      const lessonId = waBtn.getAttribute('data-lesson-id');
      const lessonTitle = waBtn.getAttribute('data-lesson-title') || '';
      const topicTitle = waBtn.getAttribute('data-topic-title') || ''; 
      if (lessonId) shareWhatsApp(lessonId, lessonTitle, topicTitle);
    }
  });

  setupShareFooterObserver();
}


// ============================================================================
// 7. ASSIGNMENTS PROGRESSIVE LOADING
// ============================================================================

/**
 * Parses full assignment HTML into individual blocks split by <hr>.
 */
function setupAssignmentsBlocks() {
  const assignmentsSection = document.getElementById('assignments');
  if (assignmentsSection) {
    const fullHtml = assignmentsSection.getAttribute('data-full-html');
    if (fullHtml) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = fullHtml;
      
      assignmentsBlocks = [];
      let currentBlock = document.createElement('div');
      
      for (let node of tempDiv.childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'HR') {
          currentBlock.appendChild(node.cloneNode(true));
          assignmentsBlocks.push(currentBlock);
          currentBlock = document.createElement('div');
        } else {
          currentBlock.appendChild(node.cloneNode(true));
        }
      }
      
      if (currentBlock.childNodes.length > 0) {
        assignmentsBlocks.push(currentBlock);
      }
    }
  }
}

/**
 * Renders the visible assignment blocks to the DOM.
 */
function renderAssignmentsBlocks() {
  const assignmentsTextDiv = document.getElementById('assignments-text');
  if (!assignmentsBlocks || !assignmentsTextDiv) return;

  assignmentsTextDiv.innerHTML = '';
  for (let i = 0; i < Math.min(assignmentsCurrentBlocks, assignmentsBlocks.length); i++) {
    assignmentsTextDiv.appendChild(assignmentsBlocks[i].cloneNode(true));
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  const viewFullLink = document.getElementById('view-full-link');
  
  // Toggle controls visibility based on click count / available blocks
  if (assignmentsClicks >= assignmentsMaxClicks || assignmentsCurrentBlocks >= assignmentsBlocks.length) {
    loadMoreBtn.style.display = 'none';
    viewFullLink.style.display = 'inline-block';
  } else {
    loadMoreBtn.style.display = 'inline-block';
    viewFullLink.style.display = 'none';
  }
}

/**
 * Triggered by the "Load More" button to reveal additional blocks.
 */
function loadMoreAssignments() {
  if (!assignmentsBlocks) {
    setupAssignmentsBlocks();
  }
  if (!assignmentsBlocks) return;

  assignmentsClicks += 1;
  assignmentsCurrentBlocks += 1;
  renderAssignmentsBlocks();
}

/**
 * Bootstraps the assignment section on load.
 */
function setupAssignments() {
  assignmentsBlocks = null;
  assignmentsCurrentBlocks = 2;
  assignmentsClicks = 0;
  setupAssignmentsBlocks();
  renderAssignmentsBlocks();
} 


// ============================================================================
// 8. HASH NAVIGATION
// ============================================================================

/**
 * Smoothly scrolls to an element specified in the URL hash, expanding it if it's a lesson.
 */
function scrollToHashTarget() {
  if (window.location.hash) {
    const el = document.getElementById(window.location.hash.substring(1));
    if (el) {
      // Offset calculation for sticky headers
      const header = document.querySelector('.site-header');
      const topicsNav = document.querySelector('.topics-nav');
      let offset = 0;
      
      if (header && getComputedStyle(header).position === 'sticky') {
        offset += header.offsetHeight;
      }
      if (topicsNav && getComputedStyle(topicsNav).position === 'sticky') {
        offset += topicsNav.offsetHeight;
      }
      
      const rect = el.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetScroll = rect.top + scrollTop - offset - 8;
      
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
      
      // Auto-expand logic matching standard grid rules
      document.querySelectorAll('.lesson').forEach(lesson => lesson.classList.remove('expanded'));

      const accordion = el.closest('.accordion');
      if (accordion) {
        const lessons = Array.from(accordion.querySelectorAll('.lesson'));
        const idx = lessons.indexOf(el);
        const columns = getLessonGridColumns();
        
        if (columns === 2 && idx !== -1) {
          const rowStart = idx % 2 === 0 ? idx : idx - 1;
          [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
            if (lesson) lesson.classList.add('expanded');
          });
        } else {
          el.classList.add('expanded');
        }
      } else {
        el.classList.add('expanded');
      }

      // Temporarily add visual pop effect to highlight the selected lesson
      el.classList.add('lesson-pop');
      setTimeout(() => {
        el.classList.remove('lesson-pop');
      }, 5000); 
    }
  }
}


// ============================================================================
// 9. ACCESSIBILITY (DROPDOWNS)
// ============================================================================

/**
 * Configures keyboard and click accessibility for the navigation dropdown menu.
 */
function setupAccessibleDropdown() {
  const dropdown = document.querySelector('.dropdown');
  const dropdownBtn = document.querySelector('.dropdown-btn');
  
  if (!dropdown || !dropdownBtn) return;

  // Apply aria attributes
  dropdownBtn.setAttribute('aria-haspopup', 'true');
  dropdownBtn.setAttribute('aria-expanded', 'false');
  dropdownBtn.setAttribute('aria-controls', 'dropdown-menu');

  const dropdownContent = document.querySelector('.dropdown-content');
  if (dropdownContent && !dropdownContent.id) {
    dropdownContent.id = 'dropdown-menu';
    dropdownContent.setAttribute('role', 'menu');
  }

  // Toggle function
  const toggleDropdown = (open) => {
    const isNowOpen = open !== undefined ? open : !dropdown.classList.contains('open');
    if (isNowOpen) {
      dropdown.classList.add('open');
      dropdownBtn.setAttribute('aria-expanded', 'true');
    } else {
      dropdown.classList.remove('open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  };

  // Click & Document Interaction Events
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', (e) => {
    if (dropdown.classList.contains('open') && !dropdown.contains(e.target)) {
      toggleDropdown(false);
    }
  });

  // Keyboard Events (Escape, Enter, Space)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('open')) {
      toggleDropdown(false);
      dropdownBtn.focus();
    }
  });

  dropdownBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    }
  });
}

// Immediately invoke accessibility setup
setupAccessibleDropdown();


// ============================================================================
// 10. INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  is_date_today_or_future();
  createSubmitSoonTopic();
  setupLessonExpand();
  setupTopicsNav();
  setupTopicsScrollSpy();
  setupLessonFolders();
  setupShareFooter();
  setupAssignments();
  
  // Handle hash navigation on page load with a slight delay for rendering
  setTimeout(() => {
    scrollToHashTarget();
  }, 100); 
});

// Update scroll target when URL hash changes
window.addEventListener('hashchange', scrollToHashTarget);