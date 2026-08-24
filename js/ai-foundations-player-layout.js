/* APEP Academy — AI Foundations Lessons 1–20 player layout.
   Loaded by the production lesson-progress module so every AI Foundations
   lesson receives the same three-column desktop learner experience. */

const STYLE_ID = 'apep-ai-foundations-player-layout';

if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    html, body {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow-x: hidden;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .dashboard-layout {
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .dashboard-main {
      min-width: 0;
      max-width: 100%;
      overflow-x: hidden;
    }

    /* Desktop/laptop: BOTH Academy and Course Outline sidebars remain visible. */
    .player-layout {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(250px, 300px) !important;
      gap: 24px !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      align-items: start;
    }

    .video-player {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
    }

    .video-player > * {
      max-width: 100%;
      min-width: 0;
    }

    .video-placeholder {
      max-width: 100%;
      min-width: 0;
    }

    .course-outline {
      display: block !important;
      visibility: visible !important;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      position: sticky;
      top: 24px;
      align-self: start;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      overflow-x: hidden;
    }

    .course-outline ul,
    .course-outline li,
    .course-outline a {
      min-width: 0;
      max-width: 100%;
    }

    .course-outline a {
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .lesson-content,
    .lesson-objectives,
    .lesson-takeaways,
    .prompt-practice,
    .lesson-summary,
    .lesson-quiz,
    .lesson-resources,
    .lesson-controls {
      min-width: 0;
      max-width: 100%;
    }

    @media (max-width: 1100px) and (min-width: 769px) {
      .dashboard-layout { grid-template-columns: 220px minmax(0, 1fr); }
      .dashboard-main { padding: 28px 20px; }
      .player-layout {
        grid-template-columns: minmax(0, 1fr) minmax(220px, 250px) !important;
        gap: 18px !important;
      }
      .course-outline { padding: 20px; }
      .video-placeholder { height: 360px; }
    }

    /* Only genuinely narrow/mobile screens stack the course outline below content. */
    @media (max-width: 768px) {
      .player-layout {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 18px !important;
      }
      .course-outline {
        position: static;
        max-height: none;
        overflow: visible;
      }
    }
  `;
  document.head.appendChild(style);
}
