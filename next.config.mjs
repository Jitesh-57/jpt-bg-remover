/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Removed video tools (free resolvers couldn't reliably download).
      // 301 to the home page so old sitemap/crawled URLs don't 404.
      { source: '/instagram-video-downloader', destination: '/', permanent: true },
      { source: '/youtube-video-downloader', destination: '/', permanent: true },
      // /upscale is its own landing page again — the homepage now has its own
      // identity, so there is no duplicate to consolidate.
    ];
  },
  webpack: (config) => {
    // onnxruntime-web ships .mjs files with import.meta.url — tell webpack to
    // treat them as proper ES modules instead of trying to parse as CommonJS.
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
  /*
    Image optimisation for the Supabase bucket.

    The generated creatives are full-size PNGs — 1 to 2 MB each — and the
    homepage shows eleven of them, so a cold refresh was pulling something
    like fifteen megabytes before a single card could paint. Routing them
    through Next's optimiser resizes each one to the size it is actually
    displayed at and re-encodes as AVIF or WebP, which is roughly a
    twenty-to-fiftyfold reduction, and the result is cached at the edge.
  */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lwworujvfttxkrjfrgav.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    // A year: these files are content-addressed by name and replaced wholesale
    // rather than edited, so there is nothing to invalidate early.
    minimumCacheTTL: 31536000,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
