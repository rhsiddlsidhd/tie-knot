import type { NextConfig } from "next";

module.exports = () => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig: NextConfig = {
    images: {
      loader: "custom",
      loaderFile: "./image-loader.ts",
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
