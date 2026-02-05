"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import apiClient from "@/lib/apiClient";

/**
 * AuthHydrator:
 * Ensures the Zustand store is in sync with the backend session on mount.
 * If token exists but no user info, it fetches /auth/me.
 */
export function AuthHydrator({ children }: { children: React.ReactNode }) {
    const { user, setUser, token, logout, isAuthenticated } = useAuthStore();

    useEffect(() => {
        const hydrate = async () => {
            const storedToken = localStorage.getItem('access_token');

            if (!storedToken) {
                if (isAuthenticated) logout();
                return;
            }

            try {
                const response = await apiClient.get('/auth/me');
                setUser(response.data);
            } catch (error: any) {
                console.error("Failed to hydrate auth:", error);
                // If 401, apiClient interceptor will handle logout
            }
        };

        hydrate();
    }, [setUser, logout, isAuthenticated]);

    return <>{children}</>;
}
