import { renderGovernanceEngagement, bindGovernanceEngagement } from './forum-voting.js';

const root = document.querySelector('#forum-topic');
const topicId = new URLSearchParams(window.location.search).get('id');
if (root && topicId) {
  const observer = new MutationObserver(async () => {
    if (root.dataset.governanceMounted === 'true' || !root.querySelector('.forum-posts')) return;
    root.dataset.governanceMounted = 'true';
    try {
      const panel = document.createElement('div');
      panel.className = 'forum-governance-engagement';
      panel.innerHTML = await renderGovernanceEngagement(topicId);
      root.appendChild(panel);
      bindGovernanceEngagement(root);
    } catch (error) {
      console.warn('Forum governance engagement unavailable:', error);
      root.dataset.governanceMounted = 'false';
    }
  });
  observer.observe(root, { childList: true, subtree: true });
}
