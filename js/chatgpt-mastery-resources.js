import { getPremiumLesson } from './chatgpt-mastery-lessons.js';
import { APEP_BRAND } from './apep-branding.js';

export function resourceModes(lessonNumber) {
  const lesson = getPremiumLesson(lessonNumber);
  if (!lesson) return null;

  const branding = {
    organisation: APEP_BRAND.organisation,
    academy: APEP_BRAND.academy,
    logoAlt: APEP_BRAND.logoAlt,
    logoDataUri: APEP_BRAND.logoDataUri,
    course: 'AI & ChatGPT Mastery',
    footer: 'APEP Academy • AI Education & Business Automation',
    format: 'Student Resource • Study / Practise / Remember'
  };

  return {
    branding,
    lesson,
    notes: {
      title: `AI Profit Advantage Enterprise Platform (APEP) — AI & ChatGPT Mastery — Lesson ${lesson.n} Notes`,
      purpose: 'STUDY',
      sections: [
        { heading: 'Learning Objectives', items: lesson.o },
        { heading: 'Why This Lesson Matters', items: [lesson.why] },
        { heading: 'Core Concepts', items: lesson.s },
        { heading: 'Professional Application', items: [lesson.e, `Apply the APEP workflow: ${lesson.apEPWorkflow}`] },
        { heading: 'Common Mistakes to Avoid', items: lesson.mistakes },
        { heading: 'Knowledge Check', items: lesson.check },
        { heading: 'Reflection', items: [lesson.reflection] },
        { heading: 'APEP Quality Gate', items: lesson.qualityGate.map(item => `${item}: verify this dimension before using the output professionally.`) },
        { heading: 'Lesson Summary', items: [lesson.why, `The practical challenge is: ${lesson.e}`] },
        { heading: 'Next Lesson Connection', items: [lesson.next] }
      ]
    },
    worksheet: {
      title: `APEP Academy — AI Prompt Practice Worksheet — Lesson ${lesson.n}`,
      purpose: 'PRACTISE',
      sections: [
        { heading: 'Student Details', items: ['Student Name: ______________________________','Date: ____________________','Course: AI & ChatGPT Mastery',`Lesson: ${lesson.n} — ${lesson.t}`] },
        { heading: 'Concept Builder', items: lesson.o },
        { heading: 'Prompt Practice', items: [lesson.p] },
        { heading: 'Prompt Improvement', items: ['Rewrite your prompt using Context → Objective → Inputs → Instructions → Expected Output → Constraints.','Ask the AI to identify missing information before producing the final answer.','Compare the first response with the improved response and record one measurable improvement.'] },
        { heading: 'Knowledge Check', items: lesson.check.map((q,i) => `${i+1}. ${q}`) },
        { heading: 'Real-World Application', items: [lesson.e] },
        { heading: 'Entrepreneurial / Business Application', items: ['Identify one business task where this capability could improve speed, quality, consistency or decision support.','Define the human-review point that must remain in the workflow.','State the outcome you would measure to determine whether the workflow created value.'] },
        { heading: 'Reflection', items: [lesson.reflection, 'What did the AI do well?','What required your judgement?','What would you change before using the result professionally?'] },
        { heading: 'Lesson Completion Challenge', items: [lesson.e, `Explain how your solution follows the APEP workflow: ${lesson.apEPWorkflow}`] }
      ]
    },
    quick: {
      title: `APEP Academy — Lesson ${lesson.n} Quick Reference Guide`,
      purpose: 'REMEMBER',
      sections: [
        { heading: 'Lesson at a Glance', items: lesson.o },
        { heading: 'Core Concepts', items: lesson.s },
        { heading: 'Prompt / Practice Pattern', items: [lesson.p] },
        { heading: 'Common Pitfalls', items: lesson.mistakes },
        { heading: 'Quality Control', items: lesson.qualityGate.map(item => `${item}: check before delivery.`) },
        { heading: 'APEP Workflow', items: [lesson.apEPWorkflow] },
        { heading: 'Remember', items: [lesson.why] }
      ]
    }
  };
}
