/**
 * Masaüstü güncelleme yayını — yalnız geliştirici bilgisayarında.
 *
 * Kurulum:
 *   1) Bu dosyayı kopyalayıp "erp-update.config.js" adıyla kaydedin
 *   2) Supabase Dashboard → Project Settings → API → service_role secret
 *
 * UYARI: service_role anahtarını asla repoya veya istemci koduna koymayın.
 * Yayın: GUNCELLEME-YAYINLA.bat  veya  npm run publish
 */
module.exports = {
    supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
    serviceRoleKey: 'YOUR_SERVICE_ROLE_SECRET_KEY',
    storagePath: 'win'
};
