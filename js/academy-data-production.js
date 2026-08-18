/**
 * APEP Academy data integration.
 * Uses the existing browser Supabase configuration and never handles passwords.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}

async function ensureProfile(user) {
  if (!user) return null;
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null;
  const { data } = await supabase.from('student_profiles').upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' }).select().single();
  return data || null;
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
  }
}

async function loadCourses(user) {
  const { data: courses = [] } = await supabase.from('courses').select('id,slug,title,description,level,duration_hours,lesson_count,image_path,is_published').eq('is_published', true).order('created_at');
  const { data: enrollments = [] } = await supabase.from('enrollments').select('course_id,status').eq('user_id', user.id).neq('status', 'cancelled');
  const enrolled = new Set(enrollments.map(e => e.course_id));
  const grid = document.querySelector('.courses-grid');
  if (!grid || !courses.length) return;
  grid.innerHTML = courses.map(c => `
    <article class="course-card" data-course-id="${c.id}">
      ${c.image_path ? `<img src="../${c.image_path.replace(/^\.\//, '')}" class="course-image" alt="${escapeHtml(c.title)}">` : ''}
      <div class="course-badge ${escapeHtml(c.level)}">${escapeHtml(c.level)}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description || '')}</p>
      <div class="course-meta"><span>⏱ ${c.duration_hours ?? '—'} Hours</span><span>📖 ${c.lesson_count} Lessons</span></div>
      <div class="course-progress"><div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div><span>0% Complete</span></div>
      <button class="btn academy-course-action" data-course-id="${c.id}">${enrolled.has(c.id) ? 'Continue Learning →' : 'Enroll →'}</button>
    </article>`).join('');
  grid.querySelectorAll('.academy-course-action').forEach(btn => btn.addEventListener('click', () => enrollOrContinue(btn, user)));
}

async function enrollOrContinue(button, user) {
  const courseId = button.dataset.courseId;
  const { data: existing } = await supabase.from('enrollments').select('id,status').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  if (!existing) {
    const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
    if (error) { alert(error.message); return; }
  }
  button.textContent = 'Enrolled ✓';
  button.disabled = true;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

async function init() {
  const user = await currentUser();
  if (!user) return;
  const path = location.pathname;
  if (path.endsWith('/dashboard/index.html') || path.endsWith('/dashboard/')) await loadDashboard(user);
  if (path.endsWith('/dashboard/courses.html')) await loadCourses(user);
}

init().catch(error => console.error('APEP Academy integration error:', error));
