/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Replicate
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' },
      { protocol: 'https', hostname: '**.replicate.com' },
      // Mahwous
      { protocol: 'https', hostname: '**.mahwous.com' },
      { protocol: 'https', hostname: '**.cdn.shopify.com' },
      // Fal.ai
      { protocol: 'https', hostname: 'v3.fal.media' },
      { protocol: 'https', hostname: 'v3b.fal.media' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: '**.fal.media' },
      { protocol: 'https', hostname: '**.fal.run' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      // Image upload providers
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: '**.ibb.co' },
      { protocol: 'https', hostname: 'ibb.co' },
      { protocol: 'https', hostname: 'freeimage.host' },
      { protocol: 'https', hostname: '**.freeimage.host' },
      { protocol: 'https', hostname: 'files.catbox.moe' },
      { protocol: 'https', hostname: 'catbox.moe' },
      // CDN providers
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.imgix.net' },
      // Allow all HTTPS for generated images
      { protocol: 'https', hostname: '**' },
    ],
    // Allow unoptimized images from external sources
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
};

module.exports = nextConfig;
