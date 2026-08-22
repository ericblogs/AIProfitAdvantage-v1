/**
 * APEP Academy data integration.
 * Uses the existing browser Supabase configuration and never handles passwords.
 * Course-specific players may provide their own entry route.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const DASHBOARD_BASE = new URL('/dashboard/', window.location.origin);
const COURSE_LIBRARY_URL = new URL('courses.html', DASHBOARD_BASE).href;
const CHATGPT_MASTERY_URL = new URL('chatgpt-mastery.html?lesson=1', DASHBOARD_BASE).href;

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
  if (course.slug === 'chatgpt-mastery') return CHATGPT_MASTERY_URL;
  return null;
}

async function loadDashboard(user) {
  await ensureProfile(user);
  const { data: enrollments = [] } = await supabase.from('enrollments').select('id,status,course_id,courses(id,title,slug)').eq('user_id', user.id).neq('status', 'cancelled');
  const { data: progress = [] } = await supabase.from('lesson_progress').select('lesson_id,progress_percent,completed').eq('user_id', user.id);
  const courseCount = enrollments.length;
  const avg = progress.length ? Math.round(progress.reduce((sum, p) => sum + Number(p.progress_percent || 0), 0) / progress.length) : 0;
  const cards = document.querySelectorAll('.dashboard-card strong');
  if (cards[0]) cards[0].textContent = String(courseCount).padStart(2, '0');
  if (cards[1]) cards[1].textContent = `${avg}%`;
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
      action.textContent = entry ? 'Continue Learning →' : lessonNumber ? 'Continue Learning →' : 'View Course Library →';
      action.href = entry || (lessonNumber ? new URL(`lesson-${lessonNumber}.html`, DASHBOARD_BASE).href : COURSE_LIBRARY_URL);
    }
  }
}

async function loadCourses(user) {
  const { data: courses = [], error: coursesError } = await supabase.from('courses').select('id,slug,title,description,level,duration_hours,lesson_count,image_path,is_published').eq('is_published', true).order('created_at');
  if (coursesError) throw coursesError;
  const { data: enrollments = [], error: enrollmentsError } = await supabase.from('enrollments').select('course_id,status').eq('user_id', user.id).neq('status', 'cancelled');
  if (enrollmentsError) throw enrollmentsError;
  const enrolled = new Set(enrollments.map(e => e.course_id));
  const grid = document.querySelector('.courses-grid');
  if (!grid || !courses.length) return;

  grid.innerHTML = courses.map(c => `
    <article class="course-card" data-course-id="${c.id}" data-course-slug="${escapeHtml(c.slug)}">
      ${c.image_path ? `<img src="../${c.image_path.replace(/^\.\//, '')}" class="course-image" alt="${escapeHtml(c.title)}">` : ''}
      <div class="course-badge ${escapeHtml(c.level)}">${escapeHtml(c.level)}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description || '')}</p>
      <div class="course-meta"><span>⏱ ${c.duration_hours ?? '—'} Hours</span><span>📖 ${c.lesson_count} Lessons</span></div>
      <div class="course-progress"><div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div><span>0% Complete</span></div>
      <button class="btn academy-course-action" data-course-id="${c.id}" data-course-slug="${escapeHtml(c.slug)}">${enrolled.has(c.id) ? 'Continue Learning →' : 'Enroll & Start Learning →'}</button>
    </article>`).join('');

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
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Opening course…';

  try {
    const { data: existing, error: existingError } = await supabase.from('enrollments').select('id,status').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (existingError) throw existingError;

    if (!existing) {
      const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
      if (error) throw error;
    } else if (existing.status === 'cancelled') {
      const { error } = await supabase.from('enrollments').update({ status: 'active' }).eq('id', existing.id).eq('user_id', user.id);
      if (error) throw error;
    }

    if (courseSlug === 'chatgpt-mastery') {
      // Course 2 has a dedicated player. Never use the generic lesson-1.html
      // route, which belongs to AI Foundations.
      window.location.assign(CHATGPT_MASTERY_URL);
      return;
    }

    const lessonNumber = await firstPublishedLesson(courseId);
    if (!lessonNumber) {
      button.disabled = false;
      button.textContent = 'Enrolled ✓ — Course content coming soon';
      return;
    }

    button.textContent = `Opening Lesson ${lessonNumber}…`;
    window.location.assign(new URL(`lesson-${lessonNumber}.html`, DASHBOARD_BASE).href);
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
  const coursesGrid = document.querySelector('.courses-grid');
  const dashboardPanel = document.querySelector('.dashboard-panel');
  if (coursesGrid) await loadCourses(user);
  if (dashboardPanel) await loadDashboard(user);
}

init().catch(error => console.error('APEP Academy integration error:', error));
