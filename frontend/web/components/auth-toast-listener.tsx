"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export function AuthToastListener() {
    const { toast } = useToast();

    useEffect(() => {
        const handleAuthError = (event: Event) => {
            const customEvent = event as CustomEvent;
            toast({
                variant: "destructive",
                title: "Lỗi xác thực",
                description: customEvent.detail?.message || "Phiên làm việc hết hạn",
            });
        };

        window.addEventListener("bizflow:auth-error", handleAuthError);
        return () => window.removeEventListener("bizflow:auth-error", handleAuthError);
    }, [toast]);

    return null;
}
