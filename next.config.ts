import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages read session cookies per request; keep rendering fully dynamic.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
