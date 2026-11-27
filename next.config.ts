import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      // The timelines open on the books tab.
      { source: "/timelines", destination: "/timelines/books", permanent: false },
      // The book log used to live at /books.
      { source: "/books", destination: "/timelines/books", permanent: true },
    ];
  },
};

export default nextConfig;
