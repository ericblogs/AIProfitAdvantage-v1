import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { FORUM_CONFIG } from '../config/forum-config.js';

const supabase = createClient(FORUM_CONFIG.url, FORUM_CONFIG.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

export async function renderGovernanceEngagement(topicId) {
  if (!topicId) return '';
  const [{ data: counts }, { data: mine }, { data: poll }] = await Promise.all([
    supabase.from('forum_topic_vote_counts').select('upvotes,downvotes,score').eq('topic_id', topicId).maybeSingle(),
    supabase.from('forum_topic_votes').select('vote').eq('topic_id', topicId).maybeSingle(),
    supabase.from('forum_polls').select('id,question,is_multiple_choice,is_anonymous,status,closes_at,forum_poll_options(id,option_text,display_order)').eq('topic_id', topicId).maybeSingle()
  ]);
  const score = Number(counts?.score || 0);
  const mineVote = Number(mine?.vote || 0);
  const voteBar = `<section class="forum-vote-panel" data-forum-vote-topic="${esc(topicId)}" aria-label="Community vote"><div class="forum-vote-heading"><strong>Community vote</strong><span>Was this discussion useful?</span></div><div class="forum-vote-actions"><button type="button" class="forum-vote-button ${mineVote===1?'is-active':''}" data-forum-vote="1" aria-pressed="${mineVote===1}">▲ <span>Upvote</span> <b>${Number(counts?.upvotes||0)}</b></button><span class="forum-vote-score" aria-label="Vote score">${score}</span><button type="button" class="forum-vote-button ${mineVote===-1?'is-active':''}" data-forum-vote="-1" aria-pressed="${mineVote===-1}">▼ <span>Downvote</span> <b>${Number(counts?.downvotes||0)}</b></button></div><p class="forum-vote-status" role="status" aria-live="polite"></p></section>`;
  const pollHtml = poll ? `<section class="forum-poll-panel" data-forum-poll="${esc(poll.id)}"><div class="forum-poll-heading"><span class="eyebrow">Community poll</span><h3>${esc(poll.question)}</h3><p>${poll.is_multiple_choice?'Choose up to 5 options.':'Choose one option.'}${poll.status==='closed'?' Poll closed.':''}</p></div><div class="forum-poll-options">${(poll.forum_poll_options||[]).sort((a,b)=>a.display_order-b.display_order).map(o=>`<label class="forum-poll-option"><input type="${poll.is_multiple_choice?'checkbox':'radio'}" name="poll-${esc(poll.id)}" value="${esc(o.id)}"> <span>${esc(o.option_text)}</span></label>`).join('')}</div><button class="button button-primary forum-poll-submit" type="button" ${poll.status==='closed'?'disabled':''}>Vote</button><p class="forum-poll-status" role="status" aria-live="polite"></p><div class="forum-poll-results" hidden></div></section>` : '';
  return `${voteBar}${pollHtml}`;
}

export function bindGovernanceEngagement(root) {
  root.querySelectorAll('[data-forum-vote-topic]').forEach(panel => panel.addEventListener('click', async e => {
    const button = e.target.closest('[data-forum-vote]'); if (!button) return;
    const topicId = panel.dataset.forumVoteTopic; const vote = Number(button.dataset.forumVote);
    const status = panel.querySelector('.forum-vote-status');
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { const next = `${window.location.pathname}${window.location.search}`; window.location.href=`../auth/login.html?next=${encodeURIComponent(next)}`; return; }
    try {
      const { data: current } = await supabase.from('forum_topic_votes').select('vote').eq('topic_id',topicId).eq('user_id',user.id).maybeSingle();
      if (current?.vote === vote) { const { error } = await supabase.from('forum_topic_votes').delete().eq('topic_id',topicId).eq('user_id',user.id); if(error) throw error; }
      else { const { error } = await supabase.from('forum_topic_votes').upsert({topic_id:topicId,user_id:user.id,vote},{onConflict:'topic_id,user_id'}); if(error) throw error; }
      window.location.reload();
    } catch (error) { console.error(error); if(status) status.textContent='Your vote could not be saved. Please try again.'; }
  }));

  root.querySelectorAll('.forum-poll-panel').forEach(panel => panel.querySelector('.forum-poll-submit')?.addEventListener('click', async () => {
    const pollId = panel.dataset.forumPoll; const selected=[...panel.querySelectorAll('input:checked')].map(i=>i.value); const status=panel.querySelector('.forum-poll-status');
    if(!selected.length){status.textContent='Select an option first.';return;}
    const {data:{user}}=await supabase.auth.getUser(); if(!user){const next=`${window.location.pathname}${window.location.search}`;window.location.href=`../auth/login.html?next=${encodeURIComponent(next)}`;return;}
    try { const {error}=await supabase.from('forum_poll_votes').insert(selected.map(option_id=>({poll_id,option_id,user_id:user.id}))); if(error) throw error; status.textContent='Vote recorded. Thank you for participating.'; panel.querySelector('.forum-poll-submit').disabled=true; panel.querySelectorAll('input').forEach(i=>i.disabled=true); } catch(error){console.error(error);status.textContent=error.message.includes('already voted')?'You have already voted in this poll.':'Your poll vote could not be saved. Please try again.';}
  }));
}
