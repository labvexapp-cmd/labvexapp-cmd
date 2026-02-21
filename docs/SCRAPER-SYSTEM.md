# LabVex Scraper System - Build Guide

> Bu doküman, LabVex tube sitesi için video scraper sistemi kurmak üzere hazırlanmıştır.
> Sistem bir VPS üzerinde çalışacak ve kullanıcının gönderdiği video linklerini işleyecektir.

---

## 1. Sistem Genel Bakış

### Akış
```
Kullanıcı (Telegram/CLI) → Video URL + Kategori gönderir
       ↓
VPS Scraper → Kaynak siteden metadata çeker (başlık, tag, star, süre, thumbnail vs.)
       ↓
VPS Scraper → Video dosyasını indirir (en yüksek kalite)
       ↓
VPS Scraper → BunnyCDN Stream'e yükler
       ↓
VPS Scraper → Supabase DB'ye tüm bilgileri yazar
       ↓
Video labvex.site'de yayınlanır
```

### Teknoloji Stack
- **Runtime**: Node.js 20+ (TypeScript)
- **Video indirme**: yt-dlp (Python CLI tool - en güvenilir)
- **Scraping**: Playwright (headless browser) veya Cheerio (lightweight HTML parser)
- **DB**: Supabase PostgreSQL (client: @supabase/supabase-js)
- **Video CDN**: BunnyCDN Stream API
- **Process Manager**: PM2 (VPS'de sürekli çalışma)
- **İletişim**: Telegram Bot API (opsiyonel, link gönderme/status alma)

---

## 2. Proje Yapısı

```
labvex-scraper/
├── package.json
├── tsconfig.json
├── .env                          # API keys (ASLA git'e commit etme!)
├── src/
│   ├── index.ts                  # Ana giriş noktası (CLI veya Telegram bot)
│   ├── config.ts                 # Env vars & konfigürasyon
│   │
│   ├── scrapers/                 # Site-specific scraper modülleri
│   │   ├── base-scraper.ts       # Abstract base class
│   │   ├── xhamster.ts
│   │   ├── xvideos.ts
│   │   ├── eporner.ts
│   │   ├── erome.ts
│   │   └── index.ts              # Auto-detect & export
│   │
│   ├── services/
│   │   ├── supabase.ts           # Supabase client & DB operations
│   │   ├── bunny.ts              # BunnyCDN Stream upload
│   │   ├── downloader.ts         # yt-dlp wrapper for video download
│   │   └── telegram.ts           # Telegram bot (opsiyonel)
│   │
│   ├── utils/
│   │   ├── slug.ts               # URL-safe slug generator (Turkish chars)
│   │   ├── logger.ts             # Structured logging
│   │   └── retry.ts              # Retry with exponential backoff
│   │
│   └── types.ts                  # Shared TypeScript types
│
├── downloads/                    # Geçici video indirme klasörü (gitignore)
└── logs/                         # Log dosyaları
```

---

## 3. Environment Variables (.env)

```env
# Supabase
SUPABASE_URL=https://rjuhgllrnlykdmgzntro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_buraya>

# BunnyCDN Stream
BUNNY_STREAM_LIBRARY_ID=603403
BUNNY_STREAM_API_KEY=<bunny_stream_api_key_buraya>
BUNNY_CDN_HOSTNAME=https://vz-75d0020c-e31.b-cdn.net

# BunnyCDN Account API (opsiyonel, storage ops için)
BUNNY_API_KEY=<bunny_account_api_key_buraya>

# Telegram Bot (opsiyonel)
TELEGRAM_BOT_TOKEN=<telegram_bot_token>
TELEGRAM_CHAT_ID=<chat_id>

# Genel
DOWNLOAD_DIR=./downloads
MAX_CONCURRENT_DOWNLOADS=2
DEFAULT_CATEGORY=amator
LOG_LEVEL=info
```

> **NOT**: `SUPABASE_SERVICE_ROLE_KEY` kullanılmalı (anon key DEĞİL). Service role, RLS bypass eder ve tüm tablolara yazma yetkisi verir.

---

## 4. Veritabanı Şeması

Tam SQL: `https://github.com/labvexapp-cmd/labvexapp-cmd/blob/main/tube-site/supabase/migrations/001_initial_schema.sql`

### Scraper'ın kullandığı tablolar:

#### 4.1 `scrape_sources` - Kaynak site konfigürasyonu
```sql
CREATE TABLE scrape_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,          -- 'xhamster', 'xvideos', 'eporner', 'erome'
    base_url TEXT NOT NULL,              -- 'https://www.xhamster.com'
    is_active BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT false,
    auth_cookies JSONB,                  -- site cookies (encrypted)
    auth_headers JSONB,                  -- custom headers
    player_type VARCHAR(50),             -- 'hls', 'dash', 'mp4', 'iframe'
    selectors JSONB,                     -- CSS/XPath selectors
    rate_limit_ms INT DEFAULT 2000,      -- ms between requests
    max_concurrent INT DEFAULT 1,
    user_agent TEXT,
    proxy_required BOOLEAN DEFAULT false,
    total_scraped INT DEFAULT 0,
    last_scrape_at TIMESTAMPTZ,
    last_error TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2 `scrape_jobs` - İşlem logları
```sql
CREATE TABLE scrape_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES scrape_sources(id),
    status scrape_status DEFAULT 'pending',  -- 'pending','running','completed','failed','skipped'
    job_type VARCHAR(50) DEFAULT 'video',
    target_url TEXT,                      -- scrape edilen URL
    target_page INT,
    videos_found INT DEFAULT 0,
    videos_new INT DEFAULT 0,
    videos_skipped INT DEFAULT 0,
    videos_failed INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    error_message TEXT,
    error_stack TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.3 `scrape_raw_data` - Ham çekilen veri
```sql
CREATE TABLE scrape_raw_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES scrape_jobs(id),
    source_id UUID NOT NULL REFERENCES scrape_sources(id),
    source_url TEXT NOT NULL UNIQUE,       -- orijinal video URL
    source_video_id VARCHAR(200),          -- kaynaktaki ID

    -- Orijinal bilgiler (kaynaktan birebir)
    original_title TEXT,
    original_description TEXT,
    original_tags TEXT[],
    original_categories TEXT[],
    original_stars TEXT[],                  -- performer isimleri ARRAY
    original_duration INT,                 -- saniye
    original_quality VARCHAR(20),
    original_thumbnail_url TEXT,
    original_video_urls JSONB,             -- {"720p": "url", "1080p": "url"}
    original_view_count BIGINT,
    original_like_count INT,
    original_upload_date TIMESTAMPTZ,

    page_html_hash VARCHAR(64),
    raw_metadata JSONB,                    -- tüm ham veri

    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    video_id UUID REFERENCES videos(id),
    is_downloaded BOOLEAN DEFAULT false,
    is_uploaded BOOLEAN DEFAULT false,

    downloaded_file_path TEXT,
    downloaded_file_size BIGINT,
    downloaded_file_hash VARCHAR(64),      -- SHA256 - duplicate detection

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.4 `videos` - Ana video tablosu (scraper buraya yazar)
```sql
-- Scraper'ın doldurması gereken alanlar:
videos (
    title,                   -- Türkçe başlık (orijinalden çevir veya temizle)
    slug,                    -- URL-safe slug (ör: "guzel-sarisin-kiz-anal")
    description,             -- SEO açıklaması
    duration,                -- saniye cinsinden
    orientation,             -- 'horizontal' | 'vertical' | 'square'
    video_type,              -- 'long' | 'short' (60sn altı = short)
    bunny_video_id,          -- BunnyCDN'den dönen GUID
    video_url,               -- HLS URL: https://vz-xxx.b-cdn.net/{guid}/playlist.m3u8
    thumbnail_url,           -- https://vz-xxx.b-cdn.net/{guid}/thumbnail.jpg
    preview_url,             -- https://vz-xxx.b-cdn.net/{guid}/preview.webp
    original_quality,        -- kaynak kalite
    max_quality,             -- BunnyCDN'in encode ettiği max kalite
    view_count,              -- kaynaktaki view sayısı
    like_count,
    status,                  -- 'processing' → BunnyCDN encode bittikten sonra 'published'
    source_url,              -- orijinal URL
    source_site,             -- 'xhamster', 'xvideos' vs.
    source_video_id,         -- kaynaktaki ID
    published_at             -- NOW()
)
```

#### 4.5 İlişki tabloları (many-to-many)
```sql
-- Video ↔ Category
video_categories (video_id, category_id, is_primary)

-- Video ↔ Tag
video_tags (video_id, tag_id)

-- Video ↔ Star (BİR VİDEODA BİRDEN FAZLA STAR OLABİLİR!)
video_stars (video_id, star_id, role, sort_order)
```

#### 4.6 `categories` tablosu
```sql
categories (
    id UUID,
    name VARCHAR(100),       -- 'Amatör', 'Anal', vb.
    slug VARCHAR(100),       -- 'amator', 'anal', vb.
    description TEXT,
    is_active BOOLEAN
)
```

#### 4.7 `tags` tablosu
```sql
tags (
    id UUID,
    name VARCHAR(100),       -- tag adı
    slug VARCHAR(100),       -- URL-safe
    video_count INT
)
```

#### 4.8 `stars` tablosu (Performers)
```sql
stars (
    id UUID,
    name VARCHAR(200),        -- 'Lana Rhoades'
    slug VARCHAR(200),        -- 'lana-rhoades'
    avatar_url TEXT,
    bio TEXT,
    birth_date DATE,
    nationality VARCHAR(50),
    aliases TEXT[],            -- alternatif isimler
    video_count INT,
    is_active BOOLEAN
)
```

---

## 5. BunnyCDN Stream API

### Base URL: `https://video.bunnycdn.com/library`
### Library ID: `603403`
### Auth Header: `AccessKey: <BUNNY_STREAM_API_KEY>`

### 5.1 Video Oluştur (upload slot al)
```
POST /library/{libraryId}/videos
Headers: AccessKey: xxx, Content-Type: application/json
Body: { "title": "Video Başlığı" }
Response: { "guid": "abc-123-def", "title": "...", ... }
```

### 5.2 Video Yükle
```
PUT /library/{libraryId}/videos/{videoId}
Headers: AccessKey: xxx, Content-Type: application/octet-stream
Body: <binary video data>
Response: { "success": true }
```

### 5.3 Video Bilgisi Al
```
GET /library/{libraryId}/videos/{videoId}
Headers: AccessKey: xxx
Response: {
  "guid": "abc-123",
  "status": 4,           // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
  "length": 1234,         // duration in seconds
  "width": 1920,
  "height": 1080,
  "thumbnailFileName": "thumbnail.jpg",
  "storageSize": 123456789
}
```

### 5.4 Video Sil
```
DELETE /library/{libraryId}/videos/{videoId}
Headers: AccessKey: xxx
```

### 5.5 CDN URL Formatları
```
HLS Stream:  https://vz-75d0020c-e31.b-cdn.net/{guid}/playlist.m3u8
Thumbnail:   https://vz-75d0020c-e31.b-cdn.net/{guid}/thumbnail.jpg
Preview:     https://vz-75d0020c-e31.b-cdn.net/{guid}/preview.webp
Scene N:     https://vz-75d0020c-e31.b-cdn.net/{guid}/thumbnail_{N}.jpg
```

### 5.6 Upload Akışı (Önemli!)
```
1. POST ile video oluştur → guid al
2. PUT ile video dosyasını yükle (binary stream)
3. BunnyCDN otomatik encode eder (birkaç dakika)
4. Status polling: GET ile status == 4 olana kadar bekle
5. Encode bittikten sonra HLS URL aktif olur
```

---

## 6. Video İndirme (yt-dlp)

### Kurulum
```bash
# Python 3.8+ gerekli
pip install yt-dlp

# veya binary olarak
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
```

### Kullanım (Node.js'den)
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function downloadVideo(url: string, outputPath: string): Promise<string> {
  // En iyi kaliteyi indir (max 1080p)
  const cmd = `yt-dlp -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4 -o "${outputPath}" "${url}"`;
  const { stdout, stderr } = await execAsync(cmd, { timeout: 600000 }); // 10 min timeout
  return outputPath;
}

// Sadece metadata çek (video indirmeden)
async function getMetadata(url: string): Promise<any> {
  const cmd = `yt-dlp --dump-json --no-download "${url}"`;
  const { stdout } = await execAsync(cmd, { timeout: 30000 });
  return JSON.parse(stdout);
}
```

### yt-dlp Desteklenen Siteler
- xhamster.com ✅
- xvideos.com ✅
- eporner.com ✅
- erome.com ✅ (gallery bazlı, her video ayrı)

### yt-dlp Output JSON Formatı (metadata)
```json
{
  "id": "video_id",
  "title": "Video Title",
  "description": "...",
  "duration": 1234,
  "uploader": "username",
  "upload_date": "20260101",
  "view_count": 12345,
  "like_count": 100,
  "categories": ["Amateur", "Anal"],
  "tags": ["tag1", "tag2"],
  "thumbnail": "https://...",
  "formats": [...],
  "webpage_url": "https://...",
  "width": 1920,
  "height": 1080
}
```

---

## 7. Site-Specific Scraper Bilgileri

### 7.1 XHamster
- **URL pattern**: `https://xhamster.com/videos/{slug}-{id}`
- **yt-dlp**: Tam destek (video + metadata)
- **Stars**: Sayfada listelenir, yt-dlp `uploader` olarak dönebilir
- **Ek metadata**: Sayfa HTML'inden Playwright/Cheerio ile çekilmeli:
  - Performers (birden fazla olabilir): `.video-tag-list a` veya JSON-LD
  - Categories: JSON-LD `genre` alanı
  - Tags: `.tags-list a`
- **Rate limit**: 2-3 saniye arası
- **Not**: Bazı videolar coğrafi kısıtlı olabilir, proxy gerekebilir

### 7.2 XVideos
- **URL pattern**: `https://www.xvideos.com/video{id}/{slug}`
- **yt-dlp**: Tam destek
- **Stars**: Sayfa HTML'inde `.is-pornstar a` linki
- **Ek metadata**:
  - Performers: `script` tag içinde JSON data veya `.video-metadata` bölümü
  - Tags: `.video-tags-list a`
  - Categories: Tag'lerden derive edilebilir
- **Rate limit**: 1-2 saniye arası
- **Not**: Oldukça scrape-friendly, nadiren blok atar

### 7.3 Eporner
- **URL pattern**: `https://www.eporner.com/video-{id}/{slug}/`
- **yt-dlp**: Destek var ama bazen kalite seçimi sorunlu
- **Stars**: Sayfa içinde performer linkleri
- **Özel özellik**: 10 sahne fotoğrafı (scene thumbnails) - bunları da çek!
- **Ek metadata**:
  - Performers: `.video-info-wrapper a[href*="/pornstar/"]`
  - Tags: `.video-info-wrapper .tag-item a`
  - Scenes: `.video-scenes img` (eporner'ın özel scene preview'ları)
- **Rate limit**: 2 saniye
- **Not**: Scene thumbnail'ları ayrıca indirilip BunnyCDN'e yüklenmeli

### 7.4 Erome
- **URL pattern**: `https://www.erome.com/a/{albumId}`
- **yt-dlp**: Destek var (album bazlı, her medya ayrı)
- **Özellik**: Album bazlı çalışır, bir albumde birden fazla video/resim olabilir
- **Ek metadata**:
  - Sayfadan title, description
  - Genelde tag/star bilgisi sınırlı
- **Rate limit**: 3 saniye (aggressive koruma var)
- **Not**: Erome galeri bazlı, her albümdeki videoları ayrı ayrı işle
- **Önemli**: Hotlink koruması var, header'da `Referer: https://www.erome.com/` gerekli

---

## 8. Ana İşlem Akışı (processVideoUrl)

```typescript
async function processVideoUrl(url: string, categorySlug?: string): Promise<void> {
  // ADIM 1: Kaynak siteyi belirle
  const source = detectSource(url);
  // → 'xhamster' | 'xvideos' | 'eporner' | 'erome'

  // ADIM 2: Job oluştur (DB'ye kaydet)
  const job = await createScrapeJob(source.id, url);

  // ADIM 3: Duplicate kontrolü
  const existing = await supabase
    .from('scrape_raw_data')
    .select('id, video_id')
    .eq('source_url', url)
    .single();
  if (existing.data) {
    await updateJob(job.id, 'skipped', 'Already exists');
    return;
  }

  // ADIM 4: yt-dlp ile metadata çek
  const metadata = await getMetadata(url);

  // ADIM 5: Ek metadata çek (site-specific scraper ile)
  const scraper = getScraper(source.name);
  const extraData = await scraper.extractExtra(url);
  // extraData = { stars: ['Star1', 'Star2'], tags: [...], scenes: [...] }

  // ADIM 6: scrape_raw_data'ya kaydet
  const rawData = await saveRawData({
    source_id: source.id,
    job_id: job.id,
    source_url: url,
    source_video_id: metadata.id,
    original_title: metadata.title,
    original_description: metadata.description,
    original_tags: [...(metadata.tags || []), ...(extraData.tags || [])],
    original_categories: metadata.categories || [],
    original_stars: extraData.stars || [],
    original_duration: metadata.duration,
    original_quality: `${metadata.height}p`,
    original_thumbnail_url: metadata.thumbnail,
    original_video_urls: extractVideoUrls(metadata.formats),
    original_view_count: metadata.view_count,
    original_like_count: metadata.like_count,
    original_upload_date: parseDate(metadata.upload_date),
    raw_metadata: metadata,
  });

  // ADIM 7: Video dosyasını indir
  const filePath = `./downloads/${rawData.id}.mp4`;
  await downloadVideo(url, filePath);
  const fileSize = getFileSize(filePath);
  const fileHash = await sha256(filePath);

  // Hash ile duplicate kontrolü
  const duplicateByHash = await supabase
    .from('scrape_raw_data')
    .select('id')
    .eq('downloaded_file_hash', fileHash)
    .neq('id', rawData.id)
    .single();
  if (duplicateByHash.data) {
    await updateRawData(rawData.id, { is_processed: true });
    await updateJob(job.id, 'skipped', 'Duplicate file hash');
    deleteFile(filePath);
    return;
  }

  await updateRawData(rawData.id, {
    is_downloaded: true,
    downloaded_file_path: filePath,
    downloaded_file_size: fileSize,
    downloaded_file_hash: fileHash,
  });

  // ADIM 8: BunnyCDN'e yükle
  const bunnyVideo = await bunnyCreateVideo(metadata.title);
  await bunnyUploadVideo(bunnyVideo.guid, filePath);
  await updateRawData(rawData.id, { is_uploaded: true });

  // ADIM 9: BunnyCDN encode bekle (polling)
  await waitForBunnyEncode(bunnyVideo.guid); // status == 4 olana kadar

  // ADIM 10: DB'ye video kaydı oluştur
  const slug = generateSlug(metadata.title);
  const video = await supabase.from('videos').insert({
    title: metadata.title,
    slug: slug,
    description: metadata.description || generateDescription(metadata),
    duration: metadata.duration,
    orientation: metadata.width > metadata.height ? 'horizontal' : (metadata.width < metadata.height ? 'vertical' : 'square'),
    video_type: metadata.duration < 60 ? 'short' : 'long',
    bunny_video_id: bunnyVideo.guid,
    video_url: `https://vz-75d0020c-e31.b-cdn.net/${bunnyVideo.guid}/playlist.m3u8`,
    thumbnail_url: `https://vz-75d0020c-e31.b-cdn.net/${bunnyVideo.guid}/thumbnail.jpg`,
    preview_url: `https://vz-75d0020c-e31.b-cdn.net/${bunnyVideo.guid}/preview.webp`,
    original_quality: `${metadata.height}p`,
    view_count: metadata.view_count || 0,
    like_count: metadata.like_count || 0,
    status: 'published',
    source_url: url,
    source_site: source.name,
    source_video_id: metadata.id,
    published_at: new Date().toISOString(),
  }).select().single();

  // ADIM 11: Kategori bağla
  if (categorySlug) {
    const category = await getOrCreateCategory(categorySlug);
    await supabase.from('video_categories').insert({
      video_id: video.data.id,
      category_id: category.id,
      is_primary: true,
    });
  }

  // ADIM 12: Tag'leri bağla
  const allTags = [...new Set([...(metadata.tags || []), ...(extraData.tags || [])])];
  for (const tagName of allTags) {
    const tag = await getOrCreateTag(tagName);
    await supabase.from('video_tags').insert({
      video_id: video.data.id,
      tag_id: tag.id,
    }).onConflict('video_id,tag_id').ignore();
  }

  // ADIM 13: Star'ları bağla (BİRDEN FAZLA OLABİLİR!)
  const starNames = extraData.stars || [];
  for (let i = 0; i < starNames.length; i++) {
    const star = await getOrCreateStar(starNames[i]);
    await supabase.from('video_stars').insert({
      video_id: video.data.id,
      star_id: star.id,
      role: 'performer',
      sort_order: i,
    }).onConflict('video_id,star_id').ignore();

    // Star video sayısını güncelle
    await supabase.rpc('increment_star_video_count', { p_star_id: star.id });
  }

  // ADIM 14: Scene thumbnail'ları kaydet (eporner gibi)
  if (extraData.scenes && extraData.scenes.length > 0) {
    for (const scene of extraData.scenes) {
      await supabase.from('video_scenes').insert({
        video_id: video.data.id,
        scene_number: scene.number,
        timestamp_start: scene.timestamp,
        thumbnail_url: scene.thumbnailUrl,
      });
    }
  }

  // ADIM 15: raw_data'yı güncelle
  await updateRawData(rawData.id, {
    is_processed: true,
    video_id: video.data.id,
  });

  // ADIM 16: Job'ı tamamla
  await updateJob(job.id, 'completed', null, {
    videos_found: 1,
    videos_new: 1,
  });

  // ADIM 17: İndirilen dosyayı sil (disk tasarrufu)
  deleteFile(filePath);

  console.log(`✅ Video eklendi: ${video.data.slug}`);
}
```

---

## 9. Helper Fonksiyonlar

### 9.1 Site Algılama
```typescript
function detectSource(url: string): { name: string; id: string } {
  const hostname = new URL(url).hostname.replace('www.', '');

  const siteMap: Record<string, string> = {
    'xhamster.com': 'xhamster',
    'xhamster2.com': 'xhamster',
    'xhamster3.com': 'xhamster',
    'xvideos.com': 'xvideos',
    'eporner.com': 'eporner',
    'erome.com': 'erome',
    // Yeni siteler buraya eklenecek
  };

  const name = siteMap[hostname];
  if (!name) throw new Error(`Desteklenmeyen site: ${hostname}`);

  // DB'den source ID'yi çek (cache'le)
  return { name, id: sourceIdCache[name] };
}
```

### 9.2 Slug Generator (Türkçe Karakter Desteği)
```typescript
function generateSlug(title: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
  };

  let slug = title.toLowerCase();
  for (const [tr, en] of Object.entries(turkishMap)) {
    slug = slug.replace(new RegExp(tr, 'g'), en);
  }

  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')       // alfanumerik dışı sil
    .replace(/\s+/g, '-')                // boşlukları tire yap
    .replace(/-+/g, '-')                 // çoklu tireleri tekle
    .replace(/^-|-$/g, '');              // baştaki/sondaki tireleri sil

  // Unique olması için sonuna kısa hash ekle
  const hash = Date.now().toString(36).slice(-4);
  return `${slug}-${hash}`;
}
```

### 9.3 getOrCreateStar
```typescript
async function getOrCreateStar(name: string): Promise<{ id: string }> {
  const slug = generateSlug(name);

  // Önce mevcut star'ı ara (isim veya alias ile)
  const { data: existing } = await supabase
    .from('stars')
    .select('id')
    .or(`slug.eq.${slug},aliases.cs.{${name}}`)
    .single();

  if (existing) return existing;

  // Yoksa yeni oluştur
  const { data: newStar } = await supabase
    .from('stars')
    .insert({
      name: name,
      slug: slug,
      is_active: true,
      video_count: 0,
    })
    .select('id')
    .single();

  return newStar!;
}
```

### 9.4 getOrCreateTag / getOrCreateCategory
```typescript
async function getOrCreateTag(name: string): Promise<{ id: string }> {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return existing;

  const { data: newTag } = await supabase
    .from('tags')
    .insert({ name, slug, video_count: 0 })
    .select('id')
    .single();

  return newTag!;
}

async function getOrCreateCategory(slug: string): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return existing;

  // Yeni kategori
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  const { data: newCat } = await supabase
    .from('categories')
    .insert({ name, slug, is_active: true, video_count: 0 })
    .select('id')
    .single();

  return newCat!;
}
```

### 9.5 BunnyCDN Encode Bekleme
```typescript
async function waitForBunnyEncode(videoGuid: string, maxWaitMs = 600000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoGuid}`,
      { headers: { AccessKey: BUNNY_API_KEY } }
    );
    const data = await res.json();

    if (data.status === 4) return;             // finished
    if (data.status === 5) throw new Error('BunnyCDN encode failed');

    // 15 saniye bekle, tekrar kontrol et
    await new Promise(r => setTimeout(r, 15000));
  }

  throw new Error('BunnyCDN encode timeout');
}
```

---

## 10. Base Scraper Class

```typescript
// src/scrapers/base-scraper.ts

export interface ScrapedExtra {
  stars: string[];           // performer isimleri
  tags: string[];            // ek tag'ler
  categories: string[];      // ek kategoriler
  scenes: Array<{           // scene thumbnails (eporner gibi)
    number: number;
    timestamp: number;
    thumbnailUrl: string;
  }>;
  description?: string;
  customData?: Record<string, any>;
}

export abstract class BaseScraper {
  abstract siteName: string;

  // Site-specific metadata çekme (yt-dlp'nin vermediği bilgiler)
  abstract extractExtra(url: string): Promise<ScrapedExtra>;

  // URL'den video ID çıkar
  abstract extractVideoId(url: string): string;

  // URL bu siteye ait mi kontrol et
  abstract matchesUrl(url: string): boolean;

  // Rate limit uygula
  protected async rateLimit(ms: number = 2000): Promise<void> {
    await new Promise(r => setTimeout(r, ms));
  }
}
```

### Örnek: XHamster Scraper
```typescript
// src/scrapers/xhamster.ts
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedExtra } from './base-scraper';

export class XhamsterScraper extends BaseScraper {
  siteName = 'xhamster';

  matchesUrl(url: string): boolean {
    return /xhamster\d*\.com/.test(url);
  }

  extractVideoId(url: string): string {
    const match = url.match(/videos\/.*?-(\w+)$/);
    return match?.[1] || '';
  }

  async extractExtra(url: string): Promise<ScrapedExtra> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // JSON-LD'den veri çek
    const jsonLdScript = $('script[type="application/ld+json"]').first().html();
    const jsonLd = jsonLdScript ? JSON.parse(jsonLdScript) : {};

    // Performers
    const stars: string[] = [];
    // Sayfadaki pornstar linkleri
    $('a[href*="/pornstars/"]').each((_, el) => {
      const name = $(el).text().trim();
      if (name && !stars.includes(name)) stars.push(name);
    });
    // veya JSON-LD'den
    if (jsonLd.actor) {
      const actors = Array.isArray(jsonLd.actor) ? jsonLd.actor : [jsonLd.actor];
      actors.forEach((a: any) => {
        if (a.name && !stars.includes(a.name)) stars.push(a.name);
      });
    }

    // Tags
    const tags: string[] = [];
    $('.tags-container a, .video-tag a').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag) tags.push(tag);
    });

    // Categories
    const categories: string[] = [];
    if (jsonLd.genre) {
      const genres = Array.isArray(jsonLd.genre) ? jsonLd.genre : [jsonLd.genre];
      categories.push(...genres);
    }

    return { stars, tags, categories, scenes: [] };
  }
}
```

---

## 11. CLI Kullanım

### Tek video işleme
```bash
# Basit kullanım (default kategori)
npx tsx src/index.ts process "https://xhamster.com/videos/example-12345"

# Kategori belirterek
npx tsx src/index.ts process "https://xvideos.com/video12345/slug" --category amator

# Birden fazla URL (sırayla işler)
npx tsx src/index.ts batch urls.txt --category anal
```

### urls.txt formatı
```
https://xhamster.com/videos/example-1
https://xvideos.com/video123/slug
https://eporner.com/video-abc123/title/
```

### index.ts örneği
```typescript
import { Command } from 'commander';

const program = new Command();

program
  .command('process <url>')
  .option('-c, --category <slug>', 'Kategori slug', 'amator')
  .action(async (url, opts) => {
    await processVideoUrl(url, opts.category);
  });

program
  .command('batch <file>')
  .option('-c, --category <slug>', 'Kategori slug')
  .action(async (file, opts) => {
    const urls = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    for (const url of urls) {
      try {
        await processVideoUrl(url.trim(), opts.category);
      } catch (err) {
        console.error(`❌ ${url}: ${err.message}`);
      }
    }
  });

program
  .command('status')
  .action(async () => {
    // Son 20 job'ı göster
    const { data } = await supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    console.table(data);
  });

program.parse();
```

---

## 12. VPS Kurulum Adımları

```bash
# 1. Node.js 20 kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. yt-dlp kur
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# 3. FFmpeg kur (yt-dlp'nin merge işlemi için gerekli)
sudo apt-get install -y ffmpeg

# 4. Proje oluştur
mkdir labvex-scraper && cd labvex-scraper
npm init -y
npm install @supabase/supabase-js commander cheerio dotenv
npm install -D typescript tsx @types/node

# 5. .env dosyası oluştur (yukarıdaki env vars'ları yaz)
nano .env

# 6. PM2 ile sürekli çalıştır (Telegram bot modu için)
npm install -g pm2
pm2 start "npx tsx src/index.ts serve" --name labvex-scraper
pm2 save
pm2 startup
```

---

## 13. Yeni Site Ekleme Rehberi

Yeni bir kaynak site eklemek için:

### Adım 1: DB'ye scrape_source ekle
```sql
INSERT INTO scrape_sources (name, base_url, player_type, rate_limit_ms, selectors, notes)
VALUES (
  'yenisite',
  'https://www.yenisite.com',
  'hls',
  2000,
  '{"stars": "a.pornstar-link", "tags": ".tag-list a", "categories": ".category-list a"}',
  'Yeni eklenen site notları'
);
```

### Adım 2: Scraper modülü oluştur
```typescript
// src/scrapers/yenisite.ts
export class YenisiteScraper extends BaseScraper {
  siteName = 'yenisite';

  matchesUrl(url: string): boolean {
    return url.includes('yenisite.com');
  }

  extractVideoId(url: string): string {
    // URL pattern'e göre ID çıkar
    const match = url.match(/video\/(\d+)/);
    return match?.[1] || '';
  }

  async extractExtra(url: string): Promise<ScrapedExtra> {
    // Cheerio ile sayfadan ek bilgi çek
    // ...
    return { stars: [], tags: [], categories: [], scenes: [] };
  }
}
```

### Adım 3: index.ts'de register et
```typescript
// src/scrapers/index.ts
import { XhamsterScraper } from './xhamster';
import { YenisiteScraper } from './yenisite';

export const scrapers = [
  new XhamsterScraper(),
  new XvideosScraper(),
  new EpornerScraper(),
  new EromeScraper(),
  new YenisiteScraper(),  // yeni eklenen
];

export function getScraper(url: string) {
  const scraper = scrapers.find(s => s.matchesUrl(url));
  if (!scraper) throw new Error(`No scraper found for URL: ${url}`);
  return scraper;
}
```

### Adım 4: detectSource'a hostname ekle
```typescript
const siteMap: Record<string, string> = {
  // ... mevcut siteler
  'yenisite.com': 'yenisite',
};
```

---

## 14. Önemli Notlar

### Güvenlik
- `.env` dosyası ASLA git'e commit edilmemeli
- `SUPABASE_SERVICE_ROLE_KEY` sadece VPS scraper'da kullanılmalı (site frontend'inde DEĞİL)
- İndirilen video dosyaları işlem bittikten sonra silinmeli (disk dolmasın)

### Rate Limiting
- Her site için farklı rate limit uygulanmalı
- Aynı anda max 1-2 video indirilmeli
- IP ban yememek için User-Agent rotasyonu yapılabilir

### Duplicate Detection
- `source_url` ile UNIQUE constraint var (aynı URL tekrar işlenmez)
- `downloaded_file_hash` (SHA256) ile aynı video farklı sitelerden de algılanır

### Error Handling
- Her adımda hata yakalanmalı ve `scrape_jobs`'a yazılmalı
- Başarısız joblar 3 kez retry edilebilir
- Telegram'a hata bildirimi gönderilebilir

### Disk Yönetimi
- `downloads/` klasörü düzenli temizlenmeli
- Upload başarılı olduktan sonra dosya hemen silinmeli
- VPS'de en az 50GB boş disk olmalı

### Video Counter Güncelleme
- Star'a video eklendiğinde `stars.video_count` artırılmalı
- Kategori'ye video eklendiğinde `categories.video_count` artırılmalı
- Tag'e video eklendiğinde `tags.video_count` artırılmalı

---

## 15. Mevcut Kategoriler (Başlangıç)

Sistemde önceden tanımlı kategoriler:
| Slug | Adı |
|------|-----|
| amator | Amatör |
| anal | Anal |
| asyali | Asyalı |
| sarisin | Sarışın |
| esmer | Esmer |
| cumshot | Cumshot |
| milf | MILF |
| lezbiyen | Lezbiyen |
| genc | Genç |
| uclu | Üçlü |
| pov | POV |
| oral | Oral |

Yeni kategoriler `getOrCreateCategory()` ile otomatik oluşturulur.

---

## 16. GitHub Repo Referansı

- **Repo**: https://github.com/labvexapp-cmd/labvexapp-cmd
- **DB Şeması**: `tube-site/supabase/migrations/001_initial_schema.sql`
- **BunnyCDN Helper**: `tube-site/src/lib/bunny.ts`
- **Supabase Client**: `tube-site/src/lib/supabase/server.ts`
- **Sitemap (mevcut sayfalar)**: `tube-site/public/sitemap.xml`

---

## Özet: Yapılacaklar Listesi

1. ✅ VPS'e Node.js 20, yt-dlp, ffmpeg kur
2. ✅ `labvex-scraper` projesini oluştur
3. ✅ `.env` dosyasını doldur (Supabase service_role + BunnyCDN keys)
4. ✅ Supabase'de scrape_sources tablosuna 4 site ekle (xhamster, xvideos, eporner, erome)
5. ✅ Base scraper class + 4 site-specific scraper yaz
6. ✅ processVideoUrl() ana akışını implement et
7. ✅ CLI interface yaz (process, batch, status komutları)
8. ✅ PM2 ile daemonize et
9. ✅ Test: tek video URL ile end-to-end test yap
10. ✅ Telegram bot entegrasyonu (opsiyonel, link gönderme kolaylığı için)
