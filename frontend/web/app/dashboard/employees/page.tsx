"use client";

/**
 * Employees Management Page
 * Standardized Breadcrumbs & ConfirmDialog: 100%
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, User, Mail, Phone, Shield, Edit2, Trash2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/apiClient";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/DraggableDialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function EmployeesPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { canManageEmployees } = useAuthStore();
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        position: "Nhân viên",
    });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [permissionEmployee, setPermissionEmployee] = useState<any>(null);
    const [employeePermissions, setEmployeePermissions] = useState<any[]>([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

    // RBAC: Only OWNER can access this page
    useEffect(() => {
        if (!canManageEmployees()) {
            toast({
                variant: "destructive",
                title: "Không có quyền truy cập",
                description: "Chỉ chủ doanh nghiệp mới có thể quản lý nhân viên.",
            });
            router.push("/dashboard");
        }
    }, [canManageEmployees, router, toast]);

    const { data: employees, isLoading } = useQuery({
        queryKey: ["employees"],
        queryFn: async () => {
            const res = await apiClient.get("/users/employees");
            return res.data;
        }
    });

    // Filter employees by search term
    const filteredEmployees = employees?.filter((emp: any) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            emp.full_name?.toLowerCase().includes(searchLower) ||
            emp.email?.toLowerCase().includes(searchLower)
        );
    }) || [];

    const handleEdit = (employee: any) => {
        setEditingEmployee(employee);
        setFormData({
            full_name: employee.full_name || "",
            email: employee.email || "",
            password: "",
            phone: employee.phone || "",
            position: employee.position || "Nhân viên",
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setEmployeeToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!employeeToDelete) return;
        setIsSubmitting(true);
        try {
            await apiClient.delete(`/users/employees/${employeeToDelete}`);
            toast({
                title: "Thành công",
                description: "Đã xóa nhân viên",
            });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setIsDeleteDialogOpen(false);
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: err.response?.data?.detail || "Không thể xóa nhân viên",
            });
        } finally {
            setIsSubmitting(false);
            setEmployeeToDelete(null);
        }
    };

    const handleOpenPermissions = async (employee: any) => {
        setPermissionEmployee(employee);
        setIsLoadingPermissions(true);
        setIsPermissionsModalOpen(true);
        try {
            const res = await apiClient.get(`/users/employees/${employee.id}/permissions`);
            // Default permissions list for UI
            const defaultPerms = [
                { permission_key: "can_edit_products", label: "Chỉnh sửa sản phẩm", is_granted: false },
                { permission_key: "can_adjust_inventory", label: "Điều chỉnh kho", is_granted: false },
                { permission_key: "can_view_reports", label: "Xem báo cáo doanh thu", is_granted: false },
                { permission_key: "can_delete_orders", label: "Xóa đơn hàng", is_granted: false },
            ];

            // Merge with backend data
            const merged = defaultPerms.map(dp => {
                const found = res.data.find((p: any) => p.permission_key === dp.permission_key);
                return found ? { ...dp, is_granted: found.is_granted } : dp;
            });

            setEmployeePermissions(merged);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể tải danh sách quyền",
            });
        } finally {
            setIsLoadingPermissions(false);
        }
    };

    const handleSavePermissions = async () => {
        if (!permissionEmployee) return;
        setIsSubmitting(true);
        try {
            await apiClient.post(`/users/employees/${permissionEmployee.id}/permissions`, employeePermissions);
            toast({
                title: "Thành công",
                description: "Đã cập nhật quyền hạn cho nhân viên",
            });
            setIsPermissionsModalOpen(false);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể lưu quyền hạn",
            });
        } finally {
            setIsSubmitting(false);
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
                                <BreadcrumbPage>Nhân viên</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
                    <p className="text-sm text-muted-foreground">Quản lý tài khoản và phân quyền cho nhân viên của bạn</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhân viên
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo tên, email..."
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
                                <TableHead>Tên nhân viên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Chức vụ</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredEmployees?.length > 0 ? (
                                filteredEmployees.map((emp: any) => (
                                    <TableRow key={emp.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                                        <TableCell>{emp.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                                                {emp.position || "Nhân viên"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={emp.is_active ? "success" : "secondary"}>
                                                {emp.is_active ? "Đang làm việc" : "Nghỉ việc"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-indigo-600"
                                                    title="Phân quyền"
                                                    onClick={() => handleOpenPermissions(emp)}
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-blue-600"
                                                    onClick={() => handleEdit(emp)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteClick(emp.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="h-8 w-8 text-muted-foreground/50" />
                                            <p className="text-muted-foreground font-medium">
                                                {search ? "Không tìm thấy nhân viên nào khớp với tìm kiếm" : "Chưa có nhân viên nào trong hệ thống"}
                                            </p>
                                            {!search && (
                                                <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsAddModalOpen(true)}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Thêm nhân viên ngay
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DraggableDialogContent className="sm:max-w-md" title="Thêm nhân viên mới">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSubmitting(true);
                        try {
                            await apiClient.post("/users/employees", {
                                ...formData,
                                role: "EMPLOYEE"
                            });
                            toast({
                                title: "Thành công",
                                description: "Đã thêm nhân viên thành công",
                            });
                            queryClient.invalidateQueries({ queryKey: ["employees"] });
                            setIsAddModalOpen(false);
                            setFormData({ full_name: "", email: "", password: "", phone: "", position: "Nhân viên" });
                        } catch (err: any) {
                            toast({
                                variant: "destructive",
                                title: "Lỗi",
                                description: err.response?.data?.detail || "Không thể thêm nhân viên",
                            });
                        } finally {
                            setIsSubmitting(false);
                        }
                    }} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ename">Họ và tên</Label>
                            <Input id="ename" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eemail">Email</Label>
                            <Input id="eemail" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="nv-a@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="epass">Mật khẩu</Label>
                            <Input id="epass" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ephone">Số điện thoại</Label>
                            <Input id="ephone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="090..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="epos">Chức vụ</Label>
                            <Input id="epos" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Nhân viên bán hàng" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DraggableDialogContent>
            </Dialog>

            {/* Edit Employee Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DraggableDialogContent className="sm:max-w-md" title="Chỉnh sửa nhân viên">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSubmitting(true);
                        try {
                            // Update basic info
                            await apiClient.put(`/users/employees/${editingEmployee?.id}`, {
                                full_name: formData.full_name,
                                phone: formData.phone,
                            });

                            // Update password if provided
                            if (formData.password && formData.password.trim()) {
                                await apiClient.patch(`/users/employees/${editingEmployee?.id}/password`, {
                                    new_password: formData.password
                                });
                            }

                            toast({
                                title: "Thành công",
                                description: formData.password ? "Đã cập nhật thông tin và mật khẩu nhân viên" : "Đã cập nhật thông tin nhân viên",
                            });
                            queryClient.invalidateQueries({ queryKey: ["employees"] });
                            setIsEditModalOpen(false);
                            setEditingEmployee(null);
                            setFormData({ full_name: "", email: "", password: "", phone: "", position: "Nhân viên" });
                        } catch (err: any) {
                            toast({
                                variant: "destructive",
                                title: "Lỗi",
                                description: err.response?.data?.detail || "Không thể cập nhật nhân viên",
                            });
                        } finally {
                            setIsSubmitting(false);
                        }
                    }} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Họ và tên</Label>
                            <Input id="edit-name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" type="email" value={formData.email} disabled className="bg-slate-100" />
                            <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-pass">Mật khẩu mới (để trống nếu không đổi)</Label>
                            <Input id="edit-pass" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Số điện thoại</Label>
                            <Input id="edit-phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="090..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-pos">Chức vụ</Label>
                            <Input id="edit-pos" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Nhân viên" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DraggableDialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa nhân viên"
                description="Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác."
                confirmText="Xóa nhân viên"
                variant="destructive"
                isLoading={isSubmitting}
            />

            {/* Permissions Modal */}
            <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
                <DraggableDialogContent className="sm:max-w-md" title={`Phân quyền: ${permissionEmployee?.full_name}`}>
                    <div className="space-y-4 py-4">
                        {isLoadingPermissions ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {employeePermissions.map((perm, idx) => (
                                    <div key={perm.permission_key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                                        <div>
                                            <p className="font-medium text-sm">{perm.label}</p>
                                            <p className="text-xs text-muted-foreground">{perm.permission_key}</p>
                                        </div>
                                        <div
                                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${perm.is_granted ? 'bg-primary' : 'bg-slate-300'}`}
                                            onClick={() => {
                                                const newPerms = [...employeePermissions];
                                                newPerms[idx].is_granted = !newPerms[idx].is_granted;
                                                setEmployeePermissions(newPerms);
                                            }}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${perm.is_granted ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPermissionsModalOpen(false)}>Đóng</Button>
                            <Button type="button" disabled={isSubmitting || isLoadingPermissions} onClick={handleSavePermissions}>
                                {isSubmitting ? "Đang lưu..." : "Lưu quyền hạn"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DraggableDialogContent>
            </Dialog>
        </div>
    );
}
