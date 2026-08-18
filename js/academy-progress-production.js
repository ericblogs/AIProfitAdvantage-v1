/**
 * APEP Academy lesson progress integration.
 * Preserves the existing lesson UI and adds authenticated progress persistence.
 * Current lesson-player scope: AI Foundations lessons 1-3.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const COURSE_SLUG = 'ai-foundations';
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

function lessonNumber() {
  const match = location.pathname.match(/lesson-(\d+)\.html$/);
  return match ? Number(match[1]) : null;
}

function setCourseProgress(percent) {
  const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  document.querySelectorAll('.course-progress-card .progress-fill').forEach((el) => {
    el.style.width = `${value}%`;
  });
  document.querySelectorAll('.course-progress-card p strong').forEach((el) => {
    el.textContent = `${value}%`;
  });
}

async function init() {
  const number = lessonNumber();
  if (!number || number > 3) return;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return;
  const user = userData.user;

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,lesson_count')
    .eq('slug', COURSE_SLUG)
    .eq('is_published', true)
    .maybeSingle();
  if (courseError || !course) return;

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id,course_id,lesson_number,title,is_published')
    .eq('course_id', course.id)
    .eq('lesson_number', number)
    .eq('is_published', true)
    .maybeSingle();
  if (lessonError || !lesson) return;

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id,status')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .in('status', ['active', 'completed'])
    .maybeSingle();
  if (!enrollment) return;

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('progress_percent,completed')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .maybeSingle();

  const { data: courseProgress } = await supabase
    .from('lesson_progress')
    .select('progress_percent,completed,lesson_id')
    .eq('user_id', user.id);

  const courseLessonIds = new Set(
    (await supabase.from('lessons').select('id').eq('course_id', course.id).eq('is_published', true)).data?.map((row) => row.id) || []
  );
  const relevantProgress = (courseProgress || []).filter((row) => courseLessonIds.has(row.lesson_id));
  const overall = relevantProgress.length
    ? relevantProgress.reduce((sum, row) => sum + Number(row.progress_percent || 0), 0) / Math.max(courseLessonIds.size, 1)
    : 0;
  setCourseProgress(overall);

  const controls = document.querySelector('.lesson-controls');
  if (!controls) return;

  const existing = document.getElementById('academy-lesson-progress');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'academy-lesson-progress';
  wrapper.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:flex-end;margin:16px 0;flex-wrap:wrap;';

  const status = document.createElement('span');
  status.textContent = progress?.completed ? '✅ Lesson completed' : `${Number(progress?.progress_percent || 0)}% complete`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button-primary';
  button.textContent = progress?.completed ? 'Completed ✓' : 'Mark Lesson Complete';
  button.disabled = Boolean(progress?.completed);

  button.addEventListener('click', async () => {
    button.disabled = true;
    const { error } = await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      completed: true,
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });

    if (error) {
      button.disabled = false;
      status.textContent = `⚠️ ${error.message}`;
      return;
    }

    button.textContent = 'Completed ✓';
    status.textContent = '✅ Lesson completed';
    setCourseProgress(overall + (100 - Number(progress?.progress_percent || 0)) / Math.max(courseLessonIds.size, 1));
  });

  wrapper.append(status, button);
  controls.parentNode.insertBefore(wrapper, controls);
}

init().catch((error) => console.error('APEP Academy progress error:', error));
