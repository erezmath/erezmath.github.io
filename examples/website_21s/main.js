// Expand/collapse for lessons with chevron
function setupLessonExpand() {
  document.querySelectorAll('.lesson-header').forEach(header => {
    header.addEventListener('click', function() {
      const lesson = this.closest('.lesson');
      lesson.classList.toggle('expanded');
    });
    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const lesson = this.closest('.lesson');
        lesson.classList.toggle('expanded');
        e.preventDefault();
      }
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
      btns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      // Scroll to the section
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
    let found = false;
    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom > 120) {
        btns.forEach(b => b.classList.remove('active'));
        btns[i].classList.add('active');
        found = true;
        break;
      }
    }
    if (!found) {
      btns.forEach(b => b.classList.remove('active'));
    }
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

document.addEventListener('DOMContentLoaded', function() {
  setupLessonExpand();
  setupTopicsNav();
  setupTopicsScrollSpy();
}); 