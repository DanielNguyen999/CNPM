"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Search, Mail, Shield, KeyRound, Loader2, Calendar } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/apiClient";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/users");
            return data;
        }
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async ({ userId, password }: { userId: number, password: string }) => {
            await apiClient.patch(`/admin/users/${userId}/password`, {
                new_password: password
            });
        },
        onSuccess: () => {
            toast({
                title: "Thành công",
                description: `Đã đặt lại mật khẩu cho người dùng ${selectedUser?.email}.`,
                className: "bg-green-50 border-green-200 text-green-800"
            });
            handleCloseResetDialog();
        },
        onError: () => {
            toast({
                title: "Lỗi",
                description: "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
                variant: "destructive"
            });
        }
    });

    const filteredUsers = users?.filter((u: any) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleOpenResetDialog = (user: any) => {
        setSelectedUser(user);
        setNewPassword("");
        setResetPasswordOpen(true);
    };

    const handleCloseResetDialog = () => {
        setResetPasswordOpen(false);
        setSelectedUser(null);
        setNewPassword("");
    };

    const confirmResetPassword = () => {
        if (!selectedUser || !newPassword) return;
        resetPasswordMutation.mutate({ userId: selectedUser.id, password: newPassword });
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "ADMIN": return "default"; // black
            case "OWNER": return "secondary"; // gray
            case "EMPLOYEE": return "outline";
            default: return "outline";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Người dùng hệ thống</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Người dùng hệ thống</h2>
                <p className="text-sm text-slate-500 mt-1">Quản lý tất cả tài khoản người dùng và phân quyền.</p>
            </div>

            <Card className="border shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm theo tên, email, vai trò..."
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
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Họ và tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Ngày tham gia</TableHead>
                                <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-slate-500 text-xs">#{user.id}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{user.full_name || "Chưa cập nhật"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-slate-600 gap-1.5">
                                                <Mail className="h-3 w-3" /> {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                            </div>
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
                                                    <DropdownMenuItem onClick={() => handleOpenResetDialog(user)}>
                                                        <KeyRound className="mr-2 h-4 w-4" /> Đặt lại mật khẩu
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
                                            <User className="h-12 w-12 opacity-20" />
                                            <p>Không tìm thấy người dùng nào.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={resetPasswordOpen} onOpenChange={handleCloseResetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đặt lại mật khẩu</DialogTitle>
                        <DialogDescription>
                            Nhập mật khẩu mới cho người dùng <strong>{selectedUser?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Mật khẩu mới</Label>
                            <Input
                                id="new-password"
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseResetDialog}>Hủy</Button>
                        <Button
                            onClick={confirmResetPassword}
                            disabled={!newPassword || resetPasswordMutation.isPending}
                        >
                            {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
