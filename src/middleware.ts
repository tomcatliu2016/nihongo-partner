import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match all paths except:
  // - API routes (/api/...)
  // - Static files (_next, favicon, etc.)
  // - Public assets (images, etc.)
  matcher: [
    '/',
    '/(zh|ja|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
