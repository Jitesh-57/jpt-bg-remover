/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Removed video tools (free resolvers couldn't reliably download).
      // 301 to the home page so old sitemap/crawled URLs don't 404.
      { source: '/instagram-video-downloader', destination: '/', permanent: true },
      { source: '/youtube-video-downloader', destination: '/', permanent: true },
      // The home page already renders the upscaler (identical content), so
      // Google flagged /upscale as a duplicate and chose / as canonical. 301
      // /upscale → / to consolidate signals onto one page. Exact match only —
      // the /upscale/<variant> landing pages (e.g. /upscale/4k) are untouched.
      { source: '/upscale', destination: '/', permanent: true },
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
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
