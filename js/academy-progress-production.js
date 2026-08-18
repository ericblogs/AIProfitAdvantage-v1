/**
 * APEP Academy lesson progress integration.
 * Preserves the existing lesson UI and adds authenticated progress persistence.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

function lessonNumber() {
  const match = location.pathname.match(/lesson-(\d+)\.html$/);
  return match ? Number(match[1]) : null;
}

async function init() {
  const number = lessonNumber();
  if (!number) return;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return;
  const user = userData.user;

  const { data: lesson } = await supabase.from('lessons').select('id,course_id,lesson_number,title').eq('lesson_number', number).maybeSingle();
  if (!lesson) return;

  const { data: enrollment } = await supabase.from('enrollments').select('id,status').eq('user_id', user.id).eq('course_id', lesson.course_id).neq('status', 'cancelled').maybeSingle();
  if (!enrollment) return;

  const { data: progress } = await supabase.from('lesson_progress').select('progress_percent,completed').eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle();
  const controls = document.querySelector('.lesson-controls');
  if (!controls) return;

  const wrapper = document.createElement('div');
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
  });
  wrapper.append(status, button);
  controls.parentNode.insertBefore(wrapper, controls);
}

init().catch(error => console.error('APEP Academy progress error:', error));
