const ENDPOINT='https://ccxxokxkxhakwwzqwqgn.supabase.co/functions/v1/apep-growth-acquisition-event';
const SESSION_KEY='apep:growth:session:v1';
const ATTRIBUTION_KEY='apep:growth:attribution:v1';
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

function currentAttribution(){
  const current=params();
  const referrer=document.referrer||null;
  try{
    const saved=sessionStorage.getItem(ATTRIBUTION_KEY);
    const prior=saved?JSON.parse(saved):null;
    const hasUtm=current.utm_source||current.utm_medium||current.utm_campaign;
    if(hasUtm){
      const attribution={source:current.utm_source||current.utm_medium||'campaign',referrer,utm_source:current.utm_source,utm_medium:current.utm_medium,utm_campaign:current.utm_campaign};
      sessionStorage.setItem(ATTRIBUTION_KEY,JSON.stringify(attribution));
      return attribution;
    }
    if(prior)return prior;
    let source='direct';
    if(referrer){
      try{
        const refHost=new URL(referrer).hostname.toLowerCase();
        const currentHost=window.location.hostname.toLowerCase();
        if(refHost===currentHost||refHost.endsWith('.'+currentHost))source='internal';
        else if(/(^|\.)google\.|(^|\.)bing\.|(^|\.)yahoo\.|(^|\.)duckduckgo\.|(^|\.)ecosia\./.test(refHost))source='organic_search';
        else source='referral';
      }catch{source='referral';}
    }
    const attribution={source,referrer,utm_source:null,utm_medium:null,utm_campaign:null};
    sessionStorage.setItem(ATTRIBUTION_KEY,JSON.stringify(attribution));
    return attribution;
  }catch{
    return {source:null,referrer,utm_source:current.utm_source,utm_medium:current.utm_medium,utm_campaign:current.utm_campaign};
  }
}

function send(eventType,extra={}){
  const attribution=currentAttribution();
  const payload={
    event_type:eventType,
    page_path:window.location.pathname,
    source:attribution.source,
    referrer:attribution.referrer,
    session_key:sessionKey(),
    utm_source:attribution.utm_source,
    utm_medium:attribution.utm_medium,
    utm_campaign:attribution.utm_campaign,
    ...extra
  };
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

function productContext(card){
  if(!card)return null;
  return {product_id:card.dataset.productId||null,product_title:(card.querySelector('.apep-product-title')?.textContent||'').trim().slice(0,200)};
}

function oncePerSession(key,eventType,extra={}){
  try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{}
  send(eventType,extra);
}

function trackCommerceInteractions(){
  document.addEventListener('click',(event)=>{
    const target=event.target.closest?.('a,button');
    if(!target)return;
    const card=target.closest?.('.apep-product-card');
    if(!card)return;
    const context=productContext(card);
    if(!context?.product_id)return;
    if(target.matches('.apep-btn-paystack,.apep-btn-paypal-fallback')){
      const method=target.matches('.apep-btn-paystack')?'paystack':'paypal';
      oncePerSession(`apep:growth:checkout:${context.product_id}:${method}`,'checkout_start',{cta_label:target.textContent.trim().slice(0,160),metadata:{...context,payment_method:method}});
      return;
    }
    if(target.matches('.apep-download-btn')){
      oncePerSession(`apep:growth:download:${context.product_id}`,'product_download',{cta_label:'Download your product',metadata:context});
      return;
    }
    if(target.matches('.apep-read-more,.apep-product-cover,.apep-product-title,.apep-share-btn')){
      oncePerSession(`apep:growth:interest:${context.product_id}`,'product_interest',{cta_label:target.textContent.trim().slice(0,160)||'Product interaction',metadata:context});
    }
  },{passive:true});
}

function trackClicks(){
  document.addEventListener('click',(event)=>{
    const link=event.target.closest?.('a,button');
    if(!link)return;
    const label=(link.textContent||link.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,160);
    const href=link.getAttribute('href')||'';
    if(!label)return;
    const meaningful=link.matches('.nav-cta,.button,[href*="whatsapp"],[href^="mailto:"],[href^="tel:"],[href*="store"],[href*="referral"]');
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
  trackCommerceInteractions();
  trackForms();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
