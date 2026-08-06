# Simteks ERP — adım adım kurulum (birlikte tamamlama listesi)

Her adımı sırayla yapın; bitince satırdaki `[ ]` yerine `[x]` koyabilirsiniz.

---

## Aşama 1 — Bilgisayarınızda çalıştırma

- [ ] **Adım 1.1** — Proje klasörünü açın: `tekstil-erp`
- [ ] **Adım 1.2** — `erp-config.js` dosyasının var olduğundan emin olun.  
  Yoksa: `erp-config.sample.js` → kopyala → `erp-config.js` yapın; içine Supabase **URL** ve **anon key** yazın.
- [ ] **Adım 1.3** — Klasörde terminal açın ve çalıştırın: `npm start`
- [ ] **Adım 1.4** — Tarayıcıda açın: **http://localhost:3000** veya **http://localhost:3000/stok.html**
- [ ] **Adım 1.5** — Giriş ekranı geliyor ve Supabase ile giriş yapılabiliyor mu kontrol edin.

---

## Aşama 2 — Supabase veritabanı (oturum / kullanıcılar)

- [ ] **Adım 2.1** — [Supabase SQL Editor](https://supabase.com/dashboard) → projeniz → **SQL** → **New query**
- [ ] **Adım 2.2** — `supabase/migrations/erp_auth.sql` dosyasının **tamamını** yapıştırıp **Run** (bir kez yeterli).
- [ ] **Adım 2.3** — Dosya sonundaki **INSERT** (ilk admin) satırlarındaki `--` işaretlerini kaldırın, güçlü şifre yazın, tekrar **Run**.
- [ ] **Adım 2.4** — Aynı kullanıcı adı/şifre ile `stok.html` üzerinden giriş deneyin.

---

## Aşama 3 — İnternet linki (canlı site)

**Seçenek A — Netlify (kolay)**

- [ ] **Adım 3A.1** — [netlify.com](https://www.netlify.com) hesabı açın / giriş yapın.
- [ ] **Adım 3A.2** — **Add new site** → **Deploy manually** (veya Git bağlayın).
- [ ] **Adım 3A.3** — Tüm `tekstil-erp` klasörünü **zip** yapıp sürükleyin **veya** klasörü bağlayın.  
  Önemli: **`erp-config.js` zip içinde olsun** (Git’ten deploy ediyorsanız Netlify’da `erp-config.js` Git’te yoksa: deploy sonrası Netlify **Deploy file browser** veya yeniden zip ile ekleyin).
- [ ] **Adım 3A.4** — Site açılınca verilen URL’yi not edin (örn. `https://xxxx.netlify.app`).
- [ ] **Adım 3A.5** — `https://xxxx.netlify.app` ve `https://xxxx.netlify.app/stok.html` adreslerini test edin.

**Seçenek B — Vercel**

- [ ] **Adım 3B.1** — [vercel.com](https://vercel.com) → projeyi import edin, kök dizin `tekstil-erp`.
- [ ] **Adım 3B.2** — `erp-config.js` repoda yoksa deploy sonrası Vercel’de dosyayı eklemeniz veya Environment + küçük script gerekir; en pratik: **manuel `erp-config.js` commit’i sadece private repo** veya zip deploy benzeri akış.

**Seçenek C — Kendi sunucunuz**

- [ ] **Adım 3C.1** — `stok.html`, `index.html`, `erp-config.js`, `konfeksiyon-panel.html` (kullanıyorsanız), `robots.txt` → web köküne kopyalayın.
- [ ] **Adım 3C.2** — **HTTPS** kullanın (Let’s Encrypt vb.).

---

## Aşama 4 — Canlı ortamda son kontrol

- [ ] **Adım 4.1** — Farklı bir cihazdan veya gizli pencereden canlı linki açın.
- [ ] **Adım 4.2** — Giriş → Dashboard → yetkili olduğunuz bir mod (ör. sipariş) açılıyor mu?
- [ ] **Adım 4.3** — Yöneticiyseniz **Kullanıcı yönetimi**ne girip test kullanıcısı oluşturmayı deneyin.

---

## Aşama 5 — İleri güvenlik (isteğe bağlı, sonraki oturum)

- [ ] **Adım 5.1** — `supabase/migrations/erp_commercial_security_notes.sql` dosyasını okuyun.
- [ ] **Adım 5.2** — İş tablolarında RLS veya Edge Function stratejisi (ayrı teknik adım).

---

## Takılırsanız

| Belirti | Ne yapın |
|--------|-----------|
| Beyaz ekran / “Yapılandırma eksik” | `erp-config.js` aynı klasörde mi, URL/key doğru mu |
| Giriş olmuyor | `erp_auth.sql` + admin `INSERT` çalıştı mı |
| Netlify’da site açılmıyor | Zip’te `index.html` ve `stok.html` kökte mi |

Detaylı notlar: `DEPLOY.md`
