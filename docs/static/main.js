// --- Create submit soon topic (feature flag and lesson id list) ---
const globalCreateSubmitSoonTopic = true;
let globalSubmitSoonLessons = [];
let globalSubmitSoonLessonDueTimes = {};

const SUBMIT_SOON_TOPIC_ID = '0-הגשה-בקרוב';
const SUBMIT_SOON_TOPIC_TITLE = '0. להגשה בקרוב';
const SUBMIT_SOON_ID_SUFFIX = '-submit-soon';

function createSubmitSoonTopic() {
  if (!globalCreateSubmitSoonTopic || !globalSubmitSoonLessons.length) return;
  const topicsList = document.querySelector('.topics-list');
  const topicsNav = document.querySelector('.topics-nav');
  if (!topicsList || !topicsNav) return;

  // Sort by due date ascending (earliest due first). Missing/invalid dates go last.
  const submitSoonLessonsSorted = globalSubmitSoonLessons
    .slice()
    .sort((a, b) => {
      const ta = Number.isFinite(globalSubmitSoonLessonDueTimes[a]) ? globalSubmitSoonLessonDueTimes[a] : Number.POSITIVE_INFINITY;
      const tb = Number.isFinite(globalSubmitSoonLessonDueTimes[b]) ? globalSubmitSoonLessonDueTimes[b] : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return String(a).localeCompare(String(b), 'he');
    });

  const section = document.createElement('section');
  section.className = 'topic-section';
  section.id = SUBMIT_SOON_TOPIC_ID;
  const h2 = document.createElement('h2');
  h2.textContent = SUBMIT_SOON_TOPIC_TITLE;
  section.appendChild(h2);
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  section.appendChild(accordion);

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

  const navBtn = document.createElement('button');
  navBtn.className = 'topic-btn';
  navBtn.setAttribute('onclick', "scrollToTopic('" + SUBMIT_SOON_TOPIC_ID + "')");
  navBtn.textContent = SUBMIT_SOON_TOPIC_TITLE;
  topicsNav.querySelectorAll('.topic-btn').forEach(btn => btn.classList.remove('active'));
  topicsNav.insertBefore(navBtn, topicsNav.firstChild);
}

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
          const clickedLesson = lessons[idx];
          const isRowExpanded = targetLesson.classList.contains('expanded');
          const clickedLessonInExpandedRow = isRowExpanded && (clickedLesson === lessons[rowStart] || clickedLesson === lessons[rowStart + 1]);
          
          if (clickedLessonInExpandedRow) {
            // Row is expanded and user clicked one of the two lessons in it - collapse (same as mobile)
            allLessons.forEach(lesson => lesson.classList.remove('expanded'));
            if (window.location.hash) history.replaceState(null, '', window.location.pathname);
          } else {
            // Expand this row
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
      });
      header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const allLessons = Array.from(document.querySelectorAll('.lesson'));
          const columns = window.matchMedia('(min-width: 700px)').matches ? 2 : 1;
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

  function onScroll() {
    const refY = 150; // Reference line from viewport top (below sticky header)
    btns.forEach(b => b.classList.remove('active'));

    // Use the section that *contains* the reference line (refY). That way only one section
    // can be active at a time, so two topics with similar names (e.g. "6. חדוא" and "6. חדוא - אינטגרלים")
    // don't cause flicker when scrolling between them.
    let activeIndex = -1;
    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= refY && rect.bottom > refY) {
        activeIndex = i;
        break;
      }
    }
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
    if (activeIndex >= 0) {
      const activeBtn = btns[activeIndex];
      activeBtn.classList.add('active');
      // Keep active button in view: check this button's visibility in the nav (works for RTL and when first/last both visible)
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

// Share footer: copy link and WhatsApp
function getBaseUrl() {
  return window.location.origin + window.location.pathname;
}

function copyLink(buttonElement, lessonId) {
  const linkToCopy = getBaseUrl() + '#' + lessonId;
  navigator.clipboard.writeText(linkToCopy).then(() => {
    buttonElement.classList.add('show-tooltip');
    setTimeout(() => buttonElement.classList.remove('show-tooltip'), 2000);
  }).catch(() => {
    alert('לא הצלחנו להעתיק את הקישור');
  });
}

function shareWhatsApp(lessonId, lessonTitle) {
  const linkToShare = getBaseUrl() + '#' + lessonId;
  const message = 'בדוק את השיעור הזה ממתמטיקה: ' + lessonTitle + '\n\n' + linkToShare;
  window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
}

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
      if (lessonId) shareWhatsApp(lessonId, lessonTitle);
    }
  });
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
      el.classList.add('expanded');
      el.classList.add('lesson-pop');
      setTimeout(() => {
        el.classList.remove('lesson-pop');
      }, 5000); // Duration in ms for the pop effect, remember that it takes time to reach the target
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  is_date_today_or_future();
  createSubmitSoonTopic();
  setupLessonExpand();
  setupTopicsNav();
  setupTopicsScrollSpy();
  setupLessonFolders();
  setupShareFooter();
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
//When globalCreateSubmitSoonTopic is true, fills globalSubmitSoonLessons with lesson ids for today or future
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
  
  // Get all lesson-due-date elements (each is a descendant of a .lesson)
  const dueDivs = document.querySelectorAll('.lesson-due-date');
  
  dueDivs.forEach(div => {
    // Extract date using regex pattern dd.mm.yyyy
    const text = div.textContent;
    const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    
    if (!dateMatch) return;
    
    // Parse the extracted date
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(dateMatch[3], 10);
    
    // Validate date
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
        div.classList.add('color-alert');
      } else {
        div.classList.add('color-warning');
      }
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