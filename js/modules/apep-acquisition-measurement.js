const ENDPOINT='https://ccxxokxkxhakwwzqwqgn.supabase.co/functions/v1/apep-growth-acquisition-event';
const SESSION_KEY='apep:growth:session:v1';
const SENT_PREFIX='apep:growth:page:v1:';

function sessionKey(){
  try{
    let value=sessionStorage.getItem(SESSION_KEY);
    if(!value){
      value=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_KEY,value);
    }
    return value;
  }catch{return null;}
}

function params(){
  try{
    const p=new URLSearchParams(window.location.search);
    return {utm_source:p.get('utm_source'),utm_medium:p.get('utm_medium'),utm_campaign:p.get('utm_campaign')};
  }catch{return {utm_source:null,utm_medium:null,utm_campaign:null};}
}

function send(eventType,extra={}){
  const payload={event_type:eventType,page_path:window.location.pathname,referrer:document.referrer||null,session_key:sessionKey(),...params(),...extra};
  try{
    fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,mode:'cors'}).catch(()=>{});
  }catch{}
}

function trackPageView(){
  const key=SENT_PREFIX+window.location.pathname;
  try{
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,'1');
  }catch{}
  send('page_view');
}

function trackClicks(){
  document.addEventListener('click',(event)=>{
    const link=event.target.closest?.('a,button');
    if(!link)return;
    const label=(link.textContent||link.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,160);
    const href=link.getAttribute('href')||'';
    if(!label)return;
    const meaningful=link.matches('.nav-cta,.button,.apep-download-btn,[href*="whatsapp"],[href^="mailto:"],[href^="tel:"],[href*="store"],[href*="referral"]');
    if(!meaningful)return;
    send('cta_click',{cta_label:label,metadata:{href}});
  },{passive:true});
}

function trackForms(){
  document.addEventListener('submit',(event)=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement))return;
    const isContact=form.matches('.contact-form') || form.querySelector('#message,textarea[name="Message"]');
    if(isContact)send('lead_form_submit',{cta_label:'Contact form submitted',metadata:{form_action:form.getAttribute('action')||''}});
    const emailField=form.querySelector('input[type="email"]');
    if(emailField && !isContact)send('newsletter_signup',{cta_label:'Email form submitted'});
  },true);
}

function init(){
  if(window.location.pathname.includes('/dashboard/'))return;
  trackPageView();
  trackClicks();
  trackForms();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
