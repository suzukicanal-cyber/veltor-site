/** @type {import('next').NextConfig} */
// Static export: `next build` puts the whole site into out/, nginx serves it (see deploy/).
// Leave NEXT_PUBLIC_BASE_PATH empty when the site lives at the root of its domain.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  // ESLint is not part of this project; type checking still runs during `next build`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
