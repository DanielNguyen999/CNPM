"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, User, FileText, CreditCard } from "lucide-react";
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
import { notifications } from "@/lib/notifications";

export default function CustomersPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const pageSize = 10;
    const { canEditCustomers } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ["customers", search, page],
        queryFn: () => customersApi.list({ q: search, page, page_size: pageSize }),
    });

    const handleExport = () => {
        if (!data?.items || data.items.length === 0) {
            notifications.error("Lỗi", "Không có dữ liệu khách hàng để xuất.");
            return;
        }

        try {
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
            notifications.success("Thành công", "Đã xuất file dữ liệu khách hàng.");
        } catch (error) {
            notifications.error("Lỗi", "Quá trình xuất dữ liệu gặp sự cố.");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Khách hàng</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý danh sách, thông tin liên hệ và lịch sử mua hàng.</p>
                </div>
                {canEditCustomers() && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport} className="border-slate-200">
                            <FileText className="w-4 h-4 mr-2" /> Xuất Excel
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100" onClick={() => setIsFormOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Tổng khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold text-slate-900">{data?.total ?? 0}</div>
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <User className="h-5 w-5 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-white border-l-4 border-rose-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-rose-600 uppercase tracking-wider">Khách nợ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold text-slate-900">
                                {data?.items.filter(c => c.total_debt > 0).length ?? 0}
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <CreditCard className="h-5 w-5 text-rose-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2 bg-white p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm theo tên, số điện thoại, mã KH..."
                        className="pl-9 border-slate-200"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
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
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <User className="h-10 w-10 mb-2 opacity-20" />
                                        <p>Không tìm thấy khách hàng nào.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((customer: CustomerSummary) => (
                                <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors group">
                                    <TableCell className="font-mono text-xs font-bold text-slate-500">{customer.customer_code}</TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{customer.full_name}</div>
                                        <div className="text-xs text-slate-400">{customer.email || "Chưa có email"}</div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-medium">{customer.phone || "-"}</TableCell>
                                    <TableCell className="text-right font-medium text-slate-700">{customer.order_count}</TableCell>
                                    <TableCell className="text-right">
                                        {customer.total_debt > 0 ? (
                                            <Badge variant="destructive" className="font-bold bg-rose-100 text-rose-700 border-none shadow-none">
                                                {formatCurrency(customer.total_debt)}
                                            </Badge>
                                        ) : (
                                            <span className="text-emerald-600 font-bold text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/customers/${customer.id}`}>
                                            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold">
                                                Chi tiết →
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {data && data.total_pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Trang {page} / {data.total_pages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 border-slate-200"
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                                disabled={page === data.total_pages}
                                className="h-8 border-slate-200"
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
