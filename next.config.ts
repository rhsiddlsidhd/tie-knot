import type { NextConfig } from "next";

module.exports = () => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig: NextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "res.cloudinary.com",
          pathname: "/**",
        },
      ],
    },
  };

  return nextConfig;
};
