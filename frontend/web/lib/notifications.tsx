import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import React from "react";

/**
 * Hệ thống Notification tiếng Việt (WOW Aesthetics) ported từ pattern CNPM-1.
 */
export const notifications = {
    success: (title: string, description?: string) => {
        return toast({
            title: (
                <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-bold">{title}</span>
                </div>
            ) as any,
            description: description,
            variant: "default",
            className: "border-emerald-100 bg-emerald-50 shadow-lg shadow-emerald-100/50",
        });
    },

    error: (title: string, description?: string) => {
        return toast({
            title: (
                <div className="flex items-center gap-2 text-rose-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-bold">{title}</span>
                </div>
            ) as any,
            description: description,
            variant: "destructive",
            className: "shadow-lg shadow-rose-100/50",
        });
    },

    warning: (title: string, description?: string) => {
        return toast({
            title: (
                <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-bold">{title}</span>
                </div>
            ) as any,
            description: description,
            className: "border-amber-100 bg-amber-50 shadow-lg shadow-amber-100/50",
        });
    },

    info: (title: string, description?: string) => {
        return toast({
            title: (
                <div className="flex items-center gap-2 text-indigo-600">
                    <Info className="h-5 w-5" />
                    <span className="font-bold">{title}</span>
                </div>
            ) as any,
            description: description,
            className: "border-indigo-100 bg-indigo-50 shadow-lg shadow-indigo-100/50",
        });
    }
};
