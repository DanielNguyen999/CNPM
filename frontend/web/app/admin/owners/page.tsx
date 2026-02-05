"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Search, User, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";


import { MoreHorizontal, Lock, Unlock, Eye } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

export default function AdminOwnersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const { data: owners, isLoading, refetch } = useQuery({
        queryKey: ["admin", "owners"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/owners");
            return data;
        }
    });

    const handleStatusChange = async (ownerId: number, currentStatus: boolean) => {
        try {
            await apiClient.patch(`/admin/owners/${ownerId}/status`, {
                is_active: !currentStatus
            });
            toast({
                title: "Thành công",
                description: `Đã ${!currentStatus ? 'mở khóa' : 'khóa'} tài khoản thành công.`,
                variant: "default", // or success if available
                className: "bg-green-50 border-green-200 text-green-800"
            });
            refetch();
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
                variant: "destructive"
            });
        }
    };

    const filteredOwners = owners?.filter((o: any) =>
        o.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Chủ doanh nghiệp</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Danh sách chủ doanh nghiệp</h2>
                <p className="text-sm text-slate-500 mt-1">Quản lý các tài khoản đã đăng ký trên nền tảng BizFlow.</p>
            </div>

            <Card className="border shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm doanh nghiệp, chủ sở hữu, email..."
                            className="pl-9 border-slate-200 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Tên doanh nghiệp</TableHead>
                                <TableHead>Chủ sở hữu</TableHead>
                                <TableHead>Liên hệ</TableHead>
                                <TableHead>Gói dịch vụ</TableHead>
                                <TableHead className="text-center">Trạng thái</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredOwners.length > 0 ? (
                                filteredOwners.map((owner: any) => (
                                    <TableRow key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 font-bold">
                                                    {owner.business_name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{owner.business_name}</div>
                                                    <div className="text-xs text-slate-500">{owner.business_address || "Chưa cập nhật địa chỉ"}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-700">{owner.full_name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center text-xs text-slate-600 gap-1.5">
                                                    <Mail className="h-3 w-3" /> {owner.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 px-2 py-0.5 font-medium">
                                                {owner.plan_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={owner.is_active ? "outline" : "destructive"} className={`rounded-full ${owner.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}`}>
                                                {owner.is_active ? "Hoạt động" : "Đã khóa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/owners/${owner.id}`} className="cursor-pointer">
                                                            <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className={owner.is_active ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                                                        onClick={() => handleStatusChange(owner.id, owner.is_active)}
                                                    >
                                                        {owner.is_active ? (
                                                            <>
                                                                <Lock className="mr-2 h-4 w-4" /> Khóa tài khoản
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock className="mr-2 h-4 w-4" /> Mở khóa
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <Building2 className="h-12 w-12 opacity-20" />
                                            <p>Không tìm thấy chủ doanh nghiệp nào.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
