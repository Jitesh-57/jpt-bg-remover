/** @type {import('next').NextConfig} */
const nextConfig = {
  // 301 redirect any sjpt.in traffic that reaches this deployment to sjpt.io
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'sjpt.in' }],
        destination: 'https://www.sjpt.io/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sjpt.in' }],
        destination: 'https://www.sjpt.io/:path*',
        permanent: true,
      },
      // Removed video tools (free resolvers couldn't reliably download).
      // 301 to the home page so old sitemap/crawled URLs don't 404.
      { source: '/instagram-video-downloader', destination: '/', permanent: true },
      { source: '/youtube-video-downloader', destination: '/', permanent: true },
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
