"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Building2,
    Settings,
    LogOut,
    Menu,
    Command,
    ShieldCheck,
    Bell,
    FileBarChart,
    Sliders,
    Megaphone,
    ShieldAlert
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const adminItems = [
    {
        title: "Tổng quan",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Chủ doanh nghiệp",
        href: "/admin/owners",
        icon: Building2,
    },
    {
        title: "Yêu cầu mật khẩu",
        href: "/admin/password-requests",
        icon: ShieldAlert,
    },
    {
        title: "Người dùng",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Gói dịch vụ",
        href: "/admin/plans",
        icon: Settings,
    },
    {
        title: "Báo cáo hệ thống",
        href: "/admin/reports",
        icon: FileBarChart,
    },
    {
        title: "Cấu hình hệ thống",
        href: "/admin/config",
        icon: Sliders,
    },
    {
        title: "Thông báo",
        href: "/admin/announcements",
        icon: Megaphone,
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, isAuthenticated } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (user?.role !== 'ADMIN') {
            router.push("/dashboard");
        }
    }, [isAuthenticated, user, router]);

    const avatarUrl = `https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff&bold=true`;

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans">
            {/* Sidebar (Desktop) */}
            <aside
                className={cn(
                    "fixed inset-y-0 z-50 flex w-64 flex-col transition-all duration-300 md:static",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "bg-[#450a0a] text-red-50 border-r border-red-900"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-red-800">
                    <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="tracking-tight">BizFlow Admin</span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="space-y-1">
                        {adminItems.map((item) => {
                            const isActive = item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                        isActive
                                            ? "bg-red-600 text-white shadow-lg shadow-red-900/40"
                                            : "hover:bg-red-800/50 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-red-300 group-hover:text-white")} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-red-800 bg-[#450a0a]">
                    <div className="flex items-center gap-3 bg-red-800/30 p-3 rounded-lg border border-red-800/50">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full border border-red-700 shadow-sm"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">Platform Admin</p>
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">SuperAdmin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="h-16 bg-white border-b sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {adminItems.find(i => pathname.startsWith(i.href))?.title || "Admin Console"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 opacity-50">
                            <Bell className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            title="Đăng xuất"
                            className="text-red-600 hover:bg-red-50 rounded-full"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50/50">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
