# LabVex Deploy Notları

## Mevcut Durum: OpenNext (Cloudflare Workers)
- `next.config.ts` → `output: "export"` **YOK** (SSR modu)
- Build: `npx opennextjs-cloudflare build`
- Deploy: `npx wrangler deploy`
- Cloudflare Dashboard'da bu ayarlar yapıldı, GitHub push ile otomatik deploy

## Cloudflare Dashboard Ayarları
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy: `npx wrangler deploy`
- Environment variables: wrangler.jsonc'deki `vars` ile aynı

## Dosya Yapısı
- `next.config.ts` → SSR, turbopack root fix
- `wrangler.jsonc` → Worker config + env vars
- `open-next.config.ts` → defineCloudflareConfig()
- `.env.local` → Lokal geliştirme env'leri (git'e EKLENMEZ)

## Gerekli Paketler
- `@opennextjs/cloudflare` v1.16.5 ✓
- `wrangler` (devDep olarak @opennextjs/cloudflare ile gelir)

## CDN Yapısı
- Video: BunnyCDN Stream → `https://vz-75d0020c-e31.b-cdn.net`
- Görseller: BunnyCDN Storage → `https://labvex.b-cdn.net`
