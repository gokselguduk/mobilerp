/**
 * Simteks ERP — Supabase istemci yapılandırması
 *
 * Kurulum: Bu dosyayı kopyalayıp "erp-config.js" adıyla kaydedin ve değerleri doldurun.
 * Supabase Dashboard → Project Settings → API: Project URL + anon public key
 *
 * Güvenlik: "anon" anahtarı tarayıcıda görünür; bu Supabase’te normaldir.
 * Asıl güvenlik için erp_auth.sql + RLS + ağ kısıtlaması birlikte kullanılmalıdır.
 */
window.__ERP_SUPABASE = {
    url: 'https://xzpmxdeteovwuqhjtasq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6cG14ZGV0ZW92d3VxaGp0YXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDE4ODMsImV4cCI6MjA4NjM3Nzg4M30.uITwza3xOP_6sWKij3IQGHHL3nKMN0l5Ree1StfQvH4',
    // Sadece lokal geliştirme için true yapın (yalnız localhost'ta login bypass açılır).
    allowLocalBypass: false,
    /** Konfeksiyon menüsü: 'simteks' | 'fason' | 'both' (both iken yan menüde profil seçici) */
    konfPanel: 'both'
};
