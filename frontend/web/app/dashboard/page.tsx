"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Users,
    ShoppingCart,
    Package,
    DollarSign,
    TrendingUp,
    Calendar,
    Clock,
    CheckCircle2,
    BarChart2,
    AlertCircle,
    Sparkles,
    Lightbulb,
    Mic
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/apiClient";
import { reportsApi } from "@/lib/api/reports";
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
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: () => reportsApi.getDashboardStats()
    });

    const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
        queryKey: ["orders", "recent"],
        queryFn: async () => {
            const { data } = await apiClient.get("/orders", { params: { page: 1, page_size: 5 } });
            return data;
        }
    });

    const orders = ordersResponse?.items || [];

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

    const stats = [
        {
            title: "Doanh thu hôm nay",
            value: formatCurrency(statsData?.today_revenue || 0),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            description: "Thống kê trong ngày",
            path: "/dashboard/reports"
        },
        {
            title: "Đơn hàng hôm nay",
            value: statsData?.today_orders || 0,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
            description: "Số lượng đơn mới",
            path: "/dashboard/orders"
        },
        {
            title: "Khách hàng mới",
            value: statsData?.new_customers || 0,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            description: "Đã đăng ký",
            path: "/dashboard/customers"
        },
        {
            title: "Tồn kho thấp",
            value: lowStock?.length || 0,
            icon: Package,
            color: "text-amber-600",
            bg: "bg-amber-50",
            description: "Cần nhập hàng",
            path: "/dashboard/inventory"
        }
    ];

    const todayName = new Date().toLocaleDateString('vi-VN', { weekday: 'long' });
    const todayDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header */}
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
                    <Button variant="outline" className="hidden sm:flex border-slate-200 shadow-sm" asChild>
                        <Link href="/dashboard/reports">Báo cáo</Link>
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" asChild>
                        <Link href="/dashboard/pos">
                            <ShoppingCart className="mr-2 h-4 w-4" /> BÁN HÀNG NGAY
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Feature Highlight: Voice Assistant */}
            <div className="animate-in slide-in-from-top-4 duration-1000">
                <Card className="border-none shadow-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Mic className="h-24 w-24" />
                    </div>
                    <CardContent className="p-6 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                <Sparkles className="h-6 w-6 text-amber-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Thanh toán bằng giọng nói đã sẵn sàng!</h3>
                                <p className="text-indigo-100 text-sm">Trình trợ lý AI BizFlow giúp bạn tạo đơn hàng chỉ bằng cách nói. Thử ngay tại mục Bán hàng.</p>
                            </div>
                        </div>
                        <Button variant="secondary" className="font-bold text-indigo-600 hidden sm:flex" asChild>
                            <Link href="/dashboard/pos">Dùng thử ngay</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.path} className="block group">
                        <Card className="border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-white cursor-pointer relative">
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
                                        <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1 uppercase tracking-wider">
                                            {stat.title}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Chart */}
                <Card className="lg:col-span-8 border-none shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <BarChart2 className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-800">Hiệu suất bán hàng</CardTitle>
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
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Column */}
                <Card className="lg:col-span-4 border-none shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-800">Cảnh báo kho</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lowStockLoading ? (
                            <div className="p-4 space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (lowStock?.length ?? 0) > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {lowStock.slice(0, 4).map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group border-b last:border-0 border-slate-50"
                                        onClick={() => router.push(`/dashboard/inventory?search=${encodeURIComponent(item.product_name || '')}`)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-4">
                                                <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                    {item.product_name || 'Sản phẩm chưa cập nhật tên'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium border border-red-100">
                                                        Cần nhập thêm
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Mức báo động: {Number(item.low_stock_threshold).toLocaleString('vi-VN')} {item.unit_name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 font-bold whitespace-nowrap">
                                                    {Number(item.available_quantity).toLocaleString('vi-VN')} {item.unit_name}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((item.available_quantity / (item.low_stock_threshold || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                                <p className="text-sm font-bold">Mọi thứ đều ổn!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-slate-800 px-6 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                        <Clock className="h-5 w-5 opacity-70" /> Giao dịch gần đây
                    </CardTitle>
                    <Button variant="ghost" className="text-indigo-400 font-bold hover:text-white" asChild>
                        <Link href="/dashboard/orders">Xem tất cả</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {ordersLoading ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (orders?.length ?? 0) > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {orders.map((order: any) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/dashboard/orders`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {order.order_code.slice(-2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{order.order_code}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{formatDateTime(order.order_date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-extrabold text-slate-900">{formatCurrency(order.total_amount)}</p>
                                        <Badge className={`text-[9px] font-bold ${order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {order.payment_status === 'PAID' ? 'Đã Thanh Toán' : 'Còn Nợ'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center opacity-30">
                            <ShoppingCart className="h-16 w-16 mx-auto mb-2" />
                            <p className="font-bold">Chưa có giao dịch nào.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
