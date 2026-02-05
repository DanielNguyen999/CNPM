"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Users,
    ShoppingCart,
    Package,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowRight,
    Calendar,
    Box,
    Clock,
    CheckCircle2,
    BarChart2,
    AlertCircle,
    Sparkles,
    Lightbulb,
    CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/apiClient";
import { reportsApi } from "@/lib/api/reports";
import { portalApi } from "@/lib/api/portal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(d);
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0
    }).format(amount);
};

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: () => reportsApi.getDashboardStats()
    });

    const { data: orders, isLoading: ordersLoading } = useQuery({
        queryKey: ["orders", "recent", user?.role],
        queryFn: async () => {
            if (user?.role === "CUSTOMER") {
                return portalApi.getOrders();
            }
            const { data } = await apiClient.get("/orders", { params: { limit: 5 } });
            return data;
        },
        enabled: !!user
    });

    const { data: lowStock, isLoading: lowStockLoading } = useQuery({
        queryKey: ["lowStock"],
        queryFn: async () => {
            const { data } = await apiClient.get("/inventory?low_stock_only=true");
            return data;
        }
    });

    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ["revenue-7d"],
        queryFn: () => {
            const end = new Date().toISOString().split('T')[0];
            const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            return reportsApi.getRevenue(start, end);
        }
    });

    const isCustomer = user?.role === "CUSTOMER";

    const stats = isCustomer ? [
        {
            title: "Đơn hàng của tôi",
            value: statsData?.total_orders || 0,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
            description: "Tổng số đơn hàng"
        },
        {
            title: "Tổng chi tiêu",
            value: formatCurrency(statsData?.total_spent || 0),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            description: "Tổng số tiền đã chi"
        },
        {
            title: "Công nợ",
            value: formatCurrency(statsData?.total_debt || 0),
            icon: CreditCard,
            color: "text-red-600",
            bg: "bg-red-50",
            description: "Số tiền còn nợ"
        }
    ] : [
        {
            title: "Doanh thu hôm nay",
            value: formatCurrency(statsData?.today_revenue || 0),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            description: "Tổng doanh thu trong ngày"
        },
        {
            title: "Đơn hàng hôm nay",
            value: statsData?.today_orders || 0,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
            description: "Số đơn hàng mới"
        },
        {
            title: "Khách hàng mới",
            value: statsData?.new_customers || 0,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            description: "Khách hàng đăng ký mới"
        },
        {
            title: "Tồn kho thấp",
            value: lowStock?.length || 0,
            icon: Package,
            color: "text-amber-600",
            bg: "bg-amber-50",
            description: "Sản phẩm cần nhập thêm"
        }
    ];

    const todayName = new Date().toLocaleDateString('vi-VN', { weekday: 'long' });
    const todayDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Top Bar: Welcome & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Chào ngày mới, <span className="text-indigo-600">{user?.full_name || 'Admin'}!</span>
                    </h2>
                    <div className="flex items-center gap-2 text-slate-500 mt-2 font-medium">
                        <Calendar className="h-4 w-4" />
                        <span className="capitalize">{todayName}, {todayDate}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isCustomer && (
                        <Button variant="outline" className="hidden sm:flex border-slate-200 shadow-sm" asChild>
                            <Link href="/dashboard/reports">Xem báo cáo chi tiết</Link>
                        </Button>
                    )}
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" asChild>
                        <Link href={isCustomer ? "/products" : "/pos"}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> {isCustomer ? "MUA SẮM NGAY" : "BÁN HÀNG NGAY"}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", isCustomer && "lg:grid-cols-3")}>
                {stats.map((stat, i) => {
                    // Define navigation paths for each stat card
                    const getNavPath = () => {
                        if (isCustomer) {
                            if (i === 0) return "/dashboard/orders"; // Customer orders
                            if (i === 1) return "/dashboard/debts";
                            if (i === 2) return "/portal/products"; // New products
                        } else {
                            if (i === 0) return "/dashboard/reports"; // Revenue
                            if (i === 1) return "/dashboard/orders"; // Orders
                            if (i === 2) return "/dashboard/inventory"; // Low stock
                            if (i === 3) return "/dashboard/debts";
                        }
                        return "#";
                    };

                    return (
                        <Link key={i} href={getNavPath()} className="block">
                            <Card className="border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group bg-white cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    {statsLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-7 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                                            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1 uppercase tracking-wider">
                                                <TrendingUp className="h-3 w-3" /> {stat.description}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* AI Insights Section */}
            {!isCustomer && statsData?.ai_summary && (
                <div className="animate-in slide-in-from-bottom-4 duration-1000">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="h-16 w-16 text-indigo-600" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                                    <Lightbulb className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                        Trợ lý AI BizFlow
                                        <Badge variant="outline" className="bg-indigo-600 text-white border-none text-[8px] px-1 h-3">PREMIUM</Badge>
                                    </h3>
                                    <p className="text-slate-700 leading-relaxed font-medium italic">
                                        "{statsData.ai_summary}"
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Analytics & Activity */}
            {!isCustomer && (
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Sales Chart (Visual Placeholder) */}
                    <Card className="lg:col-span-8 border-none shadow-md overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 px-6 py-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <BarChart2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">Hiệu suất bán hàng</CardTitle>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">Thống kê 7 ngày gần nhất</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border text-[10px] font-bold text-slate-600">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500" /> Doanh thu
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {revenueLoading ? (
                                <Skeleton className="h-[250px] w-full" />
                            ) : (
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748b' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748b' }}
                                                tickFormatter={(val) => `${val / 1000}k`}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(Number(value))}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#4f46e5"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Sidebar: Quick Status */}
                    <Card className="lg:col-span-4 border-none shadow-md overflow-hidden bg-white flex flex-col">
                        <CardHeader className="bg-slate-50/50 px-6 py-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-800">Theo dõi kho</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            {lowStockLoading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                </div>
                            ) : (lowStock?.length ?? 0) > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {(lowStock || []).slice(0, 4).map((item: any) => (
                                        <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="space-y-1">
                                                    <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mã: {item.product_code}</p>
                                                </div>
                                                <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 font-bold text-[10px]">
                                                    {item.available_quantity} / {item.low_stock_threshold}
                                                </Badge>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full shadow-sm"
                                                    style={{ width: `${(item.available_quantity / item.low_stock_threshold) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="ghost" className="w-full h-12 text-blue-600 font-bold text-xs uppercase tracking-wider hover:bg-blue-50" asChild>
                                        <Link href="/dashboard/inventory">Nhập hàng ngay <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">Kho hàng an toàn</p>
                                    <p className="text-xs text-slate-500 mt-1">Mọi thứ đang trong tầm kiểm soát!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bottom Row: Recent Transactions */}
                    <Card className="lg:col-span-12 border-none shadow-md overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between bg-slate-800 px-6 py-4">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold">Giao dịch gần đây</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-white hover:bg-white/10 font-bold" asChild>
                                <Link href="/dashboard/orders">XEM TẤT CẢ</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {ordersLoading ? (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                                </div>
                            ) : (orders?.length ?? 0) > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {(orders || []).slice(0, 5).map((order: any) => (
                                        <div key={order.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => (window.location.href = `/dashboard/orders/${order.id}`)}>
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                    {order.order_code.slice(-2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{order.order_code}</p>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-bold">
                                                        <Calendar className="h-3 w-3" /> {formatDateTime(order.order_date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-12">
                                                <div className="hidden md:block text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Khách hàng</p>
                                                    <p className="text-sm font-bold text-slate-700">{order.customer_name || 'Khách lẻ'}</p>
                                                </div>
                                                <div className="text-right min-w-[120px]">
                                                    <p className="text-lg font-extrabold text-slate-900">
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                    <Badge className={`mt-1 font-bold text-[9px] uppercase tracking-wider ${order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}`}>
                                                        {order.payment_status === 'PAID' ? 'Đã Thanh Toán' : 'Còn Nợ'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                                    <ShoppingCart className="h-16 w-16 opacity-10 mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Chưa có giao dịch nào được ghi nhận</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {isCustomer && (
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardHeader className="flex flex-row items-center justify-between bg-indigo-600 px-6 py-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Clock className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold">Đơn hàng gần đây của tôi</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {ordersLoading ? (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                            </div>
                        ) : (orders?.length ?? 0) > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {(orders || []).slice(0, 5).map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                {order.order_code.slice(-2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{order.order_code}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-bold">
                                                    <Calendar className="h-3 w-3" /> {formatDateTime(order.order_date)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[120px]">
                                            <p className="text-lg font-extrabold text-slate-900">
                                                {formatCurrency(order.total_amount)}
                                            </p>
                                            <Badge className={`mt-1 font-bold text-[9px] uppercase tracking-wider ${order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {order.payment_status === 'PAID' ? 'Đã Thanh Toán' : 'Còn Nợ'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                                <ShoppingCart className="h-16 w-16 opacity-10 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">Bạn chưa có đơn hàng nào</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

