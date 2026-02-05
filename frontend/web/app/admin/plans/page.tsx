"use client";

import { useQuery } from "@tanstack/react-query";
import { Settings, Plus, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminPlansPage() {
    const { data: plans, isLoading } = useQuery({
        queryKey: ["admin", "plans"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/plans");
            return data;
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gói dịch vụ</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý các gói đăng ký và quyền hạn hệ thống.</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" /> Thêm gói mới
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)
                ) : (plans && plans.length > 0) ? (
                    plans.map((plan: any) => (
                        <Card key={plan.id} className={`border-2 ${plan.is_active ? 'border-red-100' : 'border-slate-100 opacity-60'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                                    <Badge variant={plan.is_active ? "success" : "secondary"}>
                                        {plan.is_active ? "Hoạt động" : "Tắt"}
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold text-red-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price)}
                                    <span className="text-xs text-slate-400 font-normal"> /tháng</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="text-sm space-y-2">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span>Tối đa {plan.max_employees} nhân viên</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span>Tối đa {plan.max_products} sản phẩm</span>
                                    </li>
                                </ul>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1" disabled title="Chưa hỗ trợ backend">
                                        <Edit className="h-3 w-3 mr-1" /> Sửa
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" disabled title="Chưa hỗ trợ backend">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-slate-400">
                        <Settings className="h-16 w-16 opacity-20 mb-4" />
                        <p className="text-lg font-semibold">Chưa có gói dịch vụ nào</p>
                        <p className="text-sm mt-1">Nhấn "Thêm gói mới" để tạo gói đầu tiên</p>
                    </div>
                )}
            </div>

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Bảng so sánh chi tiết</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Tên gói</TableHead>
                                <TableHead>Giá (VND)</TableHead>
                                <TableHead>Nhân viên</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Đang tải...</TableCell>
                                </TableRow>
                            ) : plans?.map((plan: any) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-bold">{plan.name}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('vi-VN').format(plan.price)}</TableCell>
                                    <TableCell>{plan.max_employees}</TableCell>
                                    <TableCell>{plan.max_products}</TableCell>
                                    <TableCell>
                                        <Badge variant={plan.is_active ? "success" : "secondary"}>{plan.is_active ? "Active" : "Inactive"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Sửa</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
