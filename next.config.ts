import type { NextConfig } from "next";

const cloudinaryHostname = process.env.NEXT_PUBLIC_CLOUDINARY_HOSTNAME;
const backendMediaHostname = process.env.NEXT_PUBLIC_BACKEND_MEDIA_HOSTNAME;
const backendMediaPort = process.env.NEXT_PUBLIC_BACKEND_MEDIA_PORT;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      ...(cloudinaryHostname
        ? [
            {
              protocol: "https" as const,
              hostname: cloudinaryHostname,
            },
          ]
        : []),
      ...(backendMediaHostname && backendMediaPort
        ? [
            {
              protocol: "http" as const,
              hostname: backendMediaHostname,
              port: backendMediaPort,
            },
          ]
        : []),
      // Allow any https hostname for production backend images
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
