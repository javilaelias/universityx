/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
};

export default config;
