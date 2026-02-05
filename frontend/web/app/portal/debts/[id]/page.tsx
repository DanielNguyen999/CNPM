"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Receipt,
    History,
    CheckCircle2,
    AlertCircle,
    DollarSign
} from "lucide-react";
import { portalApi } from "@/lib/api/portal";
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

export default function PortalDebtDetailPage() {
    const params = useParams();
    const router = useRouter();
    const debtId = params.id as string;

    const { data: debt, isLoading } = useQuery({
        queryKey: ["portal", "debts", debtId],
        queryFn: () => portalApi.getDebt(parseInt(debtId)),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
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

    if (!debt) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 gap-4">
                <AlertCircle className="h-16 w-16 opacity-20" />
                <h2 className="text-xl font-bold">Không tìm thấy khoản nợ</h2>
                <Button onClick={() => router.push("/portal/debts")}>Quay lại danh sách</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/portal">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/portal/debts">Công nợ của tôi</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Chi tiết nợ #{debt.order_code || debt.id}</BreadcrumbPage>
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
                                Chi tiết nợ #{debt.order_code || debt.id}
                            </h1>
                            <Badge className={debt.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                                {debt.status === "PAID" ? "Đã tất toán" : "Còn nợ"}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Ngày phát sinh: {format(new Date(debt.created_at), "dd/MM/yyyy", { locale: vi })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border shadow-sm border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">Tổng nợ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(debt.total_amount)}</div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">Đã trả</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(debt.remaining_amount ? debt.total_amount - debt.remaining_amount : debt.paid_amount)}</div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm border-l-4 border-l-rose-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">Còn lại</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{formatCurrency(debt.remaining_amount)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-sm bg-white overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <History className="h-4 w-4 text-indigo-500" /> Lịch sử thanh toán
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Ngày gd</TableHead>
                                <TableHead>Phương thức</TableHead>
                                <TableHead className="text-right">Số tiền</TableHead>
                                <TableHead>Ghi chú</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debt.payments?.length ? (
                                debt.payments.map((p: any) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-sm">{format(new Date(p.payment_date), "dd/MM/yyyy HH:mm")}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{p.payment_method || "Tiền mặt"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                                        <TableCell className="text-xs text-slate-500 italic">{p.notes || "-"}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                                        Chưa có giao dịch trả nợ nào.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                <div className="space-y-6">
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" /> Thông tin bổ sung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hạn thanh toán</label>
                                <div className="mt-1 font-medium text-slate-900">
                                    {debt.due_date ? format(new Date(debt.due_date), "dd/MM/yyyy") : "Không có hạn"}
                                </div>
                            </div>
                            <div className="pt-3 border-t">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn hàng gốc</label>
                                <div className="mt-1">
                                    <Button variant="link" className="p-0 h-auto text-indigo-600 font-bold" onClick={() => router.push(`/portal/orders/${debt.order_id}`)}>
                                        Xem đơn hàng #{debt.order_code}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
