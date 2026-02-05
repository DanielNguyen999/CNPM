"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCircle, Mail, Phone, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { usersApi } from "@/lib/api/users";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const { toast } = useToast();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [phone, setPhone] = useState(user?.phone || "");

    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setPhone(user.phone || "");
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: usersApi.updateProfile,
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            toast({
                title: "Thành công",
                description: "Thông tin cá nhân đã được cập nhật.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi",
                description: error.response?.data?.detail || "Không thể cập nhật thông tin.",
                variant: "destructive"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({ full_name: fullName, phone });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <Breadcrumb className="mb-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Hồ sơ</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Hồ sơ cá nhân</h2>
                <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> Quản lý thông tin tài khoản của bạn
                </p>
            </div>

            <Card className="border-none shadow-md bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                            <UserCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Thông tin định danh</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Cập nhật tên hiển thị và số điện thoại liên hệ</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Địa chỉ Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input value={user?.email || ""} disabled className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-500" />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Email không thể thay đổi</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Vai trò</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input value={user?.role || ""} disabled className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-500 uppercase font-black tracking-widest" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Họ và tên</Label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="h-11 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Số điện thoại</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="09xxx"
                                        className="pl-10 h-11 border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 font-bold shadow-lg shadow-indigo-100"
                                disabled={updateProfileMutation.isPending}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {updateProfileMutation.isPending ? "ĐANG LƯU..." : "LƯU THÔNG TIN"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
