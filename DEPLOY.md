# Simteks ERP — canlıya alma ve güvenlik özeti

## 1. Yapılandırma dosyası

1. `erp-config.sample.js` dosyasını kopyalayın → **`erp-config.js`**
2. Supabase Dashboard → **Project Settings → API** bölümünden **Project URL** ve **anon public** anahtarını yapıştırın.
3. **`erp-config.js`** dosyasını `stok.html` ile **aynı klasöre** yükleyin (statik hosting kökü).

`erp-config.js` `.gitignore` içindedir; anahtarlar GitHub’a gitmez. Sunucuya manuel veya güvenli CI sırrı ile kopyalanır.

## 2. Statik barındırma (link ile erişim)

**Netlify:** Repoyu bağlayın veya klasörü sürükleyin. Yayın kökü proje kökü olsun (`netlify.toml` hazır).

**Vercel:** Projeyi import edin; `vercel.json` başlıkları uygular.

**Kendi sunucunuz (IIS / nginx / Apache):** Tüm HTML, `erp-config.js`, `robots.txt` dosyalarını aynı site köküne koyun. **HTTPS** kullanın.

Giriş adresi örnekleri:

- `https://alanadiniz.com/` → `index.html` → `stok.html`
- `https://alanadiniz.com/stok.html`

## 3. Güvenlik başlıkları

`netlify.toml` ve `vercel.json` şunları ekler: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. HTML ve `erp-config.js` için `no-store` önbellek önerilir.

## 4. Arama motorları

`robots.txt` ve `noindex` meta etiketleri ERP’nin indekslenmesini engellemeye yardımcı olur (gizlilik için ek katman; URL bilenler yine erişir — oturum zorunludur).

## 5. Yerel önizleme

```bash
npm start
```

Tarayıcı: `http://localhost:3000/stok.html`

## 6. Sonraki sertleştirme

İş tablolarında RLS veya sunucu tarafı API — `supabase/migrations/erp_commercial_security_notes.sql` dosyasındaki notlara bakın.
