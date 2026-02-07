"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Edit, Trash2, CheckCircle2, Loader2, Save } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPlansPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        price: 0,
        max_employees: 1,
        max_products: 100,
        max_orders_per_month: 1000,
        is_active: true
    });

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            price: 0,
            max_employees: 1,
            max_products: 100,
            max_orders_per_month: 1000,
            is_active: true
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    // Queries
    const { data: plans, isLoading } = useQuery({
        queryKey: ["admin", "plans"],
        queryFn: async () => {
            const res = await apiClient.get("/admin/plans");
            return res.data;
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiClient.post("/admin/plans", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
            toast({ title: "Thành công", description: "Đã tạo gói dịch vụ mới.", className: "bg-green-50 border-green-200 text-green-900" });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Lỗi", description: error.response?.data?.detail || "Không thể tạo gói." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiClient.put(`/admin/plans/${currentId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
            toast({ title: "Thành công", description: "Đã cập nhật gói dịch vụ.", className: "bg-green-50 border-green-200 text-green-900" });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Lỗi", description: error.response?.data?.detail || "Không thể cập nhật gói." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/admin/plans/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
            toast({ title: "Thành công", description: "Đã xóa gói dịch vụ.", className: "bg-green-50 border-green-200 text-green-900" });
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Lỗi", description: error.response?.data?.detail || "Không thể xóa gói (đang được sử dụng)." });
        }
    });

    // Handlers
    const handleAdd = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleEdit = (plan: any) => {
        setFormData({
            name: plan.name,
            price: Number(plan.price),
            max_employees: plan.max_employees,
            max_products: plan.max_products,
            max_orders_per_month: plan.max_orders_per_month || 1000,
            is_active: plan.is_active
        });
        setIsEditing(true);
        setCurrentId(plan.id);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa gói này?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = () => {
        if (!formData.name) {
            toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng nhập tên gói." });
            return;
        }

        if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gói dịch vụ</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý các gói đăng ký và quyền hạn hệ thống.</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleAdd}>
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
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(plan)}>
                                        <Edit className="h-3 w-3 mr-1" /> Sửa
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(plan.id)}>
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
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Cập nhật gói" : "Thêm gói mới"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label>Tên gói</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Premium"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Giá (VND)</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Max Nhân viên</Label>
                                <Input
                                    type="number"
                                    value={formData.max_employees}
                                    onChange={(e) => setFormData({ ...formData, max_employees: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Max Sản phẩm</Label>
                                <Input
                                    type="number"
                                    value={formData.max_products}
                                    onChange={(e) => setFormData({ ...formData, max_products: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Trạng thái</Label>
                            <Select
                                value={formData.is_active ? "active" : "inactive"}
                                onValueChange={(val) => setFormData({ ...formData, is_active: val === "active" })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Tạm ngưng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-red-600 hover:bg-red-700">
                            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
