import { getSupabase } from './supabase-client.js';

const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-GB').format(Number(n||0));

async function load(){
  const status=$('#status');
  const dashboard=$('#dashboard');
  try{
    const client=await getSupabase();
    const {data:adminData,error:adminError}=await client.rpc('is_current_user_admin');
    if(adminError||adminData!==true){
      status.textContent='Administrator access is required to view this dashboard.';
      status.className='apep-status apep-error';
      dashboard.hidden=true;
      return;
    }
    const [overview,products]=await Promise.all([
      client.from('apep_customer_lifecycle_overview').select('*').single(),
      client.from('apep_customer_lifecycle_product_summary').select('*')
    ]);
    if(overview.error)throw overview.error;
    if(products.error)throw products.error;
    const o=overview.data||{};
    const metricItems=[
      ['Customers',o.customers],
      ['Engaged customers',o.engaged_customers],
      ['Needs identified',o.need_identified_customers],
      ['Repeat customers',o.repeat_customers]
    ];
    $('#metrics').innerHTML=metricItems.map(([label,value])=>'<div class="apep-metric"><small>'+label+'</small><strong>'+fmt(value)+'</strong></div>').join('');
    $('#funnel').innerHTML=[
      ['Customers',o.customers],
      ['Engaged',o.engaged_customers],
      ['Need identified',o.need_identified_customers],
      ['Recommendation clicked',o.recommendation_clickers],
      ['Repeat customer',o.repeat_customers]
    ].map(([label,value])=>'<div><b>'+fmt(value)+'</b><span>'+label+'</span></div>').join('');
    $('#products').innerHTML=(products.data||[]).map(p=>'<tr><td><strong>'+escapeHtml(p.product_title||'Untitled')+'</strong></td><td>'+fmt(p.purchases)+'</td><td>'+fmt(p.product_accesses)+'</td><td>'+fmt(p.next_need_signals)+'</td><td>'+fmt(p.recommendations_shown)+'</td><td>'+fmt(p.recommendations_clicked)+'</td><td>'+Number(p.recommendation_ctr||0).toFixed(1)+'%</td></tr>').join('');
    status.textContent='Analytics loaded. Last refreshed: '+new Date().toLocaleString('en-GB');
    status.className='apep-status';
    dashboard.hidden=false;
  }catch(error){
    console.error(error);
    status.textContent='The analytics dashboard could not be loaded. No customer data was changed.';
    status.className='apep-status apep-error';
    dashboard.hidden=true;
  }
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
$('#refresh').addEventListener('click',load);
load();
