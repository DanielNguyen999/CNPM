"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Building2, Users, Settings, TrendingUp, ShieldCheck, Activity,
    ArrowRight, Bell, Key, CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminDashboardPage() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin", "stats"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/dashboard-stats");
            return data;
        }
    });

    const { data: auditLogs, isLoading: logsLoading } = useQuery({
        queryKey: ["admin", "audit-logs"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/audit-logs?limit=10");
            return data;
        }
    });

    const cards = [
        {
            title: "Tổng số doanh nghiệp",
            value: stats?.total_owners,
            icon: Building2,
            color: "text-red-600",
            bg: "bg-red-50",
            description: "Các đối tác kinh doanh cốt lõi"
        },
        {
            title: "Tổng số người dùng",
            value: stats?.total_users,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            description: "Số lượng tài khoản khả dụng"
        },
        {
            title: "Gói dịch vụ",
            value: stats?.total_plans,
            icon: Settings,
            color: "text-amber-600",
            bg: "bg-amber-50",
            description: "Các tùy chọn thanh toán"
        },
        {
            title: "Kích hoạt",
            value: stats?.active_subscriptions,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            description: "Chỉ số tăng trưởng hệ thống"
        },
    ];

    const quickActions = [
        { title: "Quản lý doanh nghiệp", icon: Building2, href: "/admin/owners", color: "bg-blue-600" },
        { title: "Quản lý gói dịch vụ", icon: CreditCard, href: "/admin/plans", color: "bg-amber-600" },
        { title: "Yêu cầu mật khẩu", icon: Key, href: "/admin/password-requests", color: "bg-red-600" },
        { title: "Đăng thông báo", icon: Bell, href: "/admin/announcements", color: "bg-emerald-600" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Hệ thống Admin</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h2>
                    <p className="text-sm text-slate-500 mt-1">Giao diện điều khiển cho quản trị viên nền tảng.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-xs h-9" asChild>
                        <Link href="/admin/reports">
                            Báo cáo hệ thống
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <Card key={i} className="border shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-9 w-24 mb-1" />
                            ) : (
                                <div className="text-3xl font-bold text-slate-900">{card.value || 0}</div>
                            )}
                            <p className="text-xs text-slate-400 mt-1">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b py-4">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-700">
                            <Activity className="h-4 w-4 text-red-600" />
                            Hoạt động hệ thống mới nhất
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {logsLoading ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rouned" />)}
                            </div>
                        ) : auditLogs?.length > 0 ? (
                            <div className="divide-y">
                                {auditLogs.slice(0, 8).map((log: any) => (
                                    <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <Users className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {log.user_full_name}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap uppercase">
                                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                <span className="font-medium text-blue-600">{log.action}</span>: {log.details}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center space-y-3 opacity-60">
                                <Activity className="h-12 w-12 text-slate-200" />
                                <p className="text-sm text-slate-400 font-medium italic">Không có hoạt động nào gần đây</p>
                            </div>
                        )}
                        <div className="p-3 bg-slate-50 text-center border-t">
                            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-blue-600 font-semibold" asChild>
                                <Link href="/admin/owners">Xem toàn bộ lịch sử <ArrowRight className="h-3 w-3 ml-1" /></Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-900 border-b py-3">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-white">
                                Thao tác nhanh
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-1 gap-3">
                            {quickActions.map((action, i) => (
                                <Link key={i} href={action.href}>
                                    <div className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${action.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                                <action.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{action.title}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardHeader className="bg-slate-50 border-b py-3">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-700">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Bảo mật hệ thống
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-slate-600">Trạng thái API: Normal</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-medium text-slate-600">DB Tables: Synced</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-medium text-slate-600">BizFlow Cloud: v2.5.0</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
