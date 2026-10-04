import { getSupabase } from './supabase-client.js';

const ACCESS_KEY = 'apep:lifecycle:access:v1';

async function getSession(){
  try{
    const client = await getSupabase();
    for(let i=0;i<12;i++){
      const {data} = await client.auth.getSession();
      if(data?.session) return {client,session:data.session};
      await new Promise(resolve=>setTimeout(resolve,300));
    }
  }catch(error){
    console.warn('APEP lifecycle session lookup failed:',error);
  }
  return null;
}

async function record(eventType,{productId=null,purchaseId=null,eventValue=null,metadata={}}={}){
  const result = await getSession();
  if(!result)return;
  const {client,session}=result;
  try{
    await client.from('apep_customer_lifecycle_events').insert({
      user_id:session.user.id,
      product_id:productId||null,
      purchase_id:purchaseId||null,
      event_type:eventType,
      event_value:eventValue||null,
      metadata
    });
  }catch(error){
    console.warn('APEP lifecycle event tracking failed:',error);
  }
}

function oncePerDay(productId){
  const key=ACCESS_KEY+':'+String(productId||'');
  try{
    const stamp=localStorage.getItem(key);
    const today=new Date().toISOString().slice(0,10);
    if(stamp===today)return false;
    localStorage.setItem(key,today);
    return true;
  }catch{return true}
}

function wireStoreAccessTracking(){
  const grid=document.querySelector('#apep-products-grid');
  if(!grid)return;
  const handler=(event)=>{
    const button=event.target.closest('.apep-download-btn');
    if(!button)return;
    const card=button.closest('.apep-product-card');
    const productId=card?.dataset?.productId||null;
    if(productId && oncePerDay(productId)){
      record('product_accessed',{productId,metadata:{source:'store_download_button'}});
    }
  };
  grid.addEventListener('click',handler);
}

window.addEventListener('apep:next-need-selected',event=>{
  const detail=event.detail||{};
  if(detail.value)record('next_need_selected',{
    productId:detail.productId||null,
    eventValue:detail.value,
    metadata:{source:'customer_loop'}
  });
});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',wireStoreAccessTracking,{once:true});
}else{
  wireStoreAccessTracking();
}
