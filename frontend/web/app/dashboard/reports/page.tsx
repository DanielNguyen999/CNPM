"use client";

import { useQuery } from "@tanstack/react-query";
import {
    BarChart2,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Calendar,
    ArrowLeft,
    BrainCircuit,
    Package,
    History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/api/reports";
import Link from "next/link";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0
    }).format(amount);
};

export default function ReportsPage() {
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ["revenue-7d"],
        queryFn: () => {
            const end = new Date().toISOString().split('T')[0];
            const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            return reportsApi.getRevenue(start, end);
        }
    });

    const { data: aiSummary, isLoading: aiLoading } = useQuery({
        queryKey: ["ai-summary"],
        queryFn: () => reportsApi.getAiSummary()
    });

    const { data: forecast, isLoading: forecastLoading } = useQuery({
        queryKey: ["inventory-forecast"],
        queryFn: () => reportsApi.getInventoryForecast()
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Báo Cáo & Phân Tích AI</h1>
                        <p className="text-slate-500 font-medium">Theo dõi hiệu suất và dự báo tăng trưởng</p>
                    </div>
                </div>
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none py-1.5 px-3">
                    <BrainCircuit className="mr-2 h-4 w-4" /> AI INSIGHTS
                </Badge>
            </div>

            {/* AI Summary Card */}
            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <CardHeader className="relative z-10 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <BrainCircuit className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Phân tích trợ lý BizFlow</CardTitle>
                            <CardDescription className="text-slate-400">Phân tích dữ liệu kinh doanh 30 ngày gần nhất</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 relative z-10">
                    {aiLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full bg-slate-800" />
                            <Skeleton className="h-4 w-3/4 bg-slate-800" />
                            <Skeleton className="h-4 w-5/6 bg-slate-800" />
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <p className="text-lg leading-relaxed text-slate-200">
                                {aiSummary?.summary || "Đang thu thập dữ liệu phân tích..."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Revenue Trend */}
                <Card className="border-none shadow-lg bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="h-5 w-5 text-indigo-600" />
                                <CardTitle className="text-lg">Xu hướng doanh thu</CardTitle>
                            </div>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">7 ngày qua</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {revenueLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <div className="h-[300px] w-full">
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
                                            tickFormatter={(val) => `${val / 1000000}M`}
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

                {/* Inventory Forecast */}
                <Card className="border-none shadow-lg bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-amber-500" />
                                <CardTitle className="text-lg">Dự báo nhập kho AI</CardTitle>
                            </div>
                            <span className="text-[10px] text-slate-400" title="Dựa trên tốc độ bán hàng 90 ngày">
                                Dựa trên tốc độ bán hàng 90 ngày
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {forecastLoading ? (
                            <div className="p-6 space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <div className="divide-y">
                                {forecast?.map((item: any, idx: number) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-900">{item.product_name}</p>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[10px] py-0">
                                                    Dự kiến: {new Date(item.restock_date).toLocaleDateString('vi-VN')}
                                                </Badge>
                                                <span className="text-[10px] text-slate-500 font-medium lowercase">
                                                    Còn khoảng {item.days_left} ngày
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-xs font-bold text-indigo-600">+{item.recommended_quantity} sp</p>
                                            <p className="text-[10px] text-slate-400">Số lượng đề xuất</p>
                                        </div>
                                    </div>
                                ))}
                                {(!forecast || forecast.length === 0) && (
                                    <div className="p-12 text-center text-slate-400">
                                        <p>Chưa đủ dữ liệu bán hàng để dự báo.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
