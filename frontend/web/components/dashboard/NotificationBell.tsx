"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const { data: notifications, refetch } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const { data } = await apiClient.get("/notifications");
            return data;
        },
        refetchInterval: 5000, // Cập nhật mỗi 5 giây (Realtime)
    });

    const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: number) => {
        await apiClient.post(`/notifications/${id}/read`);
        refetch();
    };

    const markAllAsRead = async () => {
        await apiClient.post("/notifications/read-all");
        refetch();
    };

    return (
        <div className="relative" ref={bellRef}>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "text-slate-500 relative hover:bg-slate-100 rounded-full h-10 w-10",
                    unreadCount > 0 && "animate-[wiggle_1s_ease-in-out_infinite]"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-indigo-600")} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">Thông báo từ Admin</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {notifications && notifications.length > 0 ? (
                            notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "px-4 py-3 border-b border-slate-50 last:border-0 transition-colors cursor-pointer",
                                        !n.is_read ? "bg-indigo-50/40" : "hover:bg-slate-50"
                                    )}
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={cn("text-xs font-bold leading-tight", !n.is_read ? "text-slate-900" : "text-slate-500")}>
                                            {n.title}
                                        </p>
                                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                        {new Date(n.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <Bell className="h-8 w-8 mx-auto opacity-10 mb-2" />
                                <p className="text-xs font-medium">Không có thông báo mới</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
