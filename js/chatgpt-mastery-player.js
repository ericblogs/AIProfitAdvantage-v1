import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';
import { CHATGPT_MASTERY_LESSONS, getPremiumLesson } from './chatgpt-mastery-lessons.js';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
const COURSE_SLUG='chatgpt-mastery';
const root=document.getElementById('chatgpt-mastery-app');
const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const list=(title,items)=>`<section class="lesson-section"><h3>${esc(title)}</h3><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;

async function init(){
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){root.innerHTML='<section class="dashboard-panel"><h2>Sign in required</h2><p>Please sign in to access AI & ChatGPT Mastery.</p></section>';return;}
 const {data:course,error:courseError}=await supabase.from('courses').select('id,title,slug,lesson_count,is_published').eq('slug',COURSE_SLUG).maybeSingle();
 if(courseError||!course){root.innerHTML='<section class="dashboard-panel"><h2>Course unavailable</h2><p>The course record could not be loaded.</p></section>';return;}
 const {data:enrolment}=await supabase.from('enrollments').select('id,status').eq('user_id',user.id).eq('course_id',course.id).maybeSingle();
 if(!enrolment||enrolment.status==='cancelled'){root.innerHTML='<section class="dashboard-panel"><h2>Enrollment required</h2><p>Open the Course Library and enrol in this course before starting.</p></section>';return;}
 const {data:progress=[]}=await supabase.from('lesson_progress').select('lesson_id,progress_percent,completed').eq('user_id',user.id);
 const {data:dbLessons=[]}=await supabase.from('lessons').select('id,lesson_number,title,duration_minutes,is_published').eq('course_id',course.id).order('lesson_number');
 const byNo=new Map(dbLessons.map(l=>[l.lesson_number,l]));
 render(course,progress,byNo);
 const requested=Number(new URLSearchParams(window.location.search).get('lesson')||0);
 if(requested>=1&&requested<=20) openLesson(requested,course,progress,byNo);
}
function render(course,progress,byNo){
 const completed=new Set(progress.filter(p=>p.completed).map(p=>p.lesson_id));
 root.innerHTML=`<section class="dashboard-panel"><div class="course-badge intermediate">INTERMEDIATE</div><h2>AI & ChatGPT Mastery</h2><p>20 lessons: learn to use conversational AI as a professional thinking, research, creation, analysis and productivity system.</p><div class="course-progress"><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(completed.size/20*100)}%"></div></div><span>${completed.size}/20 lessons completed</span></div></section><section class="courses-grid">${CHATGPT_MASTERY_LESSONS.map(l=>{const db=byNo.get(l.n);const done=db&&completed.has(db.id);return `<article class="course-card"><div class="course-badge">LESSON ${l.n}</div><h3>${esc(l.t)}</h3><p>${esc(l.o[0])}</p><div class="course-meta"><span>⏱ ${l.d} min</span><span>${done?'✅ Completed':'▶ Ready'}</span></div><button class="btn" data-lesson="${l.n}">${done?'Review Lesson':'Start Lesson'} →</button></article>`}).join('')}</section>`;
 root.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>openLesson(Number(b.dataset.lesson),course,progress,byNo)));
}
function openLesson(n,course,progress,byNo){
 const l=getPremiumLesson(n);const db=byNo.get(n);if(!l||!db)return;
 root.innerHTML=`<section class="dashboard-panel"><div class="course-badge">LESSON ${n} OF 20</div><h1>${esc(l.t)}</h1><p><strong>${l.d} minutes</strong></p>${list('Learning Objectives',l.o)}<section class="lesson-section"><h3>Why This Lesson Matters</h3><p>${esc(l.why)}</p></section>${l.s.map((x,i)=>`<section class="lesson-section"><h3>${i===0?'Core Concept':i===1?'Professional Application':'APEP Practice Principle'}</h3><p>${esc(x)}</p></section>`).join('')}${list('Common Mistakes to Avoid',l.mistakes)}${list('Knowledge Check',l.check)}<section class="lesson-section"><h3>Reflection</h3><p>${esc(l.reflection)}</p></section><section class="lesson-section"><h3>AI Prompt Practice</h3><pre class="prompt-example">${esc(l.p)}</pre></section><section class="lesson-section"><h3>Lesson Completion Challenge</h3><p>${esc(l.e)}</p></section><section class="lesson-section"><h3>APEP Quality Gate</h3><ul>${l.qualityGate.map(x=>`<li><strong>${esc(x)}</strong> — verify before professional use.</li>`).join('')}</ul></section><section class="lesson-section"><h3>Next Lesson Connection</h3><p>${esc(l.next)}</p></section><div class="course-meta"><a class="btn" href="chatgpt-mastery-resources.html?lesson=${n}">📚 Lesson Resources</a><button class="btn" id="complete">Mark Lesson Complete</button><button class="btn" id="back">← Course Outline</button></div><div id="status" aria-live="polite"></div></section>`;
 root.querySelector('#back').onclick=()=>{history.replaceState({},'', 'chatgpt-mastery.html');render(course,progress,byNo)};
 root.querySelector('#complete').onclick=()=>completeLesson(db,course,n,progress,byNo);
}
async function completeLesson(db,course,n,progress,byNo){
 const btn=root.querySelector('#complete');btn.disabled=true;btn.textContent='Saving…';
 const {error}=await supabase.from('lesson_progress').upsert({user_id:(await supabase.auth.getUser()).data.user.id,lesson_id:db.id,progress_percent:100,completed:true,completed_at:new Date().toISOString()},{onConflict:'user_id,lesson_id'});
 if(error){btn.disabled=false;btn.textContent='Mark Lesson Complete';root.querySelector('#status').textContent=error.message;return;}
 const updatedProgress=progress.filter(p=>p.lesson_id!==db.id).concat({lesson_id:db.id,completed:true,progress_percent:100});
 if(n<20){root.querySelector('#status').innerHTML=`<p>Lesson ${n} completed. <button class="btn" id="next">Continue to Lesson ${n+1} →</button></p>`;root.querySelector('#next').onclick=()=>{history.replaceState({},'',`chatgpt-mastery.html?lesson=${n+1}`);openLesson(n+1,course,updatedProgress,byNo)};}
 else {
   // Course 2 has its own completion state. Never route to the generic
   // AI Foundations lesson player or lesson-20.html. Return explicitly to
   // the Course Library with the completed course selected/focused.
   root.innerHTML=`<section class="dashboard-panel"><div class="course-badge intermediate">COURSE COMPLETE</div><h1>🎓 AI & ChatGPT Mastery Completed</h1><p>You have completed all 20 lessons in AI & ChatGPT Mastery.</p><p>Your completion is saved to your student progress record.</p><div class="course-meta"><a class="btn" href="courses.html?course=chatgpt-mastery">📚 View Course Library</a><a class="btn" href="chatgpt-mastery.html">↩ Review Course 2</a></div></section>`;
 }
}
init().catch(e=>{console.error(e);root.innerHTML='<section class="dashboard-panel"><h2>Unable to load course</h2><p>Please try again.</p></section>';});
