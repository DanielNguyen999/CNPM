/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/pos', destination: '/dashboard/pos', permanent: true },
      { source: '/inventory', destination: '/dashboard/inventory', permanent: true },
      { source: '/orders', destination: '/dashboard/orders', permanent: true },
      { source: '/customers', destination: '/dashboard/customers', permanent: true },
      { source: '/debts', destination: '/dashboard/debts', permanent: true },
      { source: '/reports', destination: '/dashboard/reports', permanent: true },
    ];
  },
};

export default nextConfig;
