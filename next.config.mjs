/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  // GitHub Pages serves the site from a subpath if the repo name is not <username>.github.io.
  // Set NEXT_PUBLIC_BASE_PATH env var when deploying to a project page, e.g. "/MultiRoleSaas".
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
};

export default nextConfig;