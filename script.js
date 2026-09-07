import { APP_CONFIG } from './config/app-config.js';
import { SUPABASE_CONFIG } from './config/supabase-config.js';
import { BUSINESS_CONFIG } from './config/business-config.js';
import { RELEASE_CONFIG } from './config/release-config.js';
import { INTEGRATIONS_CONFIG } from './config/integrations-config.js';
import { validateConfig, publishValidationState } from './config/config-validator.js';
import { initializeNavigation, setCurrentYear } from './js/components.js';
import { initializeBusinessFoundation } from './js/modules/business-foundation.js';
import { initializeReleaseMetadata } from './js/modules/release-metadata.js';
import './js/supabase-auth.js';
import './js/ai-site-navigator.js';

function initializeApplication() {
  const valid = validateConfig({ APP_CONFIG, BUSINESS_CONFIG, RELEASE_CONFIG, INTEGRATIONS_CONFIG });
  publishValidationState(valid);
  if (!valid) {
    document.documentElement.dataset.initialization = 'failed';
    return;
  }
  initializeReleaseMetadata();
  initializeNavigation();
  initializeBusinessFoundation();
  setCurrentYear();
}

function initializePublicNavigationLinks() {
  const navigation = document.querySelector('.primary-nav');
  if (!navigation || navigation.closest('.dashboard-layout')) return;

  const destinations = {
    Home: '/index.html', About: '/pages/about.html', Courses: '/index.html#courses', Services: '/pages/services.html', Resources: '/pages/resources.html', Community: '/pages/community.html', Store: '/pages/store.html', Blog: '/pages/blog.html', Contact: '/pages/contact.html', Login: '/login.html', Register: '/auth/register.html', 'Get Started': '/index.html#pricing'
  };

  const links = navigation.querySelectorAll('a');
  links.forEach((link) => { const label = link.textContent.trim(); const destination = destinations[label]; if (destination) link.setAttribute('href', destination); });

  if (!navigation.querySelector('a[href="/auth/register.html"]')) {
    const getStarted = Array.from(links).find((link) => link.textContent.trim() === 'Get Started');
    const register = document.createElement('a'); register.className = 'nav-cta'; register.href = '/auth/register.html'; register.textContent = 'Register';
    if (getStarted) navigation.insertBefore(register, getStarted); else navigation.appendChild(register);
  }

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  const currentHash = window.location.hash;
  navigation.querySelectorAll('a').forEach((link) => {
    const label = link.textContent.trim(); const destination = destinations[label]; if (!destination) return;
    const destinationUrl = new URL(destination, window.location.origin); let isActive = destinationUrl.pathname === currentPath;
    if (destinationUrl.pathname === currentPath && destinationUrl.hash) isActive = destinationUrl.hash === currentHash;
    link.classList.toggle('active', isActive);
  });

  const homeLink = Array.from(navigation.querySelectorAll('a')).find((link) => link.textContent.trim() === 'Home');
  if (homeLink) homeLink.classList.toggle('active', (currentPath === '/index.html' || currentPath === '/') && !currentHash);

  if (!document.getElementById('public-nav-active-style')) {
    const style = document.createElement('style'); style.id = 'public-nav-active-style';
    style.textContent = `.primary-nav > a.active:not(.nav-cta){color:var(--blue)!important;position:relative}.primary-nav > a.active:not(.nav-cta)::after{content:"";position:absolute;left:0;right:0;bottom:-.55rem;height:3px;border-radius:999px;background:var(--blue)}.primary-nav > a.active.nav-cta{background:var(--blue)!important;color:#fff!important;box-shadow:0 8px 18px rgba(18,102,237,.25)}@media(max-width:900px){.primary-nav > a.active:not(.nav-cta)::after{bottom:0}}`;
    document.head.appendChild(style);
  }
}

function initializePublicFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer || document.querySelector('.dashboard-layout')) return;
  const currentYear = new Date().getFullYear();
  const isRoot = window.location.pathname === '/' || window.location.pathname === '/index.html';
  const base = isRoot ? '' : '../';
  footer.innerHTML = `<div class="container footer-top"><a class="brand brand-footer" href="${base}index.html" aria-label="AI Profit Advantage home"><span class="brand-mark" aria-hidden="true">AI</span><span class="brand-wordmark" aria-hidden="true">AI Profit Advantage</span></a><p>AI Profit Advantage Enterprise Platform (APEP) provides practical AI education, consulting, automation and digital growth guidance for learners, professionals, entrepreneurs and organizations.</p><nav aria-label="Footer navigation"><a href="${base}index.html#courses">Courses</a><a href="${base}pages/about.html">About</a><a href="${base}pages/resources.html">Resources</a><a href="${base}pages/community.html">Community</a><a href="${base}pages/store.html">Store</a><a href="${base}pages/blog.html">Blog</a><a href="${base}pages/contact.html">Contact</a><a href="${base}pages/privacy-policy.html">Privacy Policy</a><a href="${base}pages/terms.html">Terms of Use</a><a href="${base}pages/cookie-policy.html">Cookie Policy</a><a href="${base}pages/forum.html">Forum</a><a href="${base}pages/disclaimer.html">Disclaimer</a></nav></div><div class="container footer-bottom"><p>© <span id="current-year">${currentYear}</span> AI Profit Advantage Enterprise Platform (APEP). All rights reserved.</p><a href="${isRoot ? '#top' : base + 'index.html#top'}">Back to top ↑</a></div>`;
}

function initializeHomepageEnterpriseStyles() {
  const isRoot = window.location.pathname === '/' || window.location.pathname === '/index.html';
  if (!isRoot || document.getElementById('homepage-enterprise-styles')) return;
  const link = document.createElement('link');
  link.id = 'homepage-enterprise-styles';
  link.rel = 'stylesheet';
  link.href = '/css/homepage-enterprise.css';
  document.head.appendChild(link);
}

initializeHomepageEnterpriseStyles();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initializeApplication(); initializePublicNavigationLinks(); initializePublicFooter(); }, { once: true });
} else {
  initializeApplication(); initializePublicNavigationLinks(); initializePublicFooter();
}

/* APEP Learning Store enhancement: resilient product covers + complete product information. */
function initializeLearningStoreEnhancements() {
  const grid = document.getElementById('apep-products-grid');
  if (!grid) return;

  if (!document.getElementById('apep-learning-store-enhancement-styles')) {
    const style = document.createElement('style');
    style.id = 'apep-learning-store-enhancement-styles';
    style.textContent = `
      .apep-product-card{min-width:0}
      .apep-product-cover{display:block;background:#2B3A55}
      .apep-product-cover-fallback{position:relative;aspect-ratio:3/4;overflow:hidden;background:linear-gradient(135deg,#0A192F,#2B3A55);color:#fff;padding:34px 30px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between}
      .apep-product-cover-fallback::before{content:"";position:absolute;width:260px;height:260px;border:1px solid rgba(201,144,42,.25);border-radius:50%;right:-90px;top:-80px}
      .apep-product-cover-fallback::after{content:"";position:absolute;width:520px;height:2px;background:rgba(201,144,42,.22);transform:rotate(-34deg);right:-160px;bottom:250px}
      .apep-cover-brand{font-size:11px;letter-spacing:.18em;font-weight:800;color:#F4D58D;position:relative;z-index:1}
      .apep-cover-title{font-size:clamp(30px,4vw,48px);line-height:1.02;font-weight:800;max-width:85%;position:relative;z-index:1}
      .apep-cover-subtitle{font-size:20px;font-weight:700;color:#F4D58D;margin-top:10px;position:relative;z-index:1}
      .apep-cover-footer{font-size:12px;color:rgba(255,255,255,.72);position:relative;z-index:1}
      .apep-product-description-full{font-size:14px;color:#555;line-height:1.65;margin:0}
      .apep-product-includes{margin:2px 0 0;padding:14px 16px;border:1px solid #E8E8E8;border-radius:10px;background:#FAFAFA}
      .apep-product-includes strong{display:block;color:#2B3A55;margin-bottom:8px}
      .apep-product-includes ul{margin:0;padding-left:18px;color:#555;line-height:1.6}
      .apep-product-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}
      .apep-product-meta span{font-size:12px;font-weight:600;padding:6px 9px;border-radius:999px;background:#F4F0E6;color:#6D531F}
      .apep-product-note{font-size:12px;color:#777;margin:0}
      .apep-btn-paystack{min-height:46px}
    `;
    document.head.appendChild(style);
  }

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function addCoverFallback(card) {
    const image = card.querySelector('.apep-product-cover');
    if (!image || image.dataset.fallbackApplied === 'true') return;
    image.dataset.fallbackApplied = 'true';
    const title = image.alt || card.querySelector('.apep-product-title')?.textContent?.trim() || 'Digital Product';
    const fallback = document.createElement('div');
    fallback.className = 'apep-product-cover-fallback';
    const isPromptVault = /prompt vault/i.test(title);
    fallback.innerHTML = `
      <div class="apep-cover-brand">AI PROFIT ADVANTAGE</div>
      <div>
        <div class="apep-cover-title">${esc(isPromptVault ? 'AI Prompt Vault' : title)}</div>
        <div class="apep-cover-subtitle">${esc(isPromptVault ? 'for Freelancers' : 'Digital Learning Product')}</div>
      </div>
      <div class="apep-cover-footer">Practical AI • Strategic Growth • Lasting Advantage</div>
    `;
    image.replaceWith(fallback);
  }

  function enhanceCard(card, detail) {
    if (!card) return;

    const image = card.querySelector('.apep-product-cover');
    if (image) {
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => addCoverFallback(card), { once: true });
      if (image.complete && image.naturalWidth === 0) addCoverFallback(card);
    }

    if (!detail || card.dataset.apepDetailsEnhanced === 'true') return;
    card.dataset.apepDetailsEnhanced = 'true';
    const body = card.querySelector('.apep-product-body');
    const desc = card.querySelector('.apep-product-desc');
    if (!body) return;

    if (desc && detail.description) {
      desc.className = 'apep-product-description-full';
      desc.textContent = detail.description;
    }

    if (!body.querySelector('.apep-product-meta')) {
      const meta = document.createElement('div');
      meta.className = 'apep-product-meta';
      const tags = [];
      if (/\.pdf$/i.test(detail.file_path || '')) tags.push('PDF download');
      if (/prompt vault/i.test(detail.title || '')) tags.push('50 practical prompts');
      tags.push('Instant digital access');
      meta.innerHTML = tags.map((tag) => `<span>${esc(tag)}</span>`).join('');
      const price = body.querySelector('.apep-product-price');
      if (price) price.before(meta); else body.appendChild(meta);
    }

    if (/prompt vault/i.test(detail.title || '') && !body.querySelector('.apep-product-includes')) {
      const includes = document.createElement('div');
      includes.className = 'apep-product-includes';
      includes.innerHTML = `
        <strong>What’s inside</strong>
        <ul>
          <li>Client acquisition &amp; proposals</li>
          <li>Premium pricing &amp; positioning</li>
          <li>Client communication</li>
          <li>Service delivery</li>
          <li>Marketing &amp; visibility</li>
          <li>Fill-in-the-blank templates and customisation tips</li>
        </ul>
      `;
      const price = body.querySelector('.apep-product-price');
      if (price) price.before(includes); else body.appendChild(includes);
    }

    if (!body.querySelector('.apep-product-note')) {
      const note = document.createElement('p');
      note.className = 'apep-product-note';
      note.textContent = 'Secure payment • Your download becomes available after successful payment and entitlement confirmation.';
      body.querySelector('.apep-buy-row')?.before(note);
    }
  }

  async function loadProductDetails() {
    try {
      const params = new URLSearchParams({
        select: 'id,slug,title,description,short_description,file_path',
        is_published: 'eq.true',
        order: 'created_at.desc'
      });
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/digital_products?${params.toString()}`, {
        headers: { apikey: SUPABASE_CONFIG.publishableKey }
      });
      if (!response.ok) return new Map();
      const products = await response.json();
      return new Map((products || []).map((product) => [product.id, product]));
    } catch (error) {
      console.warn('APEP Learning Store detail enhancement unavailable', error);
      return new Map();
    }
  }

  const observer = new MutationObserver(() => {
    grid.querySelectorAll('.apep-product-card').forEach((card) => {
      const id = card.querySelector('.apep-buy-row')?.dataset.productId;
      if (id && window.__apepStoreProductDetails?.has(id)) {
        enhanceCard(card, window.__apepStoreProductDetails.get(id));
      } else if (!id) {
        const title = card.querySelector('.apep-product-title')?.textContent?.trim();
        const detail = [...(window.__apepStoreProductDetails?.values() || [])].find((item) => item.title === title);
        if (detail) enhanceCard(card, detail);
      }
      const image = card.querySelector('.apep-product-cover');
      if (image && image.complete && image.naturalWidth === 0) addCoverFallback(card);
    });
  });
  observer.observe(grid, { childList: true, subtree: true });

  loadProductDetails().then((details) => {
    window.__apepStoreProductDetails = details;
    grid.querySelectorAll('.apep-product-card').forEach((card) => {
      const id = card.querySelector('.apep-buy-row')?.dataset.productId;
      const detail = details.get(id) || [...details.values()].find((item) => item.title === card.querySelector('.apep-product-title')?.textContent?.trim());
      enhanceCard(card, detail);
      const image = card.querySelector('.apep-product-cover');
      if (image && image.complete && image.naturalWidth === 0) addCoverFallback(card);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLearningStoreEnhancements, { once: true });
} else {
  initializeLearningStoreEnhancements();
}
