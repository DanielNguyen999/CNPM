"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    FileText,
    LogOut,
    Menu,
    FileEdit,
    Truck,
    Command,
    ChevronDown,
    Bell,
    History
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

const sidebarItems = [
    {
        title: "Tổng quan",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Bán hàng (POS)",
        href: "/dashboard/pos",
        icon: ShoppingCart,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Đơn hàng",
        href: "/dashboard/orders",
        icon: FileText,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "AI Draft",
        href: "/dashboard/draft-orders",
        icon: FileEdit,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Sản phẩm",
        href: "/dashboard/products",
        icon: Package,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Bộ lọc & Đơn vị",
        href: "/dashboard/units",
        icon: Package,
        roles: ["OWNER"],
    },
    {
        title: "Kho hàng",
        href: "/dashboard/inventory",
        icon: Truck,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Khách hàng",
        href: "/dashboard/customers",
        icon: Users,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Công nợ",
        href: "/dashboard/debts",
        icon: FileText,
        roles: ["OWNER", "EMPLOYEE"],
    },
    {
        title: "Nhân viên",
        href: "/dashboard/employees",
        icon: Users,
        roles: ["OWNER"],
    },
    {
        title: "Báo cáo",
        href: "/dashboard/reports",
        icon: FileText,
        roles: ["OWNER"],
    },
    {
        title: "Nhật ký hệ thống",
        href: "/dashboard/settings/audit-logs",
        icon: History,
        roles: ["OWNER"],
    },
    {
        title: "Cài đặt",
        href: "/dashboard/settings",
        icon: Command,
        roles: ["OWNER"],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, isAuthenticated, _hasHydrated } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter items based on user role
    const filteredItems = sidebarItems.filter(item =>
        user?.role && item.roles.includes(user.role.toUpperCase())
    );

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (user?.role === 'CUSTOMER') {
            router.push("/portal");
            return;
        } else if (user?.role === 'ADMIN') {
            router.push("/admin");
            return;
        }

        // Fetch permissions for EMPLOYEES if not already present
        if (user?.role === 'EMPLOYEE' && !user.permissions) {
            apiClient.get('/users/me/permissions')
                .then(res => {
                    const grantedKeys = res.data
                        .filter((p: any) => p.is_granted)
                        .map((p: any) => p.permission_key);
                    useAuthStore.getState().setPermissions(grantedKeys);
                })
                .catch(err => console.error("Failed to sync permissions", err));
        }

        // Check if current path is allowed for the role
        const currentPath = window.location.pathname;
        const matchingItem = sidebarItems.find(item => item.href === currentPath || currentPath.startsWith(item.href + "/"));

        if (matchingItem && user?.role) {
            if (!matchingItem.roles.includes(user.role.toUpperCase())) {
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, user?.role, user?.permissions, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.email || 'User')}&background=6366f1&color=fff&bold=true`;

    if (!mounted || !_hasHydrated || !isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans">
            {/* Sidebar (Desktop) */}
            <aside
                className={cn(
                    "fixed inset-y-0 z-50 flex w-64 flex-col transition-all duration-300 md:static md:translate-x-0 shadow-xl print:hidden",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "bg-[#0f172a] text-slate-300 border-r border-slate-800"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-[#0f172a]">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white group-hover:bg-indigo-500 transition-colors">
                            <Command className="h-5 w-5" />
                        </div>
                        <span className="tracking-tight">BizFlow</span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="space-y-1">
                        {filteredItems.map((item) => {
                            const isActive = item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                        isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                                            : "hover:bg-slate-800/50 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
                    <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg border border-slate-800/50">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full border border-slate-700 shadow-sm"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.email}</p>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header (Desktop & Mobile) */}
                <header className="h-16 bg-white border-b sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold text-slate-800 hidden md:block">
                            {sidebarItems.find(i => pathname.startsWith(i.href))?.title || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        {/* Custom Dropdown */}
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
                                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                        <p className="text-sm font-medium text-slate-900">Tài khoản của tôi</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/dashboard/profile')}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Hồ sơ
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard/settings')}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cài đặt
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button
                                        onClick={handleLogout}
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

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
