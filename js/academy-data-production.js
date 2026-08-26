/**
 * APEP Academy data integration.
 * Uses the existing browser Supabase configuration and never handles passwords.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const DASHBOARD_BASE = new URL('/dashboard/', window.location.origin);
const COURSE_LIBRARY_URL = new URL('courses.html', DASHBOARD_BASE).href;
const COURSE_ROUTES = {
  'ai-foundations': 'lesson-1.html',
  'prompt-engineering': 'prompt-engineering.html?lesson=1',
  'chatgpt-mastery': 'chatgpt-mastery.html?lesson=1&enroll=1',
  'ai-automation': 'ai-automation.html?lesson=1',
  'business-enterprise': 'business-enterprise.html?lesson=1',
  'ai-agents-intelligent-automation': 'ai-agents-academy.html?lesson=1',
  'data-analytics-generative-ai': 'data-analytics-generative-ai.html?lesson=1',
  'ai-powered-digital-marketing-growth': 'ai-powered-digital-marketing-growth.html?lesson=1'
};
const COURSE_ORDER = [
  'ai-foundations', 'prompt-engineering', 'chatgpt-mastery', 'ai-automation',
  'business-enterprise', 'ai-agents-intelligent-automation',
  'data-analytics-generative-ai', 'ai-powered-digital-marketing-growth'
];
const VERIFY_PAYSTACK_URL = `${SUPABASE_CONFIG.url}/functions/v1/verify-paystack-payment`;
const INITIALIZE_PAYSTACK_URL = `${SUPABASE_CONFIG.url}/functions/v1/initialize-paystack-payment`;
const CHATGPT_MASTERY_ID = '5135ced7-c80f-4224-898d-7771b96761df';

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}

async function ensureProfile(user) {
  if (!user) return null;
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || user.email?.split('@')[0] || null;
  const { data } = await supabase.from('student_profiles').upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' }).select().single();
  return data || null;
}

async function firstPublishedLesson(courseId) {
  const { data: lesson, error } = await supabase.from('lessons').select('lesson_number').eq('course_id', courseId).eq('is_published', true).order('lesson_number', { ascending: true }).limit(1).maybeSingle();
  if (error || !lesson) return null;
  return lesson.lesson_number;
}

function courseEntry(course) {
  const route = COURSE_ROUTES[course.slug];
  return route ? new URL(route, DASHBOARD_BASE).href : null;
}

async function hasActiveEntitlement(userId, courseId) {
  const { data, error } = await supabase.from('course_entitlements').select('id,status').eq('user_id', userId).eq('course_id', courseId).eq('status', 'active').maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function initializePaystackPayment(courseId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');
  const response = await fetch(INITIALIZE_PAYSTACK_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_CONFIG.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.authorization_url) throw new Error(payload.error || 'Unable to initialize Paystack checkout.');
  window.location.assign(payload.authorization_url);
}

async function verifyPaystackReturn(user) {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference');
  const paymentState = params.get('paystack');
  const courseId = params.get('course_id');
  if (paymentState !== 'success' || !reference || courseId !== CHATGPT_MASTERY_ID) return false;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');
  const response = await fetch(VERIFY_PAYSTACK_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_CONFIG.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, course_id: courseId })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error || 'Paystack payment verification failed.');
  window.history.replaceState({}, document.title, COURSE_LIBRARY_URL);
  window.location.assign(courseEntry({ slug: 'chatgpt-mastery' }));
  return true;
}

async function loadDashboard(user) {
  await ensureProfile(user);
  const { data: enrollments = [] } = await supabase.from('enrollments').select('id,status,course_id,courses(id,title,slug)').eq('user_id', user.id).neq('status', 'cancelled');
  const { data: progress = [] } = await supabase.from('lesson_progress').select('lesson_id,progress_percent,completed').eq('user_id', user.id);
  const cards = document.querySelectorAll('.dashboard-card strong');
  if (cards[0]) cards[0].textContent = String(enrollments.length).padStart(2, '0');
  if (cards[1]) cards[1].textContent = `${progress.length ? Math.round(progress.reduce((sum, p) => sum + Number(p.progress_percent || 0), 0) / progress.length) : 0}%`;
  if (cards[2]) cards[2].textContent = String(progress.filter(p => p.completed).length).padStart(2, '0');
  const firstCourse = enrollments[0]?.courses;
  const continuePanel = document.querySelector('.dashboard-panel');
  if (firstCourse && continuePanel) {
    const title = continuePanel.querySelector('h3');
    if (title) title.textContent = firstCourse.title;
    const action = continuePanel.querySelector('a.button');
    if (action) {
      const entry = courseEntry(firstCourse);
      const lessonNumber = entry ? null : await firstPublishedLesson(firstCourse.id);
      action.textContent = entry || lessonNumber ? 'Continue Learning →' : 'View Course Library →';
      action.href = entry || (lessonNumber ? new URL(`lesson-${lessonNumber}.html`, DASHBOARD_BASE).href : COURSE_LIBRARY_URL);
    }
  }
}

async function loadCourses(user) {
  const { data: courses = [], error: coursesError } = await supabase
    .from('courses')
    .select('id,slug,title,description,level,duration_hours,lesson_count,image_path,is_published')
    .eq('is_published', true);
  if (coursesError) throw coursesError;

  const { data: enrollments = [], error: enrollmentsError } = await supabase
    .from('enrollments').select('course_id,status').eq('user_id', user.id).neq('status', 'cancelled');
  if (enrollmentsError) throw enrollmentsError;

  const { data: prices = [] } = await supabase
    .from('course_prices').select('course_id,amount,currency,is_active').eq('is_active', true);
  const priceByCourse = new Map(prices.map(p => [p.course_id, p]));
  const enrolled = new Set(enrollments.map(e => e.course_id));
  const order = new Map(COURSE_ORDER.map((slug, index) => [slug, index]));
  const orderedCourses = courses.slice().sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
  const grid = document.querySelector('.courses-grid');
  if (!grid) return;

  grid.innerHTML = orderedCourses.map((c, index) => {
    const price = priceByCourse.get(c.id);
    const route = courseEntry(c);
    const lessonLabel = c.slug === 'ai-foundations' ? '<strong>FREE</strong> · ' : '';
    const priceMarkup = price ? `<br><strong>₦${Number(price.amount).toLocaleString('en-NG')} ${escapeHtml(price.currency)}</strong>` : '';
    const actionLabel = enrolled.has(c.id) ? 'Continue Learning →' : (c.slug === 'chatgpt-mastery' ? 'Enroll & Start Learning →' : 'Open Course Player →');
    return `<article class="course-card" data-course-id="${c.id}" data-course-slug="${escapeHtml(c.slug)}">
      <small>${String(index + 1).padStart(2, '0')}</small>
      ${c.image_path ? `<img src="../${c.image_path.replace(/^\.\//, '')}" class="course-image" alt="${escapeHtml(c.title)}">` : ''}
      <span class="course-badge">${escapeHtml(String(c.level || '').toUpperCase())}</span>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description || '')}</p>
      <div>${lessonLabel}📖 ${c.lesson_count} Lessons${priceMarkup}</div>
      <button class="btn academy-course-action" data-course-id="${c.id}" data-course-slug="${escapeHtml(c.slug)}" data-course-route="${escapeHtml(route || '')}">${actionLabel}</button>
    </article>`;
  }).join('');

  grid.querySelectorAll('.academy-course-action').forEach(btn => btn.addEventListener('click', () => enrollOrContinue(btn, user)));

  const requestedSlug = new URLSearchParams(window.location.search).get('course');
  if (requestedSlug) {
    const requested = Array.from(grid.querySelectorAll('.course-card')).find(card => card.dataset.courseSlug === requestedSlug);
    requested?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requested?.querySelector('.academy-course-action')?.focus();
  }
}

async function enrollOrContinue(button, user) {
  const courseId = button.dataset.courseId;
  const courseSlug = button.dataset.courseSlug;
  const route = button.dataset.courseRoute;
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Opening course…';
  try {
    if (courseSlug === 'chatgpt-mastery' || courseId === CHATGPT_MASTERY_ID) {
      if (await hasActiveEntitlement(user.id, courseId)) { window.location.assign(route); return; }
      button.textContent = 'Opening secure checkout…';
      await initializePaystackPayment(courseId);
      return;
    }

    const { data: existing, error: existingError } = await supabase.from('enrollments').select('id,status').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
      if (error) throw error;
    } else if (existing.status === 'cancelled') {
      const { error } = await supabase.from('enrollments').update({ status: 'active' }).eq('id', existing.id).eq('user_id', user.id);
      if (error) throw error;
    }

    const lessonNumber = route ? null : await firstPublishedLesson(courseId);
    if (!route && !lessonNumber) throw new Error('This course has no published starting lesson.');
    window.location.assign(route || new URL(`lesson-${lessonNumber}.html`, DASHBOARD_BASE).href);
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    console.error('APEP course launch error:', error);
    alert(error?.message || 'We could not open this course. Please try again.');
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

async function init() {
  const user = await currentUser();
  if (!user) return;
  const verifiedReturn = await verifyPaystackReturn(user);
  if (verifiedReturn) return;
  if (document.querySelector('.courses-grid')) await loadCourses(user);
  if (document.querySelector('.dashboard-panel')) await loadDashboard(user);
}

init().catch(error => console.error('APEP Academy integration error:', error));
