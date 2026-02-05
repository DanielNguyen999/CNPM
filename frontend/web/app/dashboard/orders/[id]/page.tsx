"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Clock,
    CreditCard,
    Package,
    Printer,
    ShoppingCart,
    User,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { ordersApi } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/store/useAuthStore";

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { canDeleteOrders } = useAuthStore();

    const { data: order, isLoading } = useQuery({
        queryKey: ["orders", orderId],
        queryFn: () => ordersApi.getOrder(parseInt(orderId)),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">Đã thanh toán</Badge>;
            case "PARTIAL":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1">Thanh toán 1 phần</Badge>;
            case "UNPAID":
            case "DEBT":
                return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 py-1">Chưa thanh toán</Badge>;
            default:
                return <Badge variant="secondary" className="px-3 py-1">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 col-span-2" />
                    <Skeleton className="h-64 col-span-1" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 gap-4">
                <AlertCircle className="h-16 w-16 opacity-20" />
                <h2 className="text-xl font-bold">Không tìm thấy đơn hàng</h2>
                <Button onClick={() => router.push("/dashboard/orders")}>Quay lại danh sách</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/orders">Đơn hàng</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>#{order.order_code || order.id}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Chi tiết đơn hàng #{order.order_code || order.id}
                            </h1>
                            {getStatusBadge(order.payment_status)}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Ngày tạo: {format(new Date(order.created_at), "dd MMMM yyyy, HH:mm", { locale: vi })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" /> In hóa đơn
                    </Button>
                    {canDeleteOrders() && (
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.")) {
                                    try {
                                        await ordersApi.deleteOrder(parseInt(orderId));
                                        router.push("/dashboard/orders");
                                    } catch (e) {
                                        alert("Không thể hủy đơn hàng.");
                                    }
                                }
                            }}
                        >
                            Hủy đơn
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border shadow-sm overflow-hidden bg-white">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Package className="h-4 w-4 text-indigo-500" /> Danh sách sản phẩm
                            </CardTitle>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead className="text-center">Số lượng</TableHead>
                                    <TableHead className="text-right">Đơn giá</TableHead>
                                    <TableHead className="text-right">Thành tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <Link
                                                href={`/dashboard/inventory?search=${item.product_code}`}
                                                className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                                            >
                                                {item.product_name}
                                            </Link>
                                            <div className="text-xs text-slate-500">{item.product_code}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{item.quantity} {item.unit_name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {formatCurrency(item.price * item.quantity)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    <Card className="border shadow-sm bg-white">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Tóm tắt thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Tổng tiền hàng:</span>
                                    <span className="text-slate-900 font-bold">{formatCurrency(order.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Đã thanh toán:</span>
                                    <span className="text-emerald-600 font-bold">{formatCurrency(order.paid_amount)}</span>
                                </div>
                                <div className="pt-3 border-t flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900">Còn lại:</span>
                                    <span className="text-xl font-extrabold text-rose-600">
                                        {formatCurrency(order.total_amount - order.paid_amount)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-500" /> Thông tin khách hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                {order.customer_name ? (
                                    <div className="space-y-2">
                                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <CreditCard className="h-3 w-3" /> Mã KH: {order.customer_id}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium text-slate-500 italic">Khách lẻ / Không định danh</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" /> Trạng thái & Ghi chú
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái thanh toán</label>
                                <div className="mt-1 font-medium text-slate-900">
                                    {order.payment_status === "PAID" ? "Hoàn thành" : "Nợ / Trả một phần"}
                                </div>
                            </div>
                            {order.notes && (
                                <div className="pt-3 border-t">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú</label>
                                    <p className="mt-1 text-sm text-slate-600 italic">"{order.notes}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
