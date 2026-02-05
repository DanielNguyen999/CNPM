"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, History, User, ShieldAlert, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/apiClient";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AuditLogsPage() {
    const [search, setSearch] = useState("");

    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: async () => {
            const res = await apiClient.get("/admin/audit-logs"); // Reusing admin log list but for owner it will be filtered by backend
            return res.data;
        }
    });

    const getActionBadge = (action: string) => {
        const colorMap: Record<string, string> = {
            "CREATE_ORDER": "bg-green-100 text-green-700",
            "REPAY_DEBT": "bg-blue-100 text-blue-700",
            "ADJUST_STOCK": "bg-amber-100 text-amber-700",
            "CREATE_PRODUCT": "bg-indigo-100 text-indigo-700",
            "DELETE_PRODUCT": "bg-red-100 text-red-700",
            "UPDATE_PRODUCT": "bg-slate-100 text-slate-700",
        };
        return (
            <Badge className={colorMap[action] || "bg-gray-100 text-gray-700"}>
                {action}
            </Badge>
        );
    };

    const filteredLogs = logs?.filter((log: any) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            log.action?.toLowerCase().includes(searchLower) ||
            log.resource_type?.toLowerCase().includes(searchLower) ||
            log.user_full_name?.toLowerCase().includes(searchLower)
        );
    }) || [];

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
                                <BreadcrumbPage>Nhật ký hệ thống</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h1>
                    <p className="text-sm text-muted-foreground">Theo dõi toàn bộ các hoạt động nhạy cảm trong hệ thống</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo hành động, loại tài nguyên, người dùng..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Người thực hiện</TableHead>
                                <TableHead>Hành động</TableHead>
                                <TableHead>Tài nguyên</TableHead>
                                <TableHead>Chi tiết</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLogs?.length > 0 ? (
                                filteredLogs.map((log: any) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="text-sm font-medium">
                                            {format(new Date(log.created_at), "HH:mm dd/MM/yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{log.user_full_name || `User ID: ${log.user_id}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{log.resource_type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground max-w-[300px] truncate" title={log.details}>
                                            {log.details}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <History className="h-8 w-8 text-muted-foreground/50" />
                                            <p className="text-muted-foreground font-medium">
                                                {search ? "Không tìm thấy nhật ký nào khớp với tìm kiếm" : "Chưa có nhật ký hoạt động nào"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
