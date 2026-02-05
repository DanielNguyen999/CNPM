"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthToastListener } from "@/components/auth-toast-listener";
import { AuthHydrator } from "@/components/auth-hydrator";
import { SSEProvider } from "@/components/sse-provider";

/**
 * Global Providers for BizFlow Web
 * - React Query Client Provider
 * - Toast Provider (if added later)
 */

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30000, // 30 seconds
                gcTime: 300000, // 5 minutes (formerly cacheTime)
                retry: 1,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthHydrator>
                <SSEProvider>
                    {children}
                </SSEProvider>
            </AuthHydrator>
            <Toaster />
            <AuthToastListener />
        </QueryClientProvider>
    );
}
