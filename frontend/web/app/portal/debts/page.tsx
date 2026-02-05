"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Receipt, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { portalApi } from "@/lib/api/portal";
import Link from "next/link";
import { useState } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PortalDebtsPage() {
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const { data, isLoading } = useQuery({
        queryKey: ["portal", "debts", page],
        queryFn: () => portalApi.getDebts(page, pageSize),
        placeholderData: (previousData) => previousData,
    });

    const debts = data?.items || [];
    const totalRemaining = data?.total_amount_pending || 0; // Backend returns this for debts

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/portal">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Công nợ của tôi</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Công nợ của tôi</h2>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi các khoản dư nợ và lịch sử thanh toán.</p>
                </div>
                <Card className="bg-rose-50 border-rose-100 shadow-sm border-l-4 border-l-rose-500 px-6 py-4">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Tổng dư nợ hiện tại</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRemaining)}
                    </p>
                </Card>
            </div>

            <Card className="border shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[120px]">Mã đơn</TableHead>
                            <TableHead>Ngày nợ</TableHead>
                            <TableHead className="text-right">Tổng nợ</TableHead>
                            <TableHead className="text-right">Đã trả</TableHead>
                            <TableHead className="text-right">Còn lại</TableHead>
                            <TableHead className="text-center">Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : debts.length ? (
                            debts.map((debt: any) => (
                                <TableRow key={debt.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-slate-500">{debt.order_code || `#${debt.id}`}</TableCell>
                                    <TableCell className="text-slate-600">
                                        {new Date(debt.created_at).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-900">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(debt.total_amount)}
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-600">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(debt.paid_amount)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-rose-600">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(debt.remaining_amount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Badge
                                                variant={debt.status === "PAID" ? "success" : debt.status === "PARTIAL" ? "warning" : "destructive"}
                                                className="px-2 py-0.5 rounded-full font-medium"
                                            >
                                                {debt.status === "PAID" ? "Đã tất toán" : debt.status === "PARTIAL" ? "Trả một phần" : "Chưa thanh toán"}
                                            </Badge>
                                            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                                                <Link href={`/portal/debts/${debt.id}`}>
                                                    <FileText className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <div className="p-4 rounded-full bg-slate-50">
                                            <Receipt className="h-12 w-12 opacity-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-slate-900">Tuyệt vời!</h3>
                                            <p className="text-sm">Bạn không có bất kỳ khoản nợ quá hạn nào.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination */}
            {data && data.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 bg-white border rounded-lg shadow-sm">
                    <div className="text-sm text-muted-foreground">
                        Trang {page} / {data.total_pages} (Tổng: {data.total} khoản nợ)
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                            disabled={page === data.total_pages || isLoading}
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
