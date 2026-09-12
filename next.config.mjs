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
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
