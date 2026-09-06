const root = document.querySelector('#forum-topic');
if (root) {
  const addReplyActions = () => {
    const topicId = new URLSearchParams(window.location.search).get('id');
    if (!topicId || !root.querySelector('.forum-posts')) return;
    if (!document.querySelector('#forum-topic-reply-cta')) {
      const cta = document.createElement('div');
      cta.id = 'forum-topic-reply-cta';
      cta.className = 'forum-reply-actions';
      cta.innerHTML = `<a class="button button-primary" href="forum-reply.html?id=${encodeURIComponent(topicId)}">↩️ Reply to this discussion</a>`;
      const share = root.querySelector('.forum-share');
      const posts = root.querySelector('.forum-posts');
      (share || posts)?.insertAdjacentElement('afterend', cta);
    }
    root.querySelectorAll('.forum-post').forEach((post) => {
      if (post.querySelector('.forum-post-reply')) return;
      const reactionBar = post.querySelector('.forum-reactions');
      const postId = reactionBar?.dataset.reactionPost;
      if (!postId) return;
      const action = document.createElement('div');
      action.className = 'forum-post-reply';
      action.innerHTML = `<a class="button button-secondary" href="forum-reply.html?id=${encodeURIComponent(topicId)}&parent=${encodeURIComponent(postId)}">↩️ Reply to this post</a>`;
      (reactionBar || post.lastElementChild)?.insertAdjacentElement('afterend', action);
    });
  };
  new MutationObserver(addReplyActions).observe(root, { childList: true, subtree: true });
  addReplyActions();
}
