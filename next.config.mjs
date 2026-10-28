import { createRequire } from 'node:module';

/** Shared with app-creatives.ts so the allowed hosts cannot drift apart. */
const { hosts: imageHosts } = createRequire(import.meta.url)('./config/image-hosts.json');

/*
  Permanent redirects for retired URLs: blog posts held back or merged into
  another (see src/app/blog/_data/posts.ts, which never renders a source listed
  here). A true 301 rather than Next's default 308 for `permanent`: both mean
  "moved for good" to Google, but audit tools and older crawlers expect 301.
*/
const blogRedirects = createRequire(import.meta.url)('./config/redirects.json');

/* Old URL → the page that owns its search now. */
const retiredPages = {
  '/ai': '/guides',
  '/ai/ai-headshot-generator': '/ai-headshot',
  '/ai/ai-image-editor': '/ai-editor',
  '/ai/photo-editor': '/ai-editor',
  '/ai/background-changer': '/creative/background-changer',
  '/ai/photo-enhancer': '/upscale',
  '/answers': '/guides',
  '/answers/remove-background-from-photo': '/remove-bg',
  '/answers/change-background-of-product-photo': '/remove-bg/product-photos',
  '/answers/change-outfit-in-photo': '/creative/outfit-generator',
  '/answers/edit-photo-with-text-prompt': '/ai-editor',
  '/answers/enhance-blurry-photo': '/upscale',
  '/answers/make-instagram-profile-picture': '/creative/instagram-pfp-maker',
  '/answers/make-professional-headshot-from-selfie': '/creative/professional-headshot',
  '/answers/make-youtube-thumbnail-from-photo': '/creative/youtube-thumbnail-generator',
  '/answers/remove-object-from-photo': '/ai-editor/remove-object',
  '/answers/restore-old-photo': '/creative/restore-old-photos',
};

/*
  The old domain. sjpt.in has a Change of Address to www.sjpt.io running in
  Search Console, which only completes while every old URL answers with a
  permanent redirect to its new home. Removing these (and the domain) in
  September left sjpt.in answering Vercel 404s, throwing away its links and
  history. The domain must be attached to this project in Vercel for any of
  this to run.

  One hop each: a path that has itself moved goes straight to where it lives
  now, rather than to www.sjpt.io/<old path> and on from there. These come
  first, because the first matching redirect wins.
*/
const OLD_HOST = { type: 'host', value: '(www\\.)?sjpt\\.in' };
const oldDomain = [
  ...Object.entries({ ...blogRedirects, ...retiredPages }).map(([source, destination]) => ({
    source, has: [OLD_HOST], destination: `https://www.sjpt.io${destination}`, statusCode: 301,
  })),
  { source: '/:path*', has: [OLD_HOST], destination: 'https://www.sjpt.io/:path*', statusCode: 301 },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Android's Digital Asset Links check for the Play Store apps
  // (src/app/api/android/assetlinks/route.ts).
  async rewrites() {
    return [{ source: '/.well-known/assetlinks.json', destination: '/api/android/assetlinks' }];
  },
  async redirects() {
    return [
      ...oldDomain,
      // The removed video downloaders answer 410 Gone (src/middleware.ts):
      // the home page doesn't download videos, so redirecting there was a
      // soft 404.
      ...Object.entries(blogRedirects).map(([source, destination]) => ({ source, destination, statusCode: 301 })),
      // Thin ~200-word pages merged into the page that owns their search
      // (docs/seo/keyword-map.md, "Retired"): two pages chasing one phrase
      // made Google pick between them, and it ranked neither.
      ...Object.entries(retiredPages).map(([source, destination]) => ({ source, destination, statusCode: 301 })),
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
