# Shorts (Dikey Video) Sistemi - Uygulama Plani

## Konsept
TikTok/Instagram Reels tarzi dikey video deneyimi. Anasayfada shorts alani, tiklandiginda tam ekran dikey scroll feed acilir.

## Teknik Yaklasim
- **CSS scroll-snap** (ek kutuphane yok, native)
- **Intersection Observer** ile auto-play/pause
- **player.js** + BunnyCDN iframe (mevcut altyapi)
- Ek dependency YOK (tum UI zaten mevcut: Sheet, Badge, Button)

## Dosya Yapisi
```
src/
  app/
    (shorts)/
      layout.tsx                     -- Header/footer olmayan minimal layout
      shorts/
        page.tsx                     -- /shorts feed
        [slug]/page.tsx              -- /shorts/[slug] deep link
      ShortsPageClient.tsx           -- Ana client component
  components/
    shorts/
      ShortsItem.tsx                 -- Her video wrapper
      ShortsPlayer.tsx               -- BunnyCDN player (loop, muted start)
      ShortsOverlay.tsx              -- Sol alt: baslik, star, kategoriler
      ShortsSideActions.tsx          -- Sag: like, yorum, kaydet, paylas
      ShortsCommentDrawer.tsx        -- Alt sheet (mobilden yukari kayar)
      ShortsNavArrows.tsx            -- Desktop ok tusları
      ShortsProgress.tsx             -- Ince ilerleme cubugu
    home/
      ShortsPreviewScroll.tsx        -- Anasayfadaki yatay shorts seridi
```

## Gerekli CSS (globals.css)
```css
.shorts-feed {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100dvh;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  scrollbar-width: none;
}
.shorts-feed::-webkit-scrollbar { display: none; }
.shorts-item {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100dvh;
}
```

## Anasayfa Shorts Alani
- Yatay scroll strip (9:16 thumbnail'ler, 3-4 gorunur)
- Pornstarlar altinda veya trend videolar ustunde
- Hover'da play ikonu, tiklandiginda /shorts/[slug]'a yonlendirir
- Verisi: `orientation = 'vertical'` olan videolardan cekilir

## Player Ozellikleri
- Autoplay + loop + baslangicta muted (tarayici politikasi)
- Tap: play/pause
- Double-tap sol/sag: -5s/+5s (mevcut VideoPlayer pattern)
- Swipe yukari/asagi: sonraki/onceki video (scroll-snap)
- Sag ust: mute/unmute butonu

## Performans
- Ayni anda max 2 iframe (aktif + sonraki)
- Diger slotlar thumbnail placeholder
- Infinite scroll: 10'ar video, cursor-based pagination
- Keyboard: ok tuslari + ESC (desktop)

## Uygulama Siralama
1. Route group + layout + CSS
2. ShortsItem + ShortsPlayer + scroll-snap
3. ShortsOverlay + ShortsSideActions
4. Anasayfa shorts strip
5. Yorum drawer + infinite scroll
6. Polish (safe area, desktop arrows, progress bar)

## Notlar
- Full page yaklasim (modal degil) - SEO ve URL icin daha iyi
- `(shorts)` route group, `(main)` ile ayni seviyede
- Safe area handling: `env(safe-area-inset-bottom)` gerekli
- Scraper'da `orientation` field'i zaten var, dikey videolar filtrelenebilir
