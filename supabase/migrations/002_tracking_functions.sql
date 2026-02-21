-- ============================================
-- TRACKING FUNCTIONS (SECURITY DEFINER)
-- Anon key ile çağrılabilir, RLS bypass eder
-- ============================================

-- View count artır (her izlemede 1 artar)
CREATE OR REPLACE FUNCTION increment_view_count(p_video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET view_count = view_count + 1 WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View kaydı + watch stats (insert or update)
CREATE OR REPLACE FUNCTION record_video_view(
    p_video_id UUID,
    p_watch_duration INT DEFAULT 0,
    p_watch_percentage FLOAT DEFAULT 0,
    p_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- İlk kez bugün izliyor: insert
    INSERT INTO user_views (video_id, user_id, watch_duration, watch_percentage, ip_address, user_agent)
    VALUES (p_video_id, NULL, p_watch_duration, p_watch_percentage, p_ip::INET, p_user_agent);
EXCEPTION WHEN unique_violation THEN
    -- Bugün zaten izlemiş: watch_duration/percentage güncelle (en yüksek değer)
    UPDATE user_views
    SET watch_duration = GREATEST(watch_duration, p_watch_duration),
        watch_percentage = GREATEST(watch_percentage, p_watch_percentage)
    WHERE video_id = p_video_id
        AND user_id IS NULL
        AND date_utc(created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
