const {SUPABASE_CONFIG}=await import('../config/supabase-config.js');

const key='sb-ccxxokxkxhakwwzqwqgn-auth-token';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const fmt=v=>v==null||v===''?'—':esc(v);
const empty=(message)=>'<div class="empty-state">'+esc(message)+'</div>';

function getToken(){
  try{
    const x=JSON.parse(localStorage.getItem(key)||'null');
    return x?.access_token||x?.currentSession?.access_token||null;
  }catch{return null}
}

async function api(table,params=''){
  const token=getToken();
  if(!token){
    location.href='../auth/login.html?next='+encodeURIComponent(location.href);
    throw Error('No active session.');
  }
  const r=await fetch(SUPABASE_CONFIG.url+'/rest/v1/'+table+(params?'?'+params:''),{
    headers:{
      apikey:SUPABASE_CONFIG.publishableKey,
      Authorization:'Bearer '+token,
      Accept:'application/json',
      'Accept-Profile':'growth'
    }
  });
  if(!r.ok) throw Error('Growth data unavailable ('+r.status+'). Check Growth API exposure and business membership.');
  return r.json();
}

function rows(items,labelKey,valueKey='status'){
  return items.length
    ?items.map(x=>'<div class="data-row"><span>'+fmt(x[labelKey])+'</span><b>'+fmt(x[valueKey])+'</b></div>').join('')
    :empty('No records have been recorded yet.');
}

async function load(){
  try{
    $('system-status').textContent='Loading…';
    $('gcc-alert').hidden=true;

    const memberships=await api('business_members','select=business_id,role,active&active=eq.true&limit=1');
    if(!memberships.length){
      throw Error('No active Growth Control Centre membership is available for this account. Sign in with the authorised APEP account or provision the account in growth.business_members.');
    }

    const business=(await api('v_current_business_state','select=*&limit=1'))[0];
    if(!business) throw Error('The authenticated account has no readable APEP business record.');

    $('business-name').textContent=business.brand_name||business.business_name||'AI Profit Advantage';
    $('business-meta').textContent=(business.website||'')+' · '+(business.stage_name||'Growth Value Flywheel');

    const [
      stages,constraints,kpis,priorities,pipeline,revenue,recurring,
      experiments,opportunities,content,seo,scalability,risks,decisions
    ]=await Promise.all([
      api('growth_stages','select=stage_id,stage_number,name&order=stage_number'),
      api('v_current_constraint','select=*&limit=1'),
      api('v_kpi_current','select=*&order=period_end.desc&limit=40'),
      api('v_active_priorities','select=*&limit=20'),
      api('v_sales_pipeline','select=*&limit=100'),
      api('v_revenue_summary','select=*&limit=1'),
      api('v_recurring_revenue_summary','select=*&limit=1'),
      api('v_experiment_pipeline','select=*&limit=50'),
      api('v_opportunity_backlog','select=*&limit=50'),
      api('v_content_pipeline','select=*&limit=50'),
      api('v_seo_current','select=*&limit=50'),
      api('v_scalability_status','select=*&limit=50'),
      api('v_risk_register','select=*&limit=50'),
      api('v_decision_log','select=*&limit=50')
    ]);

    $('stage-list').innerHTML=stages.length
      ?stages.map(x=>'<div class="stage-item">'+esc(x.stage_number)+'. '+esc(x.name)+'</div>').join('')
      :empty('Growth stages are not available.');

    const c=constraints[0];
    $('constraint-card').innerHTML=c
      ?'<div class="constraint-title">'+fmt(c.constraint_title)+'</div><p>'+fmt(c.description)+'</p><div class="constraint-meta"><span>Stage: '+fmt(c.stage_name)+'</span><span>Confidence: '+fmt(c.confidence_level)+'</span><span>Impact: '+fmt(c.business_impact)+'</span></div>'
      :empty('No active constraint recorded.');

    $('kpi-grid').innerHTML=kpis.length
      ?kpis.map(x=>'<article class="metric-card"><div class="metric-name">'+fmt(x.metric_name)+'</div><div class="metric-value">'+(x.value==null?'No measurement':fmt(x.value))+'</div><div class="metric-period">'+fmt(x.period_end)+' · '+fmt(x.status)+'</div></article>').join('')
      :empty('No KPI measurements recorded yet.');

    $('priority-list').innerHTML=priorities.length
      ?priorities.map(x=>'<div class="data-row"><span>'+fmt(x.title)+'</span><b>'+fmt(x.status)+'</b></div>').join('')
      :empty('No active priorities.');

    const actionIds=priorities.map(x=>x.priority_id).filter(Boolean);
    let actions=[];
    if(actionIds.length){
      actions=await api('actions','select=action_id,title,status,due_date,priority_id&priority_id=in.('+actionIds.join(',')+')&order=due_date.asc&limit=50');
    }
    $('action-list').innerHTML=actions.length
      ?actions.map(x=>'<div class="data-row"><span>'+fmt(x.title)+'</span><b>'+fmt(x.status)+'</b></div>').join('')
      :empty('No actions are linked to active priorities.');

    const pipelineStages={};
    pipeline.forEach(x=>{const k=x.stage||'Unstaged';pipelineStages[k]=(pipelineStages[k]||0)+1;});
    $('pipeline-summary').innerHTML=Object.keys(pipelineStages).length
      ?Object.entries(pipelineStages).map(([stage,count])=>'<div class="data-row"><span>'+esc(stage)+'</span><b>'+count+'</b></div>').join('')
      :empty('No pipeline records.');

    const r=revenue[0];
    $('revenue-summary').innerHTML=r
      ?'<div class="data-row"><span>Total recorded revenue</span><b>'+fmt(r.total_recorded_revenue)+'</b></div><div class="data-row"><span>Current month</span><b>'+fmt(r.current_month_revenue)+'</b></div><div class="data-row"><span>Transactions</span><b>'+fmt(r.transaction_count)+'</b></div>'
      :empty('No revenue records.');

    const rr=recurring[0];
    $('recurring-summary').innerHTML=rr
      ?'<div class="data-row"><span>MRR equivalent</span><b>'+fmt(rr.mrr_equivalent)+'</b></div><div class="data-row"><span>Active contracts</span><b>'+fmt(rr.active_recurring_contracts)+'</b></div>'
      :empty('No recurring-revenue records.');

    $('experiment-list').innerHTML=experiments.length
      ?experiments.map(x=>'<div class="data-row"><span>'+fmt(x.status)+'</span><b>'+fmt(x.experiment_count)+'</b></div>').join('')
      :empty('No experiments recorded.');

    $('opportunity-list').innerHTML=opportunities.length
      ?opportunities.slice(0,12).map(x=>'<div class="data-row"><span>'+fmt(x.title)+'</span><b>'+fmt(x.status)+'</b></div>').join('')
      :empty('No growth opportunities recorded.');

    const contentTotal=content.reduce((n,x)=>n+Number(x.content_count||0),0);
    const seoLatest=seo[0];
    $('authority-summary').innerHTML=
      '<div class="data-row"><span>Content records</span><b>'+contentTotal+'</b></div>'+
      (seoLatest
        ?'<div class="data-row"><span>Latest SEO source</span><b>'+fmt(seoLatest.source)+'</b></div><div class="data-row"><span>Organic visitors</span><b>'+fmt(seoLatest.organic_visitors)+'</b></div><div class="data-row"><span>Indexed pages</span><b>'+fmt(seoLatest.indexed_pages)+'</b></div>'
        :'<div class="empty-state">No SEO measurements recorded.</div>');

    $('scalability-list').innerHTML=scalability.length
      ?scalability.map(x=>'<div class="data-row"><span>'+fmt(x.status)+'</span><b>'+fmt(x.item_count)+'</b></div>').join('')
      :empty('No scalability records.');

    $('risk-list').innerHTML=risks.length
      ?risks.slice(0,12).map(x=>'<div class="data-row"><span>'+fmt(x.title)+'</span><b>'+fmt(x.status)+'</b></div>').join('')
      :empty('No open risks recorded.');

    $('decision-list').innerHTML=decisions.length
      ?decisions.slice(0,12).map(x=>'<div class="data-row"><span>'+fmt(x.title)+'</span><b>'+fmt(x.status)+'</b></div>').join('')
      :empty('No decisions recorded.');

    $('system-status').textContent='Connected';
    $('system-status').className='status-pill ok';
  }catch(e){
    console.error(e);
    $('system-status').textContent='Access/data issue';
    $('system-status').className='status-pill error';
    $('gcc-alert').hidden=false;
    $('gcc-alert').textContent=e.message+' No business data has been invented.';
  }
}

$('refresh-dashboard').onclick=load;
$('gcc-logout').onclick=()=>{localStorage.removeItem(key);location.href='../auth/login.html'};
load();
