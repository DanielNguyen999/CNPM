"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ShoppingCart,
    FileText,
    CreditCard,
    User,
    LogOut,
    Menu,
    Bell,
    ShoppingBag,
    LayoutDashboard,
    Command,
    ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const portalItems = [
    {
        title: "Tổng quan",
        href: "/portal",
        icon: LayoutDashboard,
    },
    {
        title: "Sản phẩm",
        href: "/portal/products",
        icon: ShoppingBag,
    },
    {
        title: "Đơn hàng",
        href: "/portal/orders",
        icon: FileText,
    },
    {
        title: "Công nợ",
        href: "/portal/debts",
        icon: FileText,
    },
    {
        title: "Hồ sơ",
        href: "/portal/profile",
        icon: User,
    },
];

export default function PortalLayout({
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

        if (user?.role !== 'CUSTOMER' && user?.role !== 'ADMIN') {
            router.push("/dashboard");
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email || 'Customer')}&background=10b981&color=fff&bold=true`;

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans">
            {/* Sidebar (Desktop) */}
            <aside
                className={cn(
                    "fixed inset-y-0 z-50 flex w-64 flex-col transition-all duration-300 md:static",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "bg-[#064e3b] text-emerald-50 border-r border-emerald-900"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-emerald-800">
                    <Link href="/portal" className="flex items-center gap-2 font-bold text-xl text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                            <Command className="h-5 w-5" />
                        </div>
                        <span className="tracking-tight">BizFlow Portal</span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="space-y-1">
                        {portalItems.map((item) => {
                            const isActive = item.href === "/portal"
                                ? pathname === "/portal"
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                        isActive
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                                            : "hover:bg-emerald-800/50 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-emerald-300 group-hover:text-white")} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-emerald-800 bg-[#064e3b]">
                    <div className="flex items-center gap-3 bg-emerald-800/30 p-3 rounded-lg border border-emerald-800/50">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full border border-emerald-700 shadow-sm"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.email}</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Khách hàng</p>
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
                            {portalItems.find(i => pathname.startsWith(i.href))?.title || "Portal"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 opacity-50">
                            <Bell className="h-5 w-5" />
                        </Button>

                        <div className="relative" ref={profileRef}>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 pl-2 pr-1 ml-1 hover:bg-slate-100 rounded-full"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <img
                                    src={avatarUrl}
                                    alt="User"
                                    className="h-8 w-8 rounded-full border border-slate-200"
                                />
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                            </Button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-100 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
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
