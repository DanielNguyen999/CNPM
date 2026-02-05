"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Eye, Package } from "lucide-react";
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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useState } from "react";

export default function PortalOrdersPage() {
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const { data, isLoading } = useQuery({
        queryKey: ["portal", "orders", page],
        queryFn: () => portalApi.getOrders(page, pageSize),
        placeholderData: (previousData) => previousData,
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/portal">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Lịch sử mua hàng</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lịch sử mua hàng</h2>
                <p className="text-sm text-slate-500 mt-1">Danh sách các đơn hàng đã thực hiện.</p>
            </div>

            <Card className="border shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[120px]">Mã đơn</TableHead>
                            <TableHead>Ngày đặt</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            <TableHead className="text-center">Thanh toán</TableHead>
                            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data?.items?.length ? (
                            data.items.map((order: any) => (
                                <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="font-mono text-xs font-bold text-slate-500">{order.order_code}</TableCell>
                                    <TableCell className="text-slate-600">
                                        {new Date(order.order_date).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total_amount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={order.payment_status === "PAID" ? "success" : order.payment_status === "PARTIAL" ? "warning" : "destructive"}
                                            className="px-2 py-0.5 rounded-full font-medium"
                                        >
                                            {order.payment_status === "PAID" ? "Đã trả" : order.payment_status === "PARTIAL" ? "Trả một phần" : "Chưa trả"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/portal/orders/${order.id}`}>
                                                <Eye className="h-4 w-4 mr-2" /> Chi tiết
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <div className="p-4 rounded-full bg-slate-50">
                                            <FileText className="h-12 w-12 opacity-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-slate-900">Không có đơn hàng nào</h3>
                                            <p className="text-sm">Bạn chưa thực hiện giao dịch nào tại cửa hàng.</p>
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
                        Trang {page} / {data.total_pages} (Tổng: {data.total} đơn hàng)
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
