// OpenNext Cloudflare config - will be used when switching from static export to SSR
// Activate by removing `output: "export"` from next.config.ts
// and changing build command to `npx opennextjs-cloudflare build`
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
