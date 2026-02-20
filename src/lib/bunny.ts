// BunnyCDN Stream API helper
const BUNNY_STREAM_API = "https://video.bunnycdn.com/library";
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID!;
const API_KEY = process.env.BUNNY_STREAM_API_KEY!;
const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_CDN_URL!;

interface BunnyVideo {
  guid: string;
  title: string;
  status: number; // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
  length: number; // duration in seconds
  width: number;
  height: number;
  thumbnailFileName: string;
  storageSize: number;
}

// Get video stream URL (HLS)
export function getStreamUrl(videoId: string): string {
  return `${CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
}

// Get video thumbnail URL
export function getThumbnailUrl(
  videoId: string,
  fileName?: string
): string {
  return `${CDN_HOSTNAME}/${videoId}/${fileName || "thumbnail.jpg"}`;
}

// Get video preview (animated thumbnail)
export function getPreviewUrl(videoId: string): string {
  return `${CDN_HOSTNAME}/${videoId}/preview.webp`;
}

// Get scene thumbnails (for timeline preview)
export function getSceneThumbnailUrl(
  videoId: string,
  index: number
): string {
  return `${CDN_HOSTNAME}/${videoId}/thumbnail_${index}.jpg`;
}

// API: List videos in library
export async function listVideos(
  page = 1,
  perPage = 100
): Promise<{ items: BunnyVideo[]; totalItems: number }> {
  const res = await fetch(
    `${BUNNY_STREAM_API}/${LIBRARY_ID}/videos?page=${page}&itemsPerPage=${perPage}`,
    {
      headers: { AccessKey: API_KEY },
    }
  );
  if (!res.ok) throw new Error(`BunnyCDN error: ${res.status}`);
  return res.json();
}

// API: Get single video info
export async function getVideo(videoId: string): Promise<BunnyVideo> {
  const res = await fetch(
    `${BUNNY_STREAM_API}/${LIBRARY_ID}/videos/${videoId}`,
    {
      headers: { AccessKey: API_KEY },
    }
  );
  if (!res.ok) throw new Error(`BunnyCDN error: ${res.status}`);
  return res.json();
}

// API: Create video (get upload URL)
export async function createVideo(title: string): Promise<BunnyVideo> {
  const res = await fetch(
    `${BUNNY_STREAM_API}/${LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  );
  if (!res.ok) throw new Error(`BunnyCDN error: ${res.status}`);
  return res.json();
}

// API: Upload video file
export async function uploadVideo(
  videoId: string,
  fileData: Blob
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${BUNNY_STREAM_API}/${LIBRARY_ID}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: fileData,
    }
  );
  if (!res.ok) throw new Error(`BunnyCDN upload error: ${res.status}`);
  return res.json();
}

// API: Delete video
export async function deleteVideo(videoId: string): Promise<void> {
  const res = await fetch(
    `${BUNNY_STREAM_API}/${LIBRARY_ID}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: { AccessKey: API_KEY },
    }
  );
  if (!res.ok) throw new Error(`BunnyCDN delete error: ${res.status}`);
}
