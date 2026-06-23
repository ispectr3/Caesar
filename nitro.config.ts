import { defineNitroConfig } from 'nitro';

export default defineNitroConfig({
  preset: "cloudflare-pages",
  alias: {
    'node:stream/web': './stream-web-mock.js'
  }
});
