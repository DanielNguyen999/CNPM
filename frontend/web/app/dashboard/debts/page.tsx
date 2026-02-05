"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    User,
    ExternalLink,
    Clock,
    ChevronRight,
    FileText
} from "lucide-react";
import { debtsApi, DebtSummary } from "@/lib/api/debts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { format } from "date-fns";
import { PaymentDialog } from "@/components/debts/PaymentDialog";

export default function DebtsPage() {
    const [selectedDebt, setSelectedDebt] = useState<any>(null);
    const [status, setStatus] = useState<string>("all");
    const [sort, setSort] = useState<string>("latest");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading } = useQuery({
        queryKey: ["debts", status, sort, page],
        queryFn: () => debtsApi.list({
            status: status === "all" ? undefined : status,
            sort,
            page,
            page_size: pageSize
        }),
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

    const handleExport = () => {
        if (!data?.items || data.items.length === 0) return;

        const headers = ["Khách hàng", "Số điện thoại", "Mã đơn", "Tổng nợ", "Còn lại", "Ngày đến hạn", "Trạng thái"];
        const csvContent = [
            headers.join(","),
            ...data.items.map((d: any) => [
                `"${d.customer_name}"`,
                `"${d.customer_phone || ""}"`,
                d.order_code,
                d.total_amount,
                d.remaining_amount,
                formatDate(d.due_date),
                d.status
            ].join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_cao_cong_no_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge variant="success">Đã trả</Badge>;
            case "PARTIAL":
            case "PARTIAL_PAID":
                return <Badge variant="default" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">Trả một phần</Badge>;
            case "PENDING":
                return <Badge variant="warning">Chưa trả</Badge>;
            case "OVERDUE":
                return <Badge variant="destructive">Quá hạn</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Breadcrumb className="mb-2">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Công nợ</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý công nợ</h1>
                    <p className="text-sm text-muted-foreground">Theo dõi và thu hồi công nợ từ khách hàng</p>
                </div>
                <Button variant="outline" onClick={handleExport} className="border-slate-200">
                    <FileText className="w-4 h-4 mr-2" /> Xuất Excel
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                    <div className="w-full md:w-48">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Trạng thái</label>
                        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="PENDING">Chưa trả</SelectItem>
                                <SelectItem value="PARTIAL">Trả một phần</SelectItem>
                                <SelectItem value="PAID">Đã trả</SelectItem>
                                <SelectItem value="OVERDUE">Quá hạn</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-48">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Sắp xếp theo</label>
                        <Select value={sort} onValueChange={(val) => { setSort(val); setPage(1); }}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Mới nhất" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">Mới nhất</SelectItem>
                                <SelectItem value="largest_remaining">Nợ nhiều nhất</SelectItem>
                                <SelectItem value="nearest_due">Sắp hết hạn</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Mã đơn</TableHead>
                            <TableHead className="text-right">Tổng nợ</TableHead>
                            <TableHead className="text-right">Còn lại</TableHead>
                            <TableHead>Ngày đến hạn</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    Không có khoản nợ nào phù hợp
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((debt) => (
                                <TableRow key={debt.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => window.location.href = `/dashboard/debts/${debt.id}`}>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{debt.customer_name}</div>
                                                <div className="text-xs text-muted-foreground">{debt.customer_phone}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-medium text-slate-600">
                                            {debt.order_code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(debt.total_amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-red-600 font-bold">
                                            {formatCurrency(debt.remaining_amount)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <Clock className="w-3 h-3 mr-1.5 text-muted-foreground" />
                                            {formatDate(debt.due_date)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(debt.status)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {debt.remaining_amount > 0 && (
                                            <Button
                                                size="sm"
                                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDebt(debt);
                                                }}
                                            >
                                                Thanh toán
                                            </Button>
                                        )}
                                        <Link href={`/dashboard/debts/${debt.id}`} onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {data && data.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 bg-slate-50 border-t">
                        <div className="text-sm text-muted-foreground">
                            Trang {page} / {data.total_pages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                                disabled={page === data.total_pages}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <PaymentDialog
                debt={selectedDebt}
                isOpen={!!selectedDebt}
                onClose={() => setSelectedDebt(null)}
            />
        </div>
    );
}
