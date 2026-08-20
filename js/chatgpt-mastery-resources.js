import { CHATGPT_MASTERY_LESSONS } from './chatgpt-mastery-lessons.js';

export function resourceModes(lessonNumber) {
  const lesson = CHATGPT_MASTERY_LESSONS.find(item => item.n === lessonNumber);
  if (!lesson) return null;

  return {
    lesson,
    notes: {
      title: `AI & ChatGPT Mastery — Lesson ${lesson.n} Notes`,
      purpose: 'STUDY',
      sections: [
        { heading: 'Learning Objectives', items: lesson.o },
        { heading: 'Core Concepts', items: lesson.s },
        { heading: 'Professional Study Questions', items: [
          'What is the central capability being developed in this lesson?',
          'What could go wrong if this capability is used without verification or human judgement?',
          'Where could this capability create measurable value in a real workflow?'
        ] },
        { heading: 'APEP Quality Principle', items: [
          'Define the problem before selecting an AI approach.',
          'Provide relevant context and explicit requirements.',
          'Evaluate outputs before using them professionally.'
        ] }
      ]
    },
    worksheet: {
      title: `AI Prompt Practice Worksheet — Lesson ${lesson.n}`,
      purpose: 'PRACTISE',
      sections: [
        { heading: 'Prompt Practice', items: [lesson.p] },
        { heading: 'Prompt Improvement', items: [
          'Rewrite the prompt with clearer context, objective, inputs, output requirements and constraints.',
          'Ask the model what information is missing before producing the final answer.'
        ] },
        { heading: 'Real-World Application', items: [lesson.e] },
        { heading: 'Entrepreneurial / Business Application', items: [
          'Identify one business task where this capability could improve speed, quality, consistency or decision support.',
          'Define the human-review point that must remain in the workflow.'
        ] },
        { heading: 'Reflection', items: [
          'What did the AI do well?',
          'What required your judgement?',
          'What would you change before using the result professionally?'
        ] }
      ]
    },
    quick: {
      title: `Lesson ${lesson.n} Quick Reference Guide`,
      purpose: 'REMEMBER',
      sections: [
        { heading: 'Remember', items: lesson.s },
        { heading: 'Apply', items: [lesson.p] },
        { heading: 'Quality Control', items: [
          'Accuracy: verify important claims.',
          'Relevance: keep the response aligned with the actual objective.',
          'Completeness: check whether required elements are present.',
          'Human oversight: retain accountability for consequential outputs.'
        ] }
      ]
    }
  };
}
