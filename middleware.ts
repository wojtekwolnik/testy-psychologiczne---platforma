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

    if (!isAdminRoute && !isTherapistRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const role = payload.role as string;

        if (isAdminRoute && role !== 'admin') {
            // Therapist trying to access admin
            return NextResponse.redirect(new URL('/therapist/dashboard', request.url));
        }

        if (isTherapistRoute && role !== 'therapist' && role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Token is invalid or expired
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/admin/:path*', '/therapist/:path*'],
};
