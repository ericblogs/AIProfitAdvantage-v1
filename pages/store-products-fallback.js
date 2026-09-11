import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from '../config/supabase-config.js';

const GRID_ID = 'apep-products-grid';
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey);

function naira(value) {
  return '₦' + Number(value || 0).toLocaleString('en-NG');
}

function coverUrl(path) {
  return path ? `${SUPABASE_CONFIG.url}/storage/v1/object/public/product-covers/${path}` : '';
}

function login(productSlug) {
  const returnTo = encodeURIComponent(window.location.pathname + '#apep-learning-store');
  window.location.href = `../auth/login.html?redirect=${returnTo}`;
}

async function session() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

async function renderProduct(product) {
  const card = document.createElement('article');
  card.className = 'apep-product-card';
  card.innerHTML = `
    <img class="apep-product-cover" src="${coverUrl(product.cover_image_path)}" alt="${product.title}" loading="lazy">
    <div class="apep-product-body">
      <h3 class="apep-product-title">${product.title}</h3>
      <p class="apep-product-desc">${product.short_description || ''}</p>
      <div class="apep-product-price">${naira(product.price)} <span class="usd">or ${product.usd_price ? '$' + product.usd_price : ''} via PayPal</span></div>
      <div class="apep-buy-row">
        <button class="apep-btn-paystack" type="button">Pay ${naira(product.price)} with Paystack</button>
        <div class="apep-paypal-container"></div>
      </div>
    </div>`;

  const buyRow = card.querySelector('.apep-buy-row');
  const paystack = card.querySelector('.apep-btn-paystack');
  const paypal = card.querySelector('.apep-paypal-container');
  const currentSession = await session();

  if (currentSession) {
    const { data: entitlement } = await supabase
      .from('digital_product_entitlements')
      .select('status')
      .eq('product_id', product.id)
      .eq('status', 'active')
      .maybeSingle();

    if (entitlement) {
      buyRow.innerHTML = '<button class="apep-download-btn" type="button">Download your PDF</button>';
      buyRow.querySelector('button').addEventListener('click', async () => {
        const { data, error } = await supabase.functions.invoke('get-digital-product-download-url', { body: { product_id: product.id } });
        if (error || !data?.url) {
          alert("Couldn't generate your download link. Please try again or contact support.");
          return;
        }
        window.open(data.url, '_blank');
      });
      return card;
    }
  }

  paystack.addEventListener('click', async () => {
    const s = await session();
    if (!s) {
      login(product.slug);
      return;
    }
    paystack.disabled = true;
    paystack.textContent = 'Redirecting to Paystack…';
    const { data, error } = await supabase.functions.invoke('initialize-paystack-product-payment', { body: { product_id: product.id } });
    if (error || !data?.authorization_url) {
      paystack.disabled = false;
      paystack.textContent = `Pay ${naira(product.price)} with Paystack`;
      alert('Unable to start payment. Please try again.');
      return;
    }
    window.location.href = data.authorization_url;
  });

  if (window.paypal && product.usd_price) {
    window.paypal.Buttons({
      style: { layout: 'horizontal', height: 45, tagline: false },
      createOrder: async (data, actions) => {
        const s = await session();
        if (!s) {
          login(product.slug);
          throw new Error('login_required');
        }
        return actions.order.create({
          purchase_units: [{
            custom_id: `${s.user.id}:${product.id}`,
            amount: { value: String(product.usd_price), currency_code: 'USD' },
            description: product.title
          }]
        });
      },
      onApprove: async (data, actions) => {
        await actions.order.capture();
        const { data: result, error } = await supabase.functions.invoke('verify-paypal-product-payment', {
          body: { order_id: data.orderID, product_id: product.id }
        });
        if (error || !result?.success) {
          alert("We couldn't confirm your PayPal payment. Please contact support with order ID: " + data.orderID);
          return;
        }
        window.location.reload();
      }
    }).render(paypal).catch(() => {
      paypal.innerHTML = '<div class="apep-paypal-unavailable">PayPal checkout is temporarily unavailable. You can use Paystack instead.</div>';
    });
  } else if (product.usd_price) {
    paypal.innerHTML = '<div class="apep-paypal-unavailable">PayPal checkout is temporarily unavailable. You can use Paystack instead.</div>';
  }

  return card;
}

async function restoreProducts() {
  const grid = document.getElementById(GRID_ID);
  if (!grid || grid.querySelector('.apep-product-card')) return;

  const { data: products, error } = await supabase
    .from('digital_products')
    .select('id,slug,title,short_description,price,currency,usd_price,cover_image_path')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('APEP Store product fallback:', error);
    grid.innerHTML = '<p class="apep-products-loading">The product catalogue could not be loaded. Please refresh the page.</p>';
    return;
  }

  if (!products?.length) {
    grid.innerHTML = '<p class="apep-products-loading">No published products are currently available.</p>';
    return;
  }

  grid.innerHTML = '';
  for (const product of products) {
    try {
      grid.appendChild(await renderProduct(product));
    } catch (error) {
      console.error('APEP Store product render error:', product.id, error);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(restoreProducts, 1800), { once: true });
} else {
  setTimeout(restoreProducts, 1800);
}
