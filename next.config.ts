module.exports = {
  allowedDevOrigins: ["127.0.0.1"],
}

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/app/groups',
        destination: '/app',
        permanent: true,
      },
    ]
  },
}

export default nextConfig