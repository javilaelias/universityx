export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/profile/:path*', '/tickets/:path*'],
};
