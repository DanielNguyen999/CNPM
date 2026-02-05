"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, User, Phone, FileText, CreditCard } from "lucide-react";
import { customersApi, CustomerSummary } from "@/lib/api/customers";
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
import Link from "next/link";
import { format } from "date-fns";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CustomersPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const pageSize = 10;
    const { canEditCustomers } = useAuthStore();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["customers", search, page],
        queryFn: () => customersApi.list({ q: search, page, page_size: pageSize }),
    });

    const handleExport = () => {
        if (!data?.items || data.items.length === 0) return;

        const headers = ["Mã KH", "Tên khách hàng", "Email", "Số điện thoại", "Số đơn", "Tổng nợ"];
        const csvContent = [
            headers.join(","),
            ...data.items.map((c: any) => [
                c.customer_code,
                `"${c.full_name}"`,
                `"${c.email || ""}"`,
                `"${c.phone || ""}"`,
                c.order_count,
                c.total_debt
            ].join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Danh_sach_khach_hang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
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
                                <BreadcrumbPage>Khách hàng</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
                    <p className="text-sm text-muted-foreground">Quản lý thông tin và công nợ khách hàng</p>
                </div>
                {canEditCustomers() && (
                    <div className="flex gap-2">
                        {/* <Button variant="outline" onClick={() => alert("Tính năng Import đang phát triển")}>
                            <FileText className="w-4 h-4 mr-2" /> Import Excel
                        </Button> */}
                        <Button variant="outline" onClick={handleExport}>
                            <FileText className="w-4 h-4 mr-2" /> Export Excel
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsFormOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm khách hàng
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.total ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Khách nợ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {data?.items.filter(c => c.total_debt > 0).length ?? 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên, số điện thoại..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[120px]">Mã KH</TableHead>
                            <TableHead>Tên khách hàng</TableHead>
                            <TableHead>Số điện thoại</TableHead>
                            <TableHead className="text-right">Số đơn</TableHead>
                            <TableHead className="text-right">Tổng nợ</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy khách hàng nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((customer: CustomerSummary) => (
                                <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium text-blue-600">{customer.customer_code}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{customer.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                                    </TableCell>
                                    <TableCell>{customer.phone || "-"}</TableCell>
                                    <TableCell className="text-right font-medium">{customer.order_count}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            {customer.total_debt > 0 ? (
                                                <Badge variant="destructive" className="font-bold">
                                                    {formatCurrency(customer.total_debt)}
                                                </Badge>
                                            ) : (
                                                <span className="text-emerald-600 font-bold text-sm">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/customers/${customer.id}`}>
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                Chi tiết
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
                            Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} trong tổng số {data.total}
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
                            <div className="text-sm font-medium">Trang {page} / {data.total_pages}</div>
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

            <CustomerFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
            />
        </div>
    );
}
