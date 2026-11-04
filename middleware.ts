import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'auth_token';
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only');

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define protected routes
    const isAdminRoute = path.startsWith('/admin');
    const isTherapistRoute = path.startsWith('/therapist');
    const isReportRoute = path.startsWith('/report');

    if (!isAdminRoute && !isTherapistRoute && !isReportRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        if (isReportRoute || isTherapistRoute || isAdminRoute) {
            loginUrl.searchParams.set('callbackUrl', path);
        }
        return NextResponse.redirect(loginUrl);
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const role = payload.role as string;

        if (isAdminRoute && role !== 'admin') {
            // Therapist trying to access admin
            return NextResponse.redirect(new URL('/therapist/dashboard', request.url));
        }

        if ((isTherapistRoute || isReportRoute) && role !== 'therapist' && role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Token is invalid or expired
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', path);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: ['/admin/:path*', '/therapist/:path*', '/therapist-docs', '/report/:path*'],
};
