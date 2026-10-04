import { getSupabase } from './supabase-client.js';

const NEED_TO_PRODUCT = {
  'client-acquisition': {
    match: ['international client acquisition playbook'],
    label: 'The International Client Acquisition Playbook for Freelancers',
    reason: 'If your next priority is winning better-fit clients, this is the most direct next resource in the APEP Store.'
  },
  'client-management': {
    match: ['freelance client management system'],
    label: 'The Freelance Client Management System',
    reason: 'If you want a stronger way to manage client work after the sale, this is the natural next step.'
  },
  'productivity': {
    match: ['ai productivity operating system'],
    label: 'The AI Productivity Operating System For Professionals',
    reason: 'If you want a more consistent way to use AI in your working day, this is the strongest match.'
  },
  'automation': {
    match: ['ai automation workflow business system'],
    label: 'AI Automation & Workflow Business System',
    reason: 'If repetitive work is the problem, this resource is designed to help you turn recurring tasks into practical workflows.'
  },
  'financial-management': {
    match: ["freelancer's financial management", 'freelancer’s financial management'],
    label: "The Freelancer's Financial Management & Cash Flow System",
    reason: 'If you want clearer control over invoices, expenses, cash flow and project profitability, this is the relevant next resource.'
  },
  'business-transformation': {
    match: ['ai business transformation', 'business transformation & implementation'],
    label: 'AI Business Transformation & Implementation System',
    reason: 'If your next priority is building stronger systems across the business, this is the broadest match.'
  }
};

const css = `.apep-next-best-product{margin:20px 0;padding:20px;border:1px solid #dfe5ee;border-radius:14px;background:linear-gradient(135deg,#f9fbfd,#fff);box-shadow:0 4px 16px rgba(30,48,75,.05)}.apep-next-best-product .apep-nbp-kicker{margin:0 0 5px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#C9902A}.apep-next-best-product h3{margin:0 0 7px;color:#2B3A55;font-size:19px;line-height:1.25}.apep-next-best-product p{margin:0 0 12px;color:#5d6878;font-size:13px;line-height:1.55}.apep-nbp-title{font-weight:800;color:#2B3A55;margin:0 0 8px}.apep-nbp-actions{display:flex;gap:9px;flex-wrap:wrap}.apep-nbp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 14px;border:0;border-radius:8px;background:#1459b8;color:#fff;font-weight:800;font-size:13px;cursor:pointer}.apep-nbp-btn.secondary{background:#fff;color:#2B3A55;border:1px solid #d7deea}.apep-nbp-status{margin-top:9px;min-height:16px;font-size:11px;color:#697586}@media(max-width:520px){.apep-nbp-actions{flex-direction:column}.apep-nbp-btn{width:100%}}`;

function injectStyles(){if(document.getElementById('apep-next-best-product-styles'))return;const s=document.createElement('style');s.id='apep-next-best-product-styles';s.textContent=css;document.head.appendChild(s)}
function waitForGrid(timeout=7000){return new Promise(resolve=>{const start=Date.now();const tick=()=>{const grid=document.querySelector('#apep-products-grid');if(grid&&(grid.querySelector('.apep-product-card')||Date.now()-start>timeout))return resolve(grid);setTimeout(tick,200)};tick()})}
function normalise(v){return String(v||'').replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase()}
function findProductCard(grid,rule,owned){const cards=[...grid.querySelectorAll('.apep-product-card')];return cards.find(card=>{const id=String(card.dataset.productId||'');if(owned.has(id))return false;const title=normalise(card.querySelector('.apep-product-title')?.textContent);return rule.match.some(term=>title.includes(normalise(term)))})}
async function track(client,session,sourceProductId,need,recommendedProductId,eventType){try{await client.from('apep_customer_signals').insert({user_id:session.user.id,product_id:sourceProductId||recommendedProductId,signal_type:'recommendation_'+eventType,signal_value:need+'|'+recommendedProductId});}catch(error){console.warn('APEP recommendation tracking failed:',error)}}
async function getLatestNeed(client,session){const {data,error}=await client.from('apep_customer_signals').select('product_id,signal_value,created_at').eq('user_id',session.user.id).eq('signal_type','next_need').order('created_at',{ascending:false}).limit(1);if(error||!Array.isArray(data)||!data[0])return null;return data[0]}
function mount(grid,rule,need,sourceProductId,recommendedCard,client,session){if(document.getElementById('apep-next-best-product'))return;const title=recommendedCard.querySelector('.apep-product-title')?.textContent?.trim()||rule.label;const panel=document.createElement('section');panel.id='apep-next-best-product';panel.className='apep-next-best-product';panel.innerHTML='<p class="apep-nbp-kicker">Your next APEP recommendation</p><h3>Based on what you said you want to improve</h3><p class="apep-nbp-title">'+title+'</p><p>'+rule.reason+'</p><div class="apep-nbp-actions"><button type="button" class="apep-nbp-btn">View the recommended resource →</button><button type="button" class="apep-nbp-btn secondary">Not now</button></div><div class="apep-nbp-status" aria-live="polite"></div>';grid.parentNode.insertBefore(panel,grid);const view=panel.querySelector('.apep-nbp-btn');const dismiss=panel.querySelector('.secondary');const status=panel.querySelector('.apep-nbp-status');track(client,session,sourceProductId,need,recommendedCard.dataset.productId,'shown');view.addEventListener('click',async()=>{await track(client,session,sourceProductId,need,recommendedCard.dataset.productId,'clicked');recommendedCard.scrollIntoView({behavior:'smooth',block:'center'});recommendedCard.style.outline='3px solid #C9902A';recommendedCard.style.outlineOffset='3px';setTimeout(()=>{recommendedCard.style.outline='';recommendedCard.style.outlineOffset='';},2200)});dismiss.addEventListener('click',()=>{panel.remove()})}
export async function initialiseNextBestProduct(){if(!window.location.pathname.endsWith('/pages/store.html'))return;injectStyles();const grid=await waitForGrid();if(!grid)return;const client=await getSupabase();let session=null;for(let i=0;i<12&&!session;i++){const result=await client.auth.getSession();session=result.data?.session||null;if(!session)await new Promise(r=>setTimeout(r,300))}if(!session)return;const {data:entitlements,error}=await client.from('digital_product_entitlements').select('product_id,status').eq('user_id',session.user.id).eq('status','active');if(error||!Array.isArray(entitlements)||!entitlements.length)return;const owned=new Set(entitlements.map(x=>String(x.product_id)));const latest=await getLatestNeed(client,session);if(!latest?.signal_value)return;const need=String(latest.signal_value);const rule=NEED_TO_PRODUCT[need];if(!rule)return;const recommended=findProductCard(grid,rule,owned);if(!recommended)return;mount(grid,rule,need,String(latest.product_id||''),recommended,client,session)}
window.addEventListener('apep:next-need-selected',()=>{const existing=document.getElementById('apep-next-best-product');if(existing)existing.remove();initialiseNextBestProduct().catch(error=>console.warn('APEP next-best-product refresh failed:',error))});
initialiseNextBestProduct().catch(error=>console.warn('APEP next-best-product failed:',error));
