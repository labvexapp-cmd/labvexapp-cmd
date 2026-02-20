-- ============================================
-- LABVEX - Complete Database Schema
-- Supabase PostgreSQL + pgvector
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Trigram for fuzzy text search

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE video_status AS ENUM ('draft', 'processing', 'published', 'disabled', 'dmca_removed');
CREATE TYPE video_orientation AS ENUM ('horizontal', 'vertical', 'square');
CREATE TYPE video_type AS ENUM ('long', 'short');  -- uzun video vs shorts
CREATE TYPE quality_label AS ENUM ('240p', '360p', '480p', '720p', '1080p', '1440p', '4K');
CREATE TYPE subtitle_format AS ENUM ('vtt', 'srt', 'ass');
CREATE TYPE report_reason AS ENUM ('illegal', 'underage', 'non_consensual', 'copyright', 'spam', 'other');
CREATE TYPE scrape_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- ============================================
-- 1. CATEGORIES
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url TEXT,
    icon VARCHAR(50),                    -- lucide icon name
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,  -- alt kategoriler
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    video_count INT DEFAULT 0,           -- denormalized counter
    translations JSONB DEFAULT '{}',     -- {"en": {"name": "Amateur", "description": "..."}}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;

-- ============================================
-- 2. TAGS
-- ============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    video_count INT DEFAULT 0,
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name_trgm ON tags USING gin(name gin_trgm_ops);  -- fuzzy search

-- ============================================
-- 3. STARS (Performers)
-- ============================================
CREATE TABLE stars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    birth_date DATE,
    nationality VARCHAR(50),
    ethnicity VARCHAR(50),
    measurements JSONB,                  -- {"height": "165cm", "weight": "52kg", ...}
    social_media JSONB DEFAULT '{}',     -- {"instagram": "...", "twitter": "..."}
    aliases TEXT[],                       -- alternatif isimler
    video_count INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    follower_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stars_slug ON stars(slug);
CREATE INDEX idx_stars_name_trgm ON stars USING gin(name gin_trgm_ops);
CREATE INDEX idx_stars_active ON stars(is_active) WHERE is_active = true;

-- ============================================
-- 4. VIDEOS (Ana tablo)
-- ============================================
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,

    -- Video metadata
    duration INT NOT NULL DEFAULT 0,           -- seconds
    orientation video_orientation DEFAULT 'horizontal',
    video_type video_type DEFAULT 'long',      -- long vs short

    -- BunnyCDN integration
    bunny_video_id VARCHAR(100),               -- BunnyCDN Stream video GUID
    video_url TEXT,                             -- HLS stream URL (m3u8)
    thumbnail_url TEXT,                         -- Ana thumbnail
    preview_url TEXT,                           -- Animated preview (gif/webm)

    -- Quality & technical
    original_quality quality_label,
    max_quality quality_label,
    fps INT,
    file_size BIGINT,                          -- bytes
    codec VARCHAR(20),

    -- Stats (denormalized for performance)
    view_count BIGINT DEFAULT 0,
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,

    -- SEO
    meta_title VARCHAR(500),
    meta_description VARCHAR(1000),
    seo_keywords TEXT[],

    -- Status & moderation
    status video_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,

    -- Source tracking (scraping)
    source_url TEXT,                            -- orijinal video URL
    source_site VARCHAR(100),                  -- kaynak site adı
    source_video_id VARCHAR(200),              -- kaynaktaki video ID

    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_slug ON videos(slug);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_type ON videos(video_type);
CREATE INDEX idx_videos_orientation ON videos(orientation);
CREATE INDEX idx_videos_published ON videos(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_videos_views ON videos(view_count DESC) WHERE status = 'published';
CREATE INDEX idx_videos_likes ON videos(like_count DESC) WHERE status = 'published';
CREATE INDEX idx_videos_featured ON videos(is_featured) WHERE is_featured = true;
CREATE INDEX idx_videos_bunny ON videos(bunny_video_id);
CREATE INDEX idx_videos_source ON videos(source_url);
CREATE INDEX idx_videos_title_trgm ON videos USING gin(title gin_trgm_ops);

-- ============================================
-- 5. VIDEO QUALITIES (çoklu kalite)
-- ============================================
CREATE TABLE video_qualities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    quality quality_label NOT NULL,
    stream_url TEXT NOT NULL,                   -- HLS URL for this quality
    file_size BIGINT,
    bitrate INT,                               -- kbps
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, quality)
);

CREATE INDEX idx_video_qualities_video ON video_qualities(video_id);

-- ============================================
-- 6. VIDEO THUMBNAILS (çoklu thumbnail)
-- ============================================
CREATE TABLE video_thumbnails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    width INT,
    height INT,
    timestamp_sec FLOAT,                       -- video'nun kaçıncı saniyesinden
    is_primary BOOLEAN DEFAULT false,
    is_animated BOOLEAN DEFAULT false,         -- gif/webm preview
    sprite_url TEXT,                            -- VTT sprite sheet (seek preview)
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_thumbnails_video ON video_thumbnails(video_id);

-- ============================================
-- 7. VIDEO SCENES (Sahne önizleme - eporner tarzı)
-- ============================================
CREATE TABLE video_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    scene_number INT NOT NULL,                 -- 1, 2, 3... (sıra)
    timestamp_start INT NOT NULL,              -- başlangıç saniyesi
    timestamp_end INT,                         -- bitiş saniyesi
    thumbnail_url TEXT NOT NULL,               -- sahne fotoğrafı
    title VARCHAR(200),                        -- sahne açıklaması (opsiyonel)
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, scene_number)
);

CREATE INDEX idx_video_scenes_video ON video_scenes(video_id);

-- ============================================
-- 8. VIDEO CHAPTERS (Bölümler / timeline markers)
-- ============================================
CREATE TABLE video_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    timestamp_sec INT NOT NULL,                -- kaçıncı saniye
    thumbnail_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_chapters_video ON video_chapters(video_id);

-- ============================================
-- 9. VIDEO SUBTITLES (Altyazılar)
-- ============================================
CREATE TABLE video_subtitles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,             -- 'tr', 'en', 'de', etc.
    label VARCHAR(50) NOT NULL,                -- 'Türkçe', 'English'
    format subtitle_format DEFAULT 'vtt',
    file_url TEXT NOT NULL,                    -- .vtt dosya URL'si
    is_auto_generated BOOLEAN DEFAULT false,   -- AI tarafından mı oluşturuldu
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, language)
);

CREATE INDEX idx_video_subtitles_video ON video_subtitles(video_id);

-- ============================================
-- 10. VIDEO EMBEDDINGS (pgvector - semantik arama)
-- ============================================
CREATE TABLE video_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE UNIQUE,
    embedding vector(1536),                    -- OpenAI ada-002 dimension
    model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    content_hash VARCHAR(64),                  -- değişiklik algılama
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_embeddings_vector ON video_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 11. RELATIONSHIP TABLES
-- ============================================

-- Video ↔ Category (many-to-many)
CREATE TABLE video_categories (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (video_id, category_id)
);

CREATE INDEX idx_vc_video ON video_categories(video_id);
CREATE INDEX idx_vc_category ON video_categories(category_id);

-- Video ↔ Tag (many-to-many)
CREATE TABLE video_tags (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, tag_id)
);

CREATE INDEX idx_vt_video ON video_tags(video_id);
CREATE INDEX idx_vt_tag ON video_tags(tag_id);

-- Video ↔ Star (many-to-many, with role)
CREATE TABLE video_stars (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    star_id UUID NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
    role VARCHAR(50),                          -- 'performer', 'director', etc.
    sort_order INT DEFAULT 0,
    PRIMARY KEY (video_id, star_id)
);

CREATE INDEX idx_vs_video ON video_stars(video_id);
CREATE INDEX idx_vs_star ON video_stars(star_id);

-- ============================================
-- 12. USER PROFILES
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    language VARCHAR(10) DEFAULT 'tr',
    country VARCHAR(50),

    -- Preferences
    preferred_quality quality_label DEFAULT '1080p',
    autoplay BOOLEAN DEFAULT true,
    show_shorts BOOLEAN DEFAULT true,

    -- Stats
    total_watch_time BIGINT DEFAULT 0,         -- seconds
    video_count INT DEFAULT 0,                 -- uploaded videos
    comment_count INT DEFAULT 0,
    like_count INT DEFAULT 0,

    -- Account
    is_premium BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================
-- 13. USER VIEWS (İzleme geçmişi)
-- ============================================
CREATE TABLE user_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watch_duration INT DEFAULT 0,              -- ne kadar izledi (seconds)
    watch_percentage FLOAT DEFAULT 0,          -- %0-100
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_views_user ON user_views(user_id);
CREATE INDEX idx_user_views_video ON user_views(video_id);
CREATE INDEX idx_user_views_created ON user_views(created_at DESC);

-- Unique view counting (same user/IP per day)
CREATE UNIQUE INDEX idx_user_views_unique_daily
    ON user_views(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), video_id, DATE(created_at));

-- ============================================
-- 14. USER LIKES
-- ============================================
CREATE TABLE user_likes (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL,                  -- true = like, false = dislike
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_user_likes_video ON user_likes(video_id);

-- ============================================
-- 15. USER FAVORITES (Kaydedilenler)
-- ============================================
CREATE TABLE user_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, created_at DESC);

-- ============================================
-- 16. USER SUBSCRIPTIONS (Star takip)
-- ============================================
CREATE TABLE user_subscriptions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    star_id UUID NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, star_id)
);

CREATE INDEX idx_user_subs_star ON user_subscriptions(star_id);

-- ============================================
-- 17. COMMENTS
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- nested replies
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    ai_persona VARCHAR(100),                   -- AI yorum için karakter adı
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_video ON comments(video_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ============================================
-- 18. SCRAPE SOURCES (Kaynak site konfigürasyonu)
-- ============================================
CREATE TABLE scrape_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,                -- 'eporner', 'xhamster', etc.
    base_url TEXT NOT NULL,                    -- 'https://www.eporner.com'
    is_active BOOLEAN DEFAULT true,

    -- Authentication
    requires_auth BOOLEAN DEFAULT false,
    auth_cookies JSONB,                        -- encrypted cookie data
    auth_headers JSONB,                        -- custom headers

    -- Scraping config
    player_type VARCHAR(50),                   -- 'hls', 'dash', 'mp4', 'iframe'
    selectors JSONB,                           -- CSS/XPath selectors for scraping
    rate_limit_ms INT DEFAULT 2000,            -- ms between requests
    max_concurrent INT DEFAULT 1,
    user_agent TEXT,
    proxy_required BOOLEAN DEFAULT false,

    -- Stats
    total_scraped INT DEFAULT 0,
    last_scrape_at TIMESTAMPTZ,
    last_error TEXT,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. SCRAPE JOBS (İşlem logları)
-- ============================================
CREATE TABLE scrape_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES scrape_sources(id) ON DELETE CASCADE,

    status scrape_status DEFAULT 'pending',
    job_type VARCHAR(50) DEFAULT 'video',      -- 'video', 'category', 'star', 'search'

    -- Target
    target_url TEXT,                            -- scrape edilen URL
    target_page INT,                           -- sayfa numarası

    -- Results
    videos_found INT DEFAULT 0,
    videos_new INT DEFAULT 0,                  -- yeni eklenen
    videos_skipped INT DEFAULT 0,              -- zaten var olan
    videos_failed INT DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INT,                           -- işlem süresi

    -- Error tracking
    error_message TEXT,
    error_stack TEXT,
    retry_count INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- ============================================
-- 20. SCRAPE RAW DATA (Ham çekilen veri)
-- ============================================
CREATE TABLE scrape_raw_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES scrape_jobs(id) ON DELETE SET NULL,
    source_id UUID NOT NULL REFERENCES scrape_sources(id) ON DELETE CASCADE,

    -- Orijinal bilgiler (kaynaktan birebir)
    source_url TEXT NOT NULL UNIQUE,           -- orijinal video URL
    source_video_id VARCHAR(200),              -- kaynaktaki ID

    original_title TEXT,
    original_description TEXT,
    original_tags TEXT[],
    original_categories TEXT[],
    original_stars TEXT[],
    original_duration INT,
    original_quality VARCHAR(20),
    original_thumbnail_url TEXT,
    original_video_urls JSONB,                 -- {"720p": "url", "1080p": "url", ...}
    original_view_count BIGINT,
    original_like_count INT,
    original_upload_date TIMESTAMPTZ,

    -- Scrape metadata
    page_html_hash VARCHAR(64),                -- sayfa değişiklik algılama
    raw_metadata JSONB,                        -- tüm ham veri (her şey)

    -- Processing status
    is_processed BOOLEAN DEFAULT false,        -- video tablosuna aktarıldı mı
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,  -- eşleşen video
    is_downloaded BOOLEAN DEFAULT false,       -- video dosyası indirildi mi
    is_uploaded BOOLEAN DEFAULT false,         -- BunnyCDN'e yüklendi mi

    -- File info
    downloaded_file_path TEXT,
    downloaded_file_size BIGINT,
    downloaded_file_hash VARCHAR(64),          -- duplicate detection

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scrape_raw_source_url ON scrape_raw_data(source_url);
CREATE INDEX idx_scrape_raw_source ON scrape_raw_data(source_id);
CREATE INDEX idx_scrape_raw_processed ON scrape_raw_data(is_processed) WHERE is_processed = false;
CREATE INDEX idx_scrape_raw_video ON scrape_raw_data(video_id);
CREATE INDEX idx_scrape_raw_hash ON scrape_raw_data(downloaded_file_hash);

-- ============================================
-- 21. REPORTS & DMCA
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason report_reason NOT NULL,
    details TEXT,
    reporter_email VARCHAR(255),
    reporter_ip INET,
    is_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_video ON reports(video_id);
CREATE INDEX idx_reports_unresolved ON reports(is_resolved) WHERE is_resolved = false;

CREATE TABLE dmca_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    complainant_name VARCHAR(200) NOT NULL,
    complainant_email VARCHAR(255) NOT NULL,
    original_url TEXT,
    description TEXT NOT NULL,
    is_valid BOOLEAN,
    action_taken TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 22. SITE SETTINGS (Genel ayarlar)
-- ============================================
CREATE TABLE site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO site_settings (key, value, description) VALUES
    ('site_name', '"LabVex"', 'Site adı'),
    ('default_language', '"tr"', 'Varsayılan dil'),
    ('videos_per_page', '24', 'Sayfa başına video'),
    ('comments_per_page', '20', 'Sayfa başına yorum'),
    ('max_upload_size_mb', '5000', 'Maks yükleme boyutu (MB)'),
    ('allowed_qualities', '["720p", "1080p", "4K"]', 'İzin verilen kaliteler'),
    ('ai_comments_enabled', 'true', 'AI yorum üretimi aktif mi'),
    ('scraping_enabled', 'true', 'Scraping aktif mi');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER tr_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_stars_updated BEFORE UPDATE ON stars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_videos_updated BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_comments_updated BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_scrape_sources_updated BEFORE UPDATE ON scrape_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_scrape_raw_updated BEFORE UPDATE ON scrape_raw_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment view count function (called from app)
CREATE OR REPLACE FUNCTION increment_view_count(p_video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET view_count = view_count + 1 WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql;

-- Semantic search function using pgvector
CREATE OR REPLACE FUNCTION search_videos_by_embedding(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    slug VARCHAR(500),
    thumbnail_url TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.title,
        v.slug,
        v.thumbnail_url,
        1 - (ve.embedding <=> query_embedding) AS similarity
    FROM video_embeddings ve
    JOIN videos v ON v.id = ve.video_id
    WHERE v.status = 'published'
        AND 1 - (ve.embedding <=> query_embedding) > match_threshold
    ORDER BY ve.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can view published videos" ON videos
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view tags" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Public can view active stars" ON stars
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view visible comments" ON comments
    FOR SELECT USING (is_hidden = false);

-- Authenticated user policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own views" ON user_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own history" ON user_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own likes" ON user_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can submit reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Service role has full access (for scraping, admin operations)
-- This is handled by Supabase service_role key automatically
