import { createRequire } from 'node:module';

/** Shared with app-creatives.ts so the allowed hosts cannot drift apart. */
const { hosts: imageHosts } = createRequire(import.meta.url)('./config/image-hosts.json');

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
    /*
      Built from config/image-hosts.json so this list and the runtime filter in
      app-creatives.ts cannot drift apart. A URL next/image has not been told
      about does not fail softly — it throws during render and takes the page
      with it, which is a poor way to find out about a typo in an env var.

      Why these are here at all: the prompt library's result images were plain
      <img> pointing at the source CDN and arrived blank in production, every
      one. Going through the optimiser fixes that as a side effect of how it
      works — the fetch happens server-side, so nothing about the browser's
      referer or origin is involved, and what reaches the page is a resized
      AVIF/WebP from our own domain. They are 1-3MB press JPEGs and a grid
      shows 24, so the re-encode earns its place regardless.
    */
    remotePatterns: imageHosts.map((h) => ({ protocol: 'https', ...h })),
    formats: ['image/avif', 'image/webp'],
    // A year: these files are content-addressed by name and replaced wholesale
    // rather than edited, so there is nothing to invalidate early.
    minimumCacheTTL: 31536000,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    /*
      The migration route reads its SQL from disk at runtime, and the path is
      built with path.join — which the bundler cannot follow, so the .sql files
      would be left out of the serverless function and the route would fail on
      Vercel while working locally. This says to ship them.
    */
    outputFileTracingIncludes: {
      '/api/admin/migrate': ['./supabase/migrations/**'],
    },
  },
};

export default nextConfig;
