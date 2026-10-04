const STORE_PATH='/pages/store.html';

function waitForStore(timeout=8000){
  return new Promise(resolve=>{
    const started=Date.now();
    const tick=()=>{
      const grid=document.getElementById('apep-products-grid');
      if(grid)return resolve(grid);
      if(Date.now()-started>=timeout)return resolve(null);
      setTimeout(tick,200);
    };
    tick();
  });
}

function mountPreferences(grid,client){
  if(document.getElementById('apep-followup-preferences'))return;
  const host=document.createElement('section');
  host.id='apep-followup-preferences';
  host.className='apep-customer-loop';
  host.innerHTML='<div><strong>Customer email preferences</strong><p>Keep essential purchase and customer-support updates on. You can separately choose whether APEP may send product recommendations and other marketing emails.</p><label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input id="apep-service-updates" type="checkbox"> <span>Customer updates</span></label><label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input id="apep-marketing-updates" type="checkbox"> <span>Product recommendations and occasional APEP marketing</span></label><div id="apep-followup-status" aria-live="polite"></div></div>';
  grid.parentNode.insertBefore(host,grid);
  const service=host.querySelector('#apep-service-updates');
  const marketing=host.querySelector('#apep-marketing-updates');
  const status=host.querySelector('#apep-followup-status');
  client.from('apep_customer_followup_preferences').select('service_updates_enabled,marketing_enabled').maybeSingle().then(({data,error})=>{
    if(error)return;
    service.checked=data?.service_updates_enabled!==false;
    marketing.checked=data?.marketing_enabled===true;
  });
  const save=async()=>{
    status.textContent='Saving…';
    const {data:{session}}=await client.auth.getSession();
    if(!session){status.textContent='Please sign in to update your preferences.';return;}
    const {error}=await client.from('apep_customer_followup_preferences').upsert({
      user_id:session.user.id,
      service_updates_enabled:service.checked,
      marketing_enabled:marketing.checked,
      updated_at:new Date().toISOString()
    });
    status.textContent=error?'Could not save your preferences. Please try again.':'Preferences saved.';
  };
  service.addEventListener('change',save);
  marketing.addEventListener('change',save);
}

export async function initialiseCustomerFollowupPreferences(){
  if(window.location.pathname!==STORE_PATH)return;
  const grid=await waitForStore();
  if(!grid)return;
  try{
    const client=await getSupabase();
    const {data:{session}}=await client.auth.getSession();
    if(!session)return;
    mountPreferences(grid,client);
  }catch(error){
    console.warn('APEP customer follow-up preferences failed:',error);
  }
}

initialiseCustomerFollowupPreferences().catch(error=>console.warn('APEP customer follow-up preferences failed:',error));