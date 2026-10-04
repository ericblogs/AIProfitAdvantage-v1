import { getSupabase } from './supabase-client.js';

const css = `.apep-next-best-product{margin:20px 0;padding:20px;border:1px solid #dfe5ee;border-radius:14px;background:linear-gradient(135deg,#f9fbfd,#fff);box-shadow:0 4px 16px rgba(30,48,75,.05)}.apep-next-best-product .apep-nbp-kicker{margin:0 0 5px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#C9902A}.apep-next-best-product h3{margin:0 0 7px;color:#2B3A55;font-size:19px;line-height:1.25}.apep-next-best-product p{margin:0 0 12px;color:#5d6878;font-size:13px;line-height:1.55}.apep-nbp-title{font-weight:800;color:#2B3A55;margin:0 0 8px}.apep-nbp-actions{display:flex;gap:9px;flex-wrap:wrap}.apep-nbp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 14px;border:0;border-radius:8px;background:#1459b8;color:#fff;font-weight:800;font-size:13px;cursor:pointer}.apep-nbp-btn.secondary{background:#fff;color:#2B3A55;border:1px solid #d7deea}.apep-nbp-status{margin-top:9px;min-height:16px;font-size:11px;color:#697586}@media(max-width:520px){.apep-nbp-actions{flex-direction:column}.apep-nbp-btn{width:100%}}`;

function injectStyles(){if(document.getElementById('apep-next-best-product-styles'))return;const s=document.createElement('style');s.id='apep-next-best-product-styles';s.textContent=css;document.head.appendChild(s)}
function waitForGrid(timeout=7000){return new Promise(resolve=>{const start=Date.now();const tick=()=>{const grid=document.querySelector('#apep-products-grid');if(grid&&(grid.querySelector('.apep-product-card')||Date.now()-start>timeout))return resolve(grid);setTimeout(tick,200)};tick()})}
function normalise(v){return String(v||'').replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase()}
function findProductCard(grid,id){return [...grid.querySelectorAll('.apep-product-card')].find(card=>String(card.dataset.productId||'')===String(id))}
async function getCandidate(client,session,sourceProductId){
  let q=client.from('apep_customer_recommendation_candidates').select('recommended_product_id,title,recommendation_score,need,confidence').eq('user_id',session.user.id).order('recommendation_score',{ascending:false}).limit(10);
  const {data,error}=await q;
  if(error||!Array.isArray(data)||!data.length)return null;
  const previous=await client.from('apep_customer_recommendations').select('recommended_product_id,status,shown_at').eq('user_id',session.user.id).order('shown_at',{ascending:false}).limit(20);
  const recent=(previous.data||[]).filter(x=>x.status!=='converted').map(x=>String(x.recommended_product_id));
  return data.find(x=>!recent.includes(String(x.recommended_product_id)))||data[0];
}
async function logSignal(client,session,sourceProductId,candidate,eventType){
  const value=(candidate.need||'behavioural')+'|'+candidate.recommended_product_id;
  await client.from('apep_customer_signals').insert({user_id:session.user.id,product_id:sourceProductId||candidate.recommended_product_id,signal_type:'recommendation_'+eventType,signal_value:value});
}
async function createRecommendation(client,session,sourceProductId,candidate){
  const {data,error}=await client.from('apep_customer_recommendations').insert({
    user_id:session.user.id,
    source_product_id:sourceProductId||null,
    recommended_product_id:candidate.recommended_product_id,
    reason:candidate.need?'Matched to the customer’s latest stated need.':'Selected from observed customer behaviour and purchase history.',
    score:candidate.recommendation_score,
    status:'shown',
    metadata:{confidence:candidate.confidence||0,need:candidate.need||null}
  }).select('id').single();
  if(error)return null;
  return data;
}
function mount(grid,candidate,recommendationId,client,session,sourceProductId){
  if(document.getElementById('apep-next-best-product'))return;
  const card=findProductCard(grid,candidate.recommended_product_id);if(!card)return;
  const panel=document.createElement('section');panel.id='apep-next-best-product';panel.className='apep-next-best-product';
  const reason=candidate.need?'This matches the need you most recently indicated.':'This recommendation is based on your recent activity and products you already own.';
  panel.innerHTML='<p class="apep-nbp-kicker">Your next APEP recommendation</p><h3>A practical next step based on your activity</h3><p class="apep-nbp-title"></p><p class="apep-nbp-reason"></p><div class="apep-nbp-actions"><button type="button" class="apep-nbp-btn">View the recommended resource →</button><button type="button" class="apep-nbp-btn secondary">Not now</button></div><div class="apep-nbp-status" aria-live="polite"></div>';
  panel.querySelector('.apep-nbp-title').textContent=candidate.title||'Recommended APEP resource';
  panel.querySelector('.apep-nbp-reason').textContent=reason;
  grid.parentNode.insertBefore(panel,grid);
  const view=panel.querySelector('.apep-nbp-btn'),dismiss=panel.querySelector('.secondary'),status=panel.querySelector('.apep-nbp-status');
  logSignal(client,session,sourceProductId,candidate,'shown').catch(()=>{});
  view.addEventListener('click',async()=>{status.textContent='';await client.from('apep_customer_recommendations').update({status:'clicked',acted_at:new Date().toISOString()}).eq('id',recommendationId).eq('user_id',session.user.id);await logSignal(client,session,sourceProductId,candidate,'clicked');card.scrollIntoView({behavior:'smooth',block:'center'});card.style.outline='3px solid #C9902A';card.style.outlineOffset='3px';setTimeout(()=>{card.style.outline='';card.style.outlineOffset='';},2200)});
  dismiss.addEventListener('click',async()=>{await client.from('apep_customer_recommendations').update({status:'dismissed',acted_at:new Date().toISOString()}).eq('id',recommendationId).eq('user_id',session.user.id);panel.remove()});
}
export async function initialiseNextBestProduct(){
  if(!window.location.pathname.endsWith('/pages/store.html'))return;
  injectStyles();const grid=await waitForGrid();if(!grid)return;
  const client=await getSupabase();let session=null;
  for(let i=0;i<12&&!session;i++){const result=await client.auth.getSession();session=result.data?.session||null;if(!session)await new Promise(r=>setTimeout(r,300))}
  if(!session)return;
  const {data:entitlements,error}=await client.from('digital_product_entitlements').select('product_id,status').eq('user_id',session.user.id).eq('status','active');if(error||!entitlements?.length)return;
  const sourceProductId=entitlements[0]?.product_id||null;
  const candidate=await getCandidate(client,session,sourceProductId);if(!candidate)return;
  const card=findProductCard(grid,candidate.recommended_product_id);if(!card)return;
  const rec=await createRecommendation(client,session,sourceProductId,candidate);if(!rec)return;
  mount(grid,candidate,rec.id,client,session,sourceProductId);
}
window.addEventListener('apep:next-need-selected',()=>{const existing=document.getElementById('apep-next-best-product');if(existing)existing.remove();initialiseNextBestProduct().catch(error=>console.warn('APEP adaptive recommendation refresh failed:',error))});
initialiseNextBestProduct().catch(error=>console.warn('APEP adaptive recommendation failed:',error));
