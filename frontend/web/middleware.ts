import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get user role from request header (set by client)
    // Since middleware runs on edge, we can't access localStorage directly
    // We'll use a different approach: check if user is authenticated via cookie
    const authCookie = request.cookies.get('bizflow-auth')?.value;

    let userRole: string | null = null;
    if (authCookie) {
        try {
            const authData = JSON.parse(authCookie);
            userRole = authData?.state?.user?.role || null;
        } catch (e) {
            userRole = null;
        }
    }

    // Handle root-level routes that need role-based redirects
    const routeMap: Record<string, { owner: string; customer: string; guest: string }> = {
        '/pos': {
            owner: '/dashboard/pos',
            customer: '/portal/products',
            guest: '/login'
        },
        '/reports': {
            owner: '/dashboard/reports',
            customer: '/portal/orders',
            guest: '/login'
        },
        '/orders': {
            owner: '/dashboard/orders',
            customer: '/portal/orders',
            guest: '/login'
        },
        '/inventory': {
            owner: '/dashboard/inventory',
            customer: '/portal/products',
            guest: '/login'
        },
        '/debts': {
            owner: '/dashboard/debts',
            customer: '/portal/debts',
            guest: '/login'
        }
    };

    // Check if current path needs redirect
    if (routeMap[pathname]) {
        const redirects = routeMap[pathname];
        let destination: string;

        if (!userRole) {
            destination = redirects.guest;
        } else if (userRole === 'CUSTOMER') {
            destination = redirects.customer;
        } else if (userRole === 'OWNER' || userRole === 'EMPLOYEE') {
            destination = redirects.owner;
        } else if (userRole === 'ADMIN') {
            // Admin can access owner routes
            destination = redirects.owner;
        } else {
            destination = redirects.guest;
        }

        return NextResponse.redirect(new URL(destination, request.url));
    }

    return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
    matcher: [
        '/pos',
        '/reports',
        '/orders',
        '/inventory',
        '/debts'
    ]
};
