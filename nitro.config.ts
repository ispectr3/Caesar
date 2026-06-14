import { defineNitroConfig } from 'nitro';

export default defineNitroConfig({
  alias: {
    'node:stream/web': './stream-web-mock.js'
  }
});
