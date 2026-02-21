const TRACK_URL = "/api/track";

/** Video ilk oynatıldığında çağır (1 kez) */
export function trackView(videoId: string) {
  fetch(TRACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "view", videoId }),
    keepalive: true,
  }).catch(() => {});
}

/** İzleme süresi eşik geçildiğinde çağır (%25, %50, %75, %100) */
export function trackWatch(
  videoId: string,
  duration: number,
  percentage: number
) {
  fetch(TRACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "watch", videoId, duration, percentage }),
    keepalive: true,
  }).catch(() => {});
}
