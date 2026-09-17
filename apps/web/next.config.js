import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..") },
  async rewrites() {
    const backend = (process.env.HTTP_BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: backend + "/:path*" }];
  },
  transpilePackages: ["@repo/ui"],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com', // Added this for fallback avatars
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;