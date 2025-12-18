import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 1. Định nghĩa các route công khai
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Allow Inngest webhook endpoint to be called without Clerk auth
  const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
  if (pathname.startsWith('/api/inngest')) return;

  // 2. Kiểm tra nếu không phải route công khai thì bảo vệ
  if (!isPublicRoute(request)) {
    // SỬA TẠI ĐÂY: auth ở đây là object, sử dụng auth.protect() trực tiếp
    await auth.protect(); 
  }
});

export const config = {
  matcher: [
    // Bỏ qua các file tĩnh và nội bộ của Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Luôn chạy cho các API routes
    '/(api|trpc)(.*)',
  ],
};