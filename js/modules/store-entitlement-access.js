const SUPABASE_CONFIG=Object.freeze({url:'https://ccxxokxkxhakwwzqwqgn.supabase.co',publishableKey:'sb_publishable_OaCYNEZJpRPz-6oe15pKvA_jcNPQM-R'});
let clientPromise=null;
async function getClient(){
  if(clientPromise)return clientPromise;
  clientPromise=(async()=>{
    if(window.supabase?.createClient)return window.supabase.createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.publishableKey);
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
    return createClient(SUPABASE_CONFIG.url,SUPABASE_CONFIG.publishableKey);
  })();
  return clientPromise;
}
function addAccessStyles(){
  if(document.getElementById('apep-entitlement-access-styles'))return;
  const s=document.createElement('style');
  s.id='apep-entitlement-access-styles';
  s.textContent='.apep-download-btn{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:44px!important;height:44px!important;box-sizing:border-box!important;border:0!important;border-radius:8px!important;background:#1459b8!important;color:#fff!important;font:800 14px/1.2 inherit!important;cursor:pointer!important;visibility:visible!important;opacity:1!important}.apep-download-btn:disabled{opacity:.7!important;cursor:wait!important}.apep-entitlement-access-row{width:100%;margin-top:8px}.apep-entitlement-access-row .apep-download-btn{margin:0!important}';
  document.head.appendChild(s);
}
async function waitForGrid(){
  for(let i=0;i<40;i++){
    const grid=document.querySelector('#apep-products-grid');
    if(grid)return grid;
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  return null;
}
async function waitForSession(client){
  for(let i=0;i<12;i++){
    const {data}=await client.auth.getSession();
    if(data?.session)return data.session;
    await new Promise(resolve=>setTimeout(resolve,300));
  }
  return null;
}
function wireDownload(button,client,productId){
  button.addEventListener('click',async()=>{
    button.disabled=true;
    button.textContent='Preparing download…';
    const {data,error}=await client.functions.invoke('get-digital-product-download-url',{body:{product_id:productId}});
    if(error||!data?.url){
      button.disabled=false;
      button.textContent='Download your product';
      alert("Couldn't generate your download link. Please try again or contact support.");
      return;
    }
    window.open(data.url,'_blank','noopener');
    button.disabled=false;
    button.textContent='Download your product';
  });
}
async function renderEntitledDownloads(){
  try{
    const grid=await waitForGrid();
    if(!grid)return;
    addAccessStyles();
    const client=await getClient();
    const session=await waitForSession(client);
    if(!session)return;
    const {data,error}=await client.functions.invoke('get-digital-product-entitlements',{body:{}});
    if(error||!Array.isArray(data?.entitlements)){
      console.warn('APEP independent entitlement access lookup failed:',error||data);
      return;
    }
    for(const row of data.entitlements){
      const productId=String(row?.product_id||'');
      if(!productId||row?.status!=='active')continue;
      const card=grid.querySelector(`.apep-product-card[data-product-id="${CSS.escape(productId)}"]`);
      if(!card)continue;
      const buyRow=card.querySelector('.apep-buy-row');
      if(!buyRow)continue;
      if(buyRow.querySelector('.apep-download-btn'))continue;
      const button=document.createElement('button');
      button.type='button';
      button.className='apep-download-btn';
      button.textContent='Download your product';
      wireDownload(button,client,productId);
      buyRow.replaceChildren(button);
    }
  }catch(error){
    console.warn('APEP independent entitlement access renderer failed:',error);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderEntitledDownloads,{once:true});else renderEntitledDownloads();
