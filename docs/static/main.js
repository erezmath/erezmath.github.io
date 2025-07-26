// Expand/collapse for lessons with chevron
function setupLessonExpand() {
    document.querySelectorAll('.accordion').forEach(accordion => {
      const lessons = Array.from(accordion.querySelectorAll('.lesson'));
      accordion.querySelectorAll('.lesson-header').forEach((header, idx) => {
        header.addEventListener('click', function() {
          // Determine columns: 2 on desktop, 1 on mobile
          const columns = window.matchMedia('(min-width: 700px)').matches ? 2 : 1;
          let rowStart;
          if (columns === 2) {
            rowStart = idx % 2 === 0 ? idx : idx - 1;
            [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
              if (lesson) lesson.classList.toggle('expanded');
            });
          } else {
            lessons[idx].classList.toggle('expanded');
          }
        });
        header.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            const columns = window.matchMedia('(min-width: 700px)').matches ? 2 : 1;
            let rowStart;
            if (columns === 2) {
              rowStart = idx % 2 === 0 ? idx : idx - 1;
              [lessons[rowStart], lessons[rowStart + 1]].forEach(lesson => {
                if (lesson) lesson.classList.toggle('expanded');
              });
            } else {
              lessons[idx].classList.toggle('expanded');
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
      // Always remove .active from all buttons first
      btns.forEach(b => b.classList.remove('active'));
      let found = false;
      for (let i = 0; i < sections.length; i++) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom > 120) {
          btns[i].classList.add('active');
          btns[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          found = true;
          break;
        }
      }
      // If no section is in view, no button is active
    }
    window.addEventListener('scroll', onScroll, { passive: true });
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
        window.scrollTo({
          top: rect.top + scrollTop - offset - 8, // -8 for extra gap
          behavior: 'smooth'
        });
        // Pop effect: add a class that mimics .lesson:hover
        el.classList.add('lesson-pop');
        setTimeout(() => {
          el.classList.remove('lesson-pop');
        }, 1200); // Duration in ms
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setupLessonExpand();
    setupTopicsNav();
    setupTopicsScrollSpy();
    setupLessonFolders();
    
    // Handle hash navigation on page load
    scrollToHashTarget();
  });

  // Handle hash changes (e.g., when user clicks a hash link)
  window.addEventListener('hashchange', scrollToHashTarget); 