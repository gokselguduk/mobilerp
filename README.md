# Mobil ERP — dosya yapısı

Mobil kodlar dağınık tutulmaz. Üç dosya yeter:

| Dosya | Görev |
|-------|--------|
| `mobil-erp.html` | İnce kabuk (menü + DOM) |
| `assets/mobil/mobil-erp.css` | Tüm mobil stiller |
| `assets/mobil/mobil-app.js` | **Tek JS** — lite bayrak/stub, zoom kilidi, uygulama, mobil overrides |

## Yükleme sırası

1. `erp-config.js`
2. Tailwind + Supabase (CDN)
3. `mobil-erp.css`
4. DOM
5. `mobil-app.js` (tek script)

## `mobil-app.js` içinde (sırayla)

1. Lite bayraklar + Chart/Excel stub  
2. Pinch zoom kilidi  
3. Ana uygulama  
4. Overrides: anasayfa / canlı senkron / Excel kapalı, PDF lazy  

## Bilinçli kapalı (mobil)

- Anasayfa / dashboard  
- Canlı senkron  
- Chart.js / Excel  
- html2pdf açılışta yok (yalnızca PDF indirilirken)

## Masaüstü

`stok.html` / Electron tam özellikli kalır; mobil dosyalarını kullanmaz.

## Araçlar

```bash
# CSS + ana JS'i HTML'den ayırmak (nadiren; tek parça yedek gerekir)
node scripts/split-mobil-erp.js

# Lite / zoom / overrides parçalarını tekrar tek JS'te birleştirmek
node scripts/merge-mobil-js.js
```
