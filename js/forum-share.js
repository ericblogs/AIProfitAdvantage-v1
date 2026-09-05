const SHARE_NETWORKS = Object.freeze([
  ['facebook', 'Facebook', 'f'],
  ['x', 'X', '𝕏'],
  ['linkedin', 'LinkedIn', 'in'],
  ['whatsapp', 'WhatsApp', 'WA'],
  ['telegram', 'Telegram', '↗']
]);

const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[char]));

export function updateSocialMeta({ title = '', description = '', url = window.location.href } = {}) {
  const cleanTitle = String(title).trim() || 'APEP Community Discussion';
  const cleanDescription = String(description).replace(/\s+/g, ' ').trim().slice(0, 240) || 'Join the conversation in the APEP Community.';
  const ensureMeta = (selector, attribute, value) => {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attribute, selector.includes('property=') ? selector.match(/property=\"([^\"]+)\"/)?.[1] || '' : selector.match(/name=\"([^\"]+)\"/)?.[1] || '');
      document.head.appendChild(node);
    }
    node.setAttribute('content', value);
  };
  ensureMeta('meta[name=\"description\"]', 'name', cleanDescription);
  ensureMeta('meta[property=\"og:title\"]', 'property', cleanTitle);
  ensureMeta('meta[property=\"og:description\"]', 'property', cleanDescription);
  ensureMeta('meta[property=\"og:type\"]', 'property', 'article');
  ensureMeta('meta[property=\"og:url\"]', 'property', url);
  ensureMeta('meta[property=\"og:site_name\"]', 'property', 'APEP Community');
  ensureMeta('meta[name=\"twitter:card\"]', 'name', 'summary');
  ensureMeta('meta[name=\"twitter:title\"]', 'name', cleanTitle);
  ensureMeta('meta[name=\"twitter:description\"]', 'name', cleanDescription);
  let canonical = document.head.querySelector('link[rel=\"canonical\"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = url;
}

export function renderShareBar({ title = '', url = window.location.href } = {}) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const links = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  };
  return `<section class="forum-share" aria-labelledby="forum-share-title"><div class="forum-share-heading"><strong id="forum-share-title">Share this discussion</strong><span>Help someone in your network discover it.</span></div><div class="forum-share-actions">${SHARE_NETWORKS.map(([key, label, mark]) => `<a class="forum-share-button forum-share-${key}" href="${links[key]}" target="_blank" rel="noopener noreferrer" aria-label="Share on ${label}" data-share-network="${key}"><span aria-hidden="true">${mark}</span><span>${label}</span></a>`).join('')}<button class="forum-share-button forum-share-native" type="button" data-share-native><span aria-hidden="true">↗</span><span>Share</span></button><button class="forum-share-button forum-share-copy" type="button" data-share-copy><span aria-hidden="true">🔗</span><span>Copy link</span></button></div><p class="forum-share-status" data-share-status role="status" aria-live="polite"></p></section>`;
}

export function bindShareBar(root, { title = '', url = window.location.href } = {}) {
  if (!root) return;
  const nativeButton = root.querySelector('[data-share-native]');
  const status = root.querySelector('[data-share-status]');

  // Web Share is an optional browser capability. Unsupported browsers should
  // not expose a dead control or display an error after a user clicks it.
  if (nativeButton && typeof navigator.share !== 'function') {
    nativeButton.hidden = true;
  }

  root.addEventListener('click', async (event) => {
    const clickedNativeButton = event.target.closest('[data-share-native]');
    const copyButton = event.target.closest('[data-share-copy]');
    if (!clickedNativeButton && !copyButton) return;

    if (clickedNativeButton && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url });
        if (status) status.textContent = 'Shared successfully.';
      } catch (error) {
        if (error?.name !== 'AbortError' && status) status.textContent = 'Sharing is currently unavailable.';
      }
      return;
    }

    if (copyButton) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          const fallback = document.createElement('textarea');
          fallback.value = url;
          fallback.setAttribute('readonly', '');
          fallback.style.position = 'fixed';
          fallback.style.opacity = '0';
          document.body.appendChild(fallback);
          fallback.select();
          document.execCommand('copy');
          fallback.remove();
        }
        if (status) status.textContent = 'Discussion link copied to your clipboard.';
      } catch {
        if (status) status.textContent = 'Could not copy automatically. Please copy the page address from your browser.';
      }
    }
  });
}
