import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The API lives in the sibling Express app; vault/ is a pure client of it.
  // Nothing is proxied — requests go straight to NEXT_PUBLIC_API_URL with
  // credentials, and CORS on the backend allows this origin.
};

export default nextConfig;
