import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const supabase=createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=(id)=>document.getElementById(id);
let userId=null;

function escapeHtml(value){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function formatDate(value){try{return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return value||'';}}

async function requireSession(){
  const {data,error}=await supabase.auth.getSession();
  if(error||!data.session){window.location.href='../auth/login.html?next='+encodeURIComponent(window.location.href);return null;}
  userId=data.session.user.id;return data.session;
}

async function loadConversations(){
  const {data,error}=await supabase.from('apep_ai_conversations').select('id,title,status,updated_at,last_message_at').order('updated_at',{ascending:false}).limit(20);
  if(error){$('conversation-list').innerHTML='<p class="ai-empty">Unable to load your conversations right now.</p>';return;}
  $('conversation-count').textContent=data?.length||0;$('usage-conversations').textContent=data?.length||0;
  if(!data?.length){$('conversation-list').innerHTML='<p class="ai-empty">No conversations yet. Start with an objective above.</p>';return;}
  $('conversation-list').innerHTML=data.map(c=>`<div class="conversation-item"><div><button type="button" data-open-conversation="${escapeHtml(c.id)}">${escapeHtml(c.title)}</button><span class="conversation-meta">${escapeHtml(formatDate(c.updated_at))} · ${escapeHtml(c.status)}</span></div></div>`).join('');
}

async function loadContext(){
  const {data,error}=await supabase.from('apep_ai_user_context').select('id,context_type,context_value,created_at').order('created_at',{ascending:false});
  if(error){$('context-list').innerHTML='<p class="ai-empty">Unable to load your context.</p>';return;}
  $('usage-context').textContent=data?.length||0;
  $('context-list').innerHTML=data?.length?data.map(item=>`<div class="context-item"><div><strong>${escapeHtml(item.context_type)}</strong><span>${escapeHtml(item.context_value)}</span></div><button type="button" class="button button-secondary" data-delete-context="${escapeHtml(item.id)}">Delete</button></div>`).join(''):'<p class="ai-empty">No context stored yet.</p>';
}

$('ai-composer').addEventListener('submit',async(event)=>{
  event.preventDefault();
  const input=$('ai-objective');const objective=input.value.trim();if(!objective)return;
  const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
  $('ai-provider-status').textContent='Creating your private APEP workspace…';
  const title=objective.length>72?objective.slice(0,69)+'…':objective;
  const {data:conversation,error:conversationError}=await supabase.from('apep_ai_conversations').insert({user_id:userId,title}).select('id').single();
  if(conversationError){$('ai-provider-status').textContent='We could not create the workspace. Please try again.';button.disabled=false;return;}
  $('ai-provider-status').textContent='Sending your objective securely to APEP AI…';
  const {data,error}=await supabase.functions.invoke('apep-ai-generate',{body:{conversation_id:conversation.id,message:objective}});
  input.value='';button.disabled=false;
  if(error){
    $('ai-provider-status').textContent='The workspace is ready, but AI generation is not available yet. '+(error.message||'Please try again later.');
  }else if(data?.message){
    $('ai-provider-status').textContent='APEP AI responded. Open the conversation to continue.';
  }else{
    $('ai-provider-status').textContent='The workspace was created. AI generation is awaiting provider configuration.';
  }
  await loadConversations();
});
$('context-form').addEventListener('submit',async(event)=>{
  event.preventDefault();
  const type=$('context-type').value,value=$('context-value').value.trim();if(!value)return;
  const {error}=await supabase.from('apep_ai_user_context').insert({user_id:userId,context_type:type,context_value:value});
  if(error){$('context-value').setCustomValidity('Could not save context.');$('context-value').reportValidity();return;}
  $('context-value').value='';await loadContext();
});

$('context-list').addEventListener('click',async(event)=>{
  const button=event.target.closest('[data-delete-context]');if(!button)return;
  button.disabled=true;await supabase.from('apep_ai_user_context').delete().eq('id',button.dataset.deleteContext);await loadContext();
});

(async()=>{const session=await requireSession();if(!session)return;await Promise.all([loadConversations(),loadContext()]);})();