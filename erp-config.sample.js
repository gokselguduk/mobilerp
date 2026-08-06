/**
 * Simteks ERP — Supabase istemci yapılandırması
 *
 * Kurulum: Bu dosyayı kopyalayıp "erp-config.js" adıyla kaydedin ve değerleri doldurun.
 * Supabase Dashboard → Project Settings → API: Project URL + anon public key
 *
 * Güvenlik: "anon" anahtarı tarayıcıda görünür; bu Supabase’te normaldir.
 * Asıl koruma RLS + erp_* oturum RPC’leri ile sağlanır. service_role anahtarını
 * asla istemciye koymayın.
 */
window.__ERP_SUPABASE = {
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};
