const STORE_SELECTOR='#apep-learning-store';

function injectStoreCatalogueStyles(){
  if(document.getElementById('apep-store-catalogue-styles')) return;
  const style=document.createElement('style');
  style.id='apep-store-catalogue-styles';
  style.textContent=`
    #apep-learning-store{padding-top:30px!important;padding-bottom:42px!important}
    #apep-learning-store .apep-store-subheading{margin-bottom:16px!important}
    #apep-products-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important;align-items:start!important}
    #apep-products-grid .apep-product-card{display:flex!important;flex-direction:column!important;height:auto!important;min-height:0!important;align-self:start!important}
    #apep-products-grid .apep-product-cover{width:132px!important;height:176px!important;aspect-ratio:3/4!important;object-fit:cover!important;margin:12px auto 0!important;flex:0 0 auto!important}
    #apep-products-grid .apep-product-body{display:flex!important;flex-direction:column!important;padding:13px 15px 15px!important;gap:0!important;flex:1 1 auto!important;min-width:0!important}
    #apep-products-grid .apep-product-title{font-size:17px!important;line-height:1.25!important;margin:0 0 6px!important;min-height:43px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
    #apep-products-grid .apep-product-description-full,#apep-products-grid .apep-product-desc{position:relative!important;font-size:12.9px!important;line-height:1.45!important;margin:0!important;max-height:112px;overflow:hidden!important;padding-bottom:28px!important}
    #apep-products-grid .apep-product-description-full.is-expanded,#apep-products-grid .apep-product-desc.is-expanded{max-height:none!important;overflow:visible!important;padding-bottom:0!important}
    #apep-products-grid .apep-read-more-wrap{width:100%!important;margin:0 0 8px!important;min-height:28px;display:flex;align-items:flex-start;justify-content:center!important;text-align:center!important}
    #apep-products-grid .apep-read-more{appearance:none;border:1px solid #1266ed!important;background:#1266ed!important;color:#fff!important;border-radius:7px!important;padding:5px 12px!important;margin:0 auto!important;font:700 11px/1.2 "DM Sans",Arial,sans-serif!important;cursor:pointer!important;box-shadow:0 3px 8px rgba(18,102,237,.16);transition:transform .18s ease,background .18s ease!important}
    #apep-products-grid .apep-read-more:hover{background:#0b53c7!important;transform:translateY(-1px)!important}
    #apep-products-grid .apep-product-description-full.is-expanded + .apep-read-more-wrap{margin-top:5px!important}
    #apep-products-grid .apep-product-meta-share{margin-top:3px!important}
    #apep-products-grid .apep-product-meta{display:none!important}
    #apep-products-grid .apep-product-price{font-size:18px!important;margin:5px 0 0!important;padding-top:8px!important;border-top:1px solid #edf0f5!important;text-align:center!important}
    #apep-products-grid .apep-buy-row{display:flex!important;flex-direction:row!important;justify-content:center!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;margin-top:5px!important;width:100%!important}
    #apep-products-grid .apep-btn-paystack,#apep-products-grid .apep-download-btn{min-height:38px!important;height:38px!important;width:auto!important;padding:8px 11px!important;font-size:12px!important;border-radius:8px!important;white-space:nowrap!important}
    #apep-products-grid .apep-paypal-container{width:205px!important;max-width:100%!important;min-height:38px!important;height:38px!important;overflow:hidden!important;margin:0!important}
    #apep-products-grid .apep-product-note{font-size:10.5px!important;line-height:1.3!important;margin:4px 0 0!important;color:#7b8492!important;text-align:center!important}
    #apep-products-grid .apep-product-share{margin:5px 0 0 auto!important}
    #apep-products-grid .apep-product-includes{display:none!important}
    @media(max-width:900px){#apep-products-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}}
    @media(max-width:620px){#apep-learning-store{padding:22px 12px 34px!important}#apep-products-grid{grid-template-columns:1fr!important;gap:14px!important}#apep-products-grid .apep-product-cover{width:124px!important;height:165px!important}#apep-products-grid .apep-product-body{padding:12px 13px 14px!important}#apep-products-grid .apep-product-title{font-size:16px!important;min-height:0}#apep-products-grid .apep-product-description-full,#apep-products-grid .apep-product-desc{max-height:118px}}
  `;
  document.head.appendChild(style);
}

function removeLegacyIncludes(card){
  if(!card) return;
  card.querySelectorAll('.apep-product-includes').forEach((node)=>node.remove());
}

function addReadMore(card){
  if(!card||card.querySelector('.apep-read-more-wrap')) return;
  const desc=card.querySelector('.apep-product-description-full,.apep-product-desc');
  if(!desc) return;
  const wrapper=document.createElement('div');
  wrapper.className='apep-read-more-wrap';
  const button=document.createElement('button');
  button.type='button';
  button.className='apep-read-more';
  button.textContent='Click to Read More';
  button.setAttribute('aria-expanded','false');
  button.addEventListener('click',()=>{
    const expanded=desc.classList.toggle('is-expanded');
    button.setAttribute('aria-expanded',String(expanded));
    button.textContent=expanded?'Click to Show Less':'Click to Read More';
  });
  desc.after(wrapper);
  wrapper.appendChild(button);
}

function normaliseCard(card){
  if(!card) return;
  removeLegacyIncludes(card);
  addReadMore(card);
}

function initialiseStoreCatalogue(){
  const store=document.querySelector(STORE_SELECTOR);
  const grid=document.getElementById('apep-products-grid');
  if(!store||!grid) return;
  injectStoreCatalogueStyles();
  grid.querySelectorAll('.apep-product-card').forEach(normaliseCard);
  const observer=new MutationObserver(()=>grid.querySelectorAll('.apep-product-card').forEach(normaliseCard));
  observer.observe(grid,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialiseStoreCatalogue,{once:true});
else initialiseStoreCatalogue();
