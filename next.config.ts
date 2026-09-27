import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Keep serverless functions small so Vercel can group them (Hobby: 12 functions max).
  // Production uses DATABASE_URL, so the embedded PGlite engine and local data are never needed there.
  outputFileTracingExcludes: {
    "*": ["./data/**", "./node_modules/@electric-sql/**", "./docs/**", "./refernce files/**", "./.playwright-mcp/**", "./scripts/**"],
  },
};

export default nextConfig;
