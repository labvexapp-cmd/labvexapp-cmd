# LabVex Deploy Notları

## Mevcut Durum: Static Export (Cloudflare Pages)
- `next.config.ts` → `output: "export"` aktif
- Build: `npm run build` → `out/` klasörüne static HTML üretir
- Deploy: Cloudflare Pages otomatik deploy (GitHub push ile)
- Cloudflare ayarları: Build cmd = `npm run build`, Deploy cmd = `npx wrangler pages deploy out`, Output dir = boş

## İLERİDE: OpenNext'e Geçiş (SSR/Database/Auth eklenince)
Veritabanı, kullanıcı girişi veya server-side rendering gerekince:

### Adım 1: next.config.ts
```ts
// Bu satırı SİL veya yorum yap:
// output: "export",

// Bu satırı dosyanın EN ALTINA ekle:
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

### Adım 2: Cloudflare Ayarları
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`

### Adım 3: wrangler.jsonc oluştur
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "labvex",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

### Gerekli Paket (zaten yüklü)
- `@opennextjs/cloudflare` v1.16.5 ✓
- `open-next.config.ts` dosyası zaten var ✓

### Neden Şu An Static Export?
- Sitemizde henüz veritabanı/auth/API yok
- Static export daha hızlı (sunucu yok, doğrudan HTML)
- Cloudflare Pages ile sorunsuz çalışır
- İleride geçiş 5 dakika sürer
