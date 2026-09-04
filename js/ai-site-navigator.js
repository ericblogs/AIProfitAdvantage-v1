const NAVIGATOR_ROUTES = [
  { keywords: ['course', 'learn', 'training', 'lesson', 'study', 'academy'], label: 'Courses', href: '/index.html#courses', response: 'I can take you to the APEP course library so you can choose the right learning path.' },
  { keywords: ['service', 'consult', 'consulting', 'automation', 'business help'], label: 'Services', href: '/pages/services.html', response: 'Our Services area is the right place for AI consulting, automation and business solutions.' },
  { keywords: ['provider', 'electrician', 'plumber', 'repair', 'local service', 'hire'], label: 'Providers', href: '/pages/providers.html', response: 'The Providers directory is for finding available, verified service professionals.' },
  { keywords: ['resource', 'guide', 'ebook', 'template', 'download', 'free'], label: 'Resources', href: '/pages/resources.html', response: 'Resources is the best place to explore practical guides, tools and learning materials.' },
  { keywords: ['community', 'group', 'network', 'members'], label: 'Community', href: '/pages/community.html', response: 'Community is where you can connect with the wider APEP learning network.' },
  { keywords: ['store', 'buy', 'product', 'shop', 'payment'], label: 'Store', href: '/pages/store.html', response: 'The Store is the right destination for products and offers.' },
  { keywords: ['blog', 'article', 'news', 'post'], label: 'Blog', href: '/pages/blog.html', response: 'The Blog contains articles, insights and practical AI content.' },
  { keywords: ['contact', 'support', 'message', 'talk', 'reach'], label: 'Contact', href: '/pages/contact.html', response: 'Contact is the best place to reach the APEP team.' },
  { keywords: ['login', 'sign in', 'account', 'dashboard'], label: 'Login', href: '/auth/login.html', response: 'Login will take you to your APEP account.' },
  { keywords: ['register', 'sign up', 'join', 'create account', 'get started'], label: 'Register', href: '/auth/register.html', response: 'Register is the fastest way to create your APEP learner account.' },
  { keywords: ['about', 'who are you', 'company', 'founder'], label: 'About', href: '/pages/about.html', response: 'About explains who we are, what APEP does and the mission behind the platform.' }
];

const QUICK_ACTIONS = [
  ['🎓', 'Find a course', 'course'],
  ['💼', 'Explore services', 'services'],
  ['🛠️', 'Find a provider', 'provider'],
  ['🛒', 'Visit the store', 'store']
];

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s&-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findRoute(input) {
  const text = normalize(input);
  if (!text) return null;
  const ranked = NAVIGATOR_ROUTES.map((route) => ({
    route,
    score: route.keywords.reduce((score, keyword) => score + (text.includes(normalize(keyword)) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].route : null;
}

function createNavigator() {
  if (document.getElementById('apep-ai-navigator')) return;

  const root = document.createElement('aside');
  root.id = 'apep-ai-navigator';
  root.className = 'apep-navigator';
  root.setAttribute('aria-label', 'APEP AI Navigator');
  root.innerHTML = `
    <button class="apep-navigator-launcher" type="button" aria-expanded="false" aria-controls="apep-ai-navigator-panel" aria-label="Open APEP AI Navigator">
      <span aria-hidden="true">✦</span><span>Ask APEP</span>
    </button>
    <section class="apep-navigator-panel" id="apep-ai-navigator-panel" hidden>
      <header class="apep-navigator-header">
        <div><p class="apep-navigator-kicker">APEP AI NAVIGATOR</p><h2>Where would you like to go?</h2></div>
        <button class="apep-navigator-close" type="button" aria-label="Close APEP AI Navigator">×</button>
      </header>
      <div class="apep-navigator-messages" aria-live="polite">
        <div class="apep-navigator-message assistant">Hi! 👋 Tell me what you want to do on APEP, and I’ll point you to the right part of the website.</div>
      </div>
      <div class="apep-navigator-quick" aria-label="Quick destinations"></div>
      <form class="apep-navigator-form">
        <label class="sr-only" for="apep-navigator-input">What are you looking for?</label>
        <input id="apep-navigator-input" name="query" autocomplete="off" placeholder="e.g. I want to learn AI" />
        <button type="submit" aria-label="Find destination">→</button>
      </form>
      <p class="apep-navigator-note">Navigation assistant • no account required</p>
    </section>
  `;

  const style = document.createElement('style');
  style.id = 'apep-ai-navigator-style';
  style.textContent = `
    .apep-navigator{position:fixed;right:1.25rem;bottom:1.25rem;z-index:70;font-family:var(--sans,Arial,sans-serif)}
    .apep-navigator-launcher{display:inline-flex;align-items:center;gap:.55rem;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:.8rem 1.05rem;background:linear-gradient(135deg,var(--blue,#1266ed),#234a9a);color:#fff;box-shadow:0 16px 36px rgba(8,21,43,.28);font-weight:800;cursor:pointer}
    .apep-navigator-launcher:hover{transform:translateY(-2px)}
    .apep-navigator-panel{width:min(390px,calc(100vw - 2rem));margin-bottom:.75rem;background:#fff;border:1px solid var(--line,#dce5f4);border-radius:20px;box-shadow:0 24px 60px rgba(8,21,43,.22);overflow:hidden}
    .apep-navigator-header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1.1rem 1.15rem;background:var(--navy,#08152b);color:#fff}
    .apep-navigator-header h2{margin:0;font-size:1.05rem;line-height:1.25;letter-spacing:-.02em}
    .apep-navigator-kicker{margin:0 0 .3rem;color:var(--cyan,#63d5ff);font-size:.65rem;font-weight:900;letter-spacing:.12em}
    .apep-navigator-close{border:0;background:transparent;color:#fff;font-size:1.55rem;line-height:1;cursor:pointer;padding:.05rem .2rem}
    .apep-navigator-messages{display:grid;gap:.65rem;max-height:250px;overflow:auto;padding:1rem 1.05rem;background:#f7f9fd}
    .apep-navigator-message{max-width:88%;padding:.7rem .8rem;border-radius:13px;font-size:.84rem;line-height:1.5}
    .apep-navigator-message.assistant{background:#fff;border:1px solid var(--line,#dce5f4);color:var(--ink,#17233b)}
    .apep-navigator-message.user{justify-self:end;background:#e8f1ff;color:var(--ink,#17233b)}
    .apep-navigator-destination{display:inline-flex;justify-content:center;align-items:center;padding:.65rem .8rem;border-radius:10px;background:var(--blue,#1266ed);color:#fff;font-weight:800;font-size:.82rem}
    .apep-navigator-quick{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;padding:.8rem 1.05rem 0}
    .apep-navigator-quick-button{border:1px solid var(--line,#dce5f4);border-radius:10px;background:#fff;color:var(--ink,#17233b);padding:.6rem .65rem;text-align:left;font-size:.75rem;font-weight:700;cursor:pointer}
    .apep-navigator-quick-button:hover{border-color:var(--blue,#1266ed);color:var(--blue,#1266ed)}
    .apep-navigator-form{display:flex;gap:.45rem;padding:.8rem 1.05rem}
    .apep-navigator-form input{min-width:0;flex:1;border:1px solid var(--line,#dce5f4);border-radius:10px;padding:.7rem .75rem;background:#fff;color:var(--ink,#17233b);font:inherit;font-size:.82rem}
    .apep-navigator-form input:focus{outline:3px solid rgba(18,102,237,.18);border-color:var(--blue,#1266ed)}
    .apep-navigator-form>button{width:42px;border:0;border-radius:10px;background:var(--blue,#1266ed);color:#fff;font-size:1.2rem;font-weight:800;cursor:pointer}
    .apep-navigator-note{margin:0;padding:0 1.05rem .9rem;color:var(--muted,#61708a);font-size:.68rem;text-align:center}
    @media(max-width:760px){.apep-navigator{right:.75rem;bottom:.75rem}.apep-navigator-launcher{padding:.75rem .9rem}.apep-navigator-panel{width:min(390px,calc(100vw - 1.5rem))}}
    @media(prefers-reduced-motion:reduce){.apep-navigator-launcher{transition:none}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(root);

  const launcher = root.querySelector('.apep-navigator-launcher');
  const panel = root.querySelector('.apep-navigator-panel');
  const close = root.querySelector('.apep-navigator-close');
  const messages = root.querySelector('.apep-navigator-messages');
  const quick = root.querySelector('.apep-navigator-quick');
  const form = root.querySelector('.apep-navigator-form');
  const input = root.querySelector('#apep-navigator-input');

  QUICK_ACTIONS.forEach(([icon, label, query]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'apep-navigator-quick-button';
    button.innerHTML = `<span aria-hidden="true">${icon}</span> ${label}`;
    button.addEventListener('click', () => handleQuery(query));
    quick.appendChild(button);
  });

  function setOpen(open) {
    launcher.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open) window.setTimeout(() => input.focus(), 0);
  }

  function appendMessage(text, kind = 'assistant') {
    const message = document.createElement('div');
    message.className = `apep-navigator-message ${kind}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleQuery(query) {
    const route = findRoute(query);
    appendMessage(query, 'user');
    if (!route) {
      appendMessage('I can guide you to Courses, Services, Providers, Resources, Community, Store, Blog, Contact, About, Login or Register. What are you looking for?');
      return;
    }
    appendMessage(route.response);
    const action = document.createElement('a');
    action.className = 'apep-navigator-destination';
    action.href = route.href;
    action.textContent = `Go to ${route.label} →`;
    messages.appendChild(action);
    messages.scrollTop = messages.scrollHeight;
  }

  launcher.addEventListener('click', () => setOpen(launcher.getAttribute('aria-expanded') !== 'true'));
  close.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    handleQuery(value);
    input.value = '';
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && launcher.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createNavigator, { once: true });
} else {
  createNavigator();
}
