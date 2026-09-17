import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['twilio'],
  // The dev badge sits exactly where the bottom tab bar does.
  devIndicators: false,
}

export default config
