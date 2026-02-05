"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    CreditCard,
    User,
    Calendar,
    Clock,
    DollarSign,
    Receipt,
    FileText,
    AlertCircle,
    History as HistoryIcon
} from "lucide-react";
import { debtsApi } from "@/lib/api/debts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import DebtRepayModal from "@/components/debts/DebtRepayModal";
import PaymentHistory from "@/components/debts/PaymentHistory";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DebtDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const debtId = parseInt(id as string);
    const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

    const { data: debt, isLoading } = useQuery({
        queryKey: ["debt", debtId],
        queryFn: () => debtsApi.get(debtId),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return format(new Date(dateStr), "dd/MM/yyyy");
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (!debt) {
        return <div className="p-6">Không tìm thấy thông tin khoản nợ.</div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/debts">Công nợ</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Chi tiết nợ #{debt.order_code}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-2xl font-bold">Chi tiết nợ #{debt.order_code}</h1>
                </div>
                <Button
                    onClick={() => setIsRepayModalOpen(true)}
                    disabled={debt.status === "PAID"}
                    className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Thu tiền nợ
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khoản nợ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(debt.total_amount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ngày tạo: {formatDate(debt.created_at)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-green-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Đã thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(debt.paid_amount)}</div>
                        <div className="flex items-center mt-1 text-xs text-green-700 font-medium">
                            <Badge variant="outline" className="bg-white border-green-200 text-green-700 mr-2 capitalize">
                                {debt.status.toLowerCase()}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-red-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Còn lại phải thu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(debt.remaining_amount)}</div>
                        <div className="flex items-center mt-1 text-xs text-red-700 font-medium">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Đáo hạn: {formatDate(debt.due_date)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer & Info */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-lg flex items-center">
                                <User className="w-5 h-5 mr-2 text-slate-500" />
                                Thông tin khách hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase">Tên khách hàng</Label>
                                <div className="font-bold text-blue-600">
                                    <Link href={`/dashboard/customers/${debt.customer_id}`} className="hover:underline flex items-center">
                                        {debt.customer_name}
                                    </Link>
                                </div>
                            </div>
                            <Separator className="opacity-50" />
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase">Số điện thoại</Label>
                                <div className="font-medium">{debt.customer_phone || "-"}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {debt.notes && (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-slate-500" />
                                    Ghi chú khoản nợ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 italic">"{debt.notes}"</p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 shrink-0" />
                        <div className="text-sm text-blue-800">
                            <b>Gợi ý:</b> Luôn ghi chú mã giao dịch khi thu tiền qua chuyển khoản để đối soát dễ dàng hơn.
                        </div>
                    </div>
                </div>

                {/* Payment History Timeline */}
                <div className="md:col-span-2">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <CardTitle className="text-lg flex items-center">
                                <HistoryIcon className="w-5 h-5 mr-2 text-slate-500" />
                                Lịch sử thu tiền
                            </CardTitle>
                            {debt.payments.length > 0 && (
                                <div className="text-xs font-medium text-muted-foreground">
                                    {debt.payments.length} lần giao dịch
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-6">
                            <PaymentHistory payments={debt.payments} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DebtRepayModal
                debtId={debtId}
                remainingAmount={debt.remaining_amount}
                isOpen={isRepayModalOpen}
                onClose={() => setIsRepayModalOpen(false)}
            />
        </div>
    );
}
