/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  env: {
    // Dynamically set NEXTAUTH_URL for Netlify preview deployments
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
