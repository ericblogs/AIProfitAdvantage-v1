import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../../config/supabase-config.js';

let clientPromise = null;

export async function getSupabase(){
  if (!clientPromise) {
    clientPromise = Promise.resolve(
      createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    );
  }
  return clientPromise;
}
