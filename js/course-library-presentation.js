/**
 * APEP Course Library presentation layer.
 * Controls only the learner-facing course order, level labels, and CTA colors.
 * Does not modify course data, enrollment logic, authentication, RLS, or payments.
 */

const COURSE_LIBRARY_ORDER = [
  'ai-foundations',
  'prompt-engineering',
  'chatgpt-mastery',
  'ai-automation',
  'business-enterprise'
];

const COURSE_PRESENTATION = {
  'ai-foundations': {
    level: 'BEGINNER',
    color: '#6B7280',
    hover: '#4B5563'
  },
  'prompt-engineering': {
    level: 'INTERMEDIATE',
    color: '#2563EB',
    hover: '#1D4ED8'
  },
  'chatgpt-mastery': {
    level: 'ADVANCED',
    color: '#0B1F3A',
    hover: '#07152A'
  },
  'ai-automation': {
    level: 'EXPERT',
    color: '#16A34A',
    hover: '#15803D'
  },
  'business-enterprise': {
    level: 'PROFESSIONAL',
    color: '#C9A227',
    hover: '#A88418'
  }
};

function applyCoursePresentation() {
  const grid = document.querySelector('.courses-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.course-card'));
  if (!cards.length) return;

  cards.sort((a, b) => {
    const aIndex = COURSE_LIBRARY_ORDER.indexOf(a.dataset.courseSlug);
    const bIndex = COURSE_LIBRARY_ORDER.indexOf(b.dataset.courseSlug);
    return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
           (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
  });

  cards.forEach(card => {
    const slug = card.dataset.courseSlug;
    const presentation = COURSE_PRESENTATION[slug];
    if (!presentation) return;

    grid.appendChild(card);

    const badge = card.querySelector('.course-badge');
    if (badge) {
      badge.textContent = presentation.level;
      badge.className = 'course-badge';
      badge.style.background = presentation.color;
      badge.style.color = '#fff';
    }

    const button = card.querySelector('.btn, .academy-course-action');
    if (button) {
      button.style.background = presentation.color;
      button.style.color = '#fff';
      button.style.borderColor = presentation.color;
      button.dataset.courseLevel = presentation.level;

      button.addEventListener('mouseenter', () => {
        button.style.background = presentation.hover;
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = presentation.color;
      });
    }
  });
}

const observer = new MutationObserver(applyCoursePresentation);

function initCourseLibraryPresentation() {
  const grid = document.querySelector('.courses-grid');
  if (!grid) return;
  observer.observe(grid, { childList: true, subtree: true });
  applyCoursePresentation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCourseLibraryPresentation, { once: true });
} else {
  initCourseLibraryPresentation();
}
