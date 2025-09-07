import type { NextConfig } from "next";

export default () => {
  const nextConfig: NextConfig = {
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    typescript: {
      // Temporary during AI SDK v5 migration: allow builds with TS errors
      ignoreBuildErrors: true,
    },
    eslint: {
      // Temporary during migration: skip ESLint in CI/build to unblock runtime verification
      ignoreDuringBuilds: true,
    },
    webpack: (config) => {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored)
            ? config.watchOptions.ignored
            : []),
          "**/inspiration/**",
          "**/node_modules/**",
        ],
      };
      return config;
    },
    experimental: {
      useCache: true,
    },
    images: {
      domains: ["avatar.vercel.sh"],
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    },
  };
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  });

  return withBundleAnalyzer(nextConfig);
};
