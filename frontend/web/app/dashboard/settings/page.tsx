"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Store,
    Settings as SettingsIcon,
    Trash2,
    Plus,
    Save,
    Info,
    Building,
    Phone,
    MapPin,
    Truck,
    UserCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { unitsApi, Unit } from "@/lib/api/units";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function SettingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { canAccessSettings } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"profile" | "units" | "employees">("profile");

    // RBAC: Only OWNER can access settings
    useEffect(() => {
        if (!canAccessSettings()) {
            toast({
                variant: "destructive",
                title: "Không có quyền truy cập",
                description: "Chỉ chủ doanh nghiệp mới có thể truy cập cài đặt.",
            });
            router.push("/dashboard");
        }
    }, [canAccessSettings, router, toast]);

    // Unit State
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitDesc, setNewUnitDesc] = useState("");

    // Employee State
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [empEmail, setEmpEmail] = useState("");
    const [empPassword, setEmpPassword] = useState("");
    const [empFullName, setEmpFullName] = useState("");

    // Store State
    const [businessName, setBusinessName] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [footerNotes, setFooterNotes] = useState("");

    // Queries
    const { data: storeInfo, isLoading: storeLoading } = useQuery({
        queryKey: ["storeInfo"],
        queryFn: usersApi.getStoreInfo,
        enabled: activeTab === "profile"
    });

    useEffect(() => {
        if (storeInfo) {
            setBusinessName(storeInfo.business_name || "");
            setBusinessPhone(storeInfo.phone || ""); // Wait, did I add phone to store? User model has phone.
            setBusinessAddress(storeInfo.business_address || "");
            setFooterNotes(storeInfo.footer_notes || "");
        }
    }, [storeInfo]);

    const { data: units, isLoading: unitsLoading } = useQuery<Unit[]>({
        queryKey: ["units"],
        queryFn: unitsApi.list
    });

    const { data: employees, isLoading: employeesLoading } = useQuery({
        queryKey: ["employees"],
        queryFn: usersApi.listEmployees,
        enabled: activeTab === "employees"
    });

    // Mutations
    const createUnitMutation = useMutation({
        mutationFn: unitsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            setNewUnitName("");
            setNewUnitDesc("");
            toast({
                title: "Thành công",
                description: "Đã thêm đơn vị tính mới.",
            });
        }
    });

    const deleteUnitMutation = useMutation({
        mutationFn: unitsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            toast({
                title: "Đã xóa",
                description: "Đơn vị tính đã được loại bỏ.",
            });
        }
    });

    const createEmployeeMutation = useMutation({
        mutationFn: usersApi.createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setIsAddingEmployee(false);
            setEmpEmail("");
            setEmpPassword("");
            setEmpFullName("");
            toast({
                title: "Thành công",
                description: "Đã tạo tài khoản nhân viên mới.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi",
                description: error.response?.data?.detail || "Không thể tạo nhân viên.",
                variant: "destructive"
            });
        }
    });

    const updateStoreMutation = useMutation({
        mutationFn: usersApi.updateStoreInfo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["storeInfo"] });
            toast({
                title: "Thành công",
                description: "Thông tin cửa hàng đã được cập nhật.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi",
                description: error.response?.data?.detail || "Không thể cập nhật thông tin cửa hàng.",
                variant: "destructive"
            });
        }
    });

    const handleUpdateStore = (e: React.FormEvent) => {
        e.preventDefault();
        updateStoreMutation.mutate({
            business_name: businessName,
            business_address: businessAddress,
            // phone update? Usually owner phone is user phone.
        });
    };

    const handleCreateUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnitName) return;
        // Defaulting abbreviation to first 3 letters or same as name if short
        const abbreviation = newUnitName.length <= 3 ? newUnitName : newUnitName.substring(0, 3).toUpperCase();
        createUnitMutation.mutate({ name: newUnitName, abbreviation, description: newUnitDesc });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <Breadcrumb className="mb-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Cài đặt</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Cài đặt hệ thống</h2>
                <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" /> Quản lý thông tin cửa hàng và cấu hình chung
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <Button
                        variant={activeTab === "profile" ? "default" : "ghost"}
                        className={`w-full justify-start font-bold py-6 ${activeTab === "profile" ? "bg-indigo-600 shadow-lg shadow-indigo-100" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        <Store className="mr-3 h-5 w-5" /> Thông tin cửa hàng
                    </Button>
                    <Button
                        variant={activeTab === "units" ? "default" : "ghost"}
                        className={`w-full justify-start font-bold py-6 ${activeTab === "units" ? "bg-indigo-600 shadow-lg shadow-indigo-100" : ""}`}
                        onClick={() => setActiveTab("units")}
                    >
                        <Truck className="mr-3 h-5 w-5" /> Đơn vị tính
                    </Button>
                    <Button
                        variant={activeTab === "employees" ? "default" : "ghost"}
                        className={`w-full justify-start font-bold py-6 ${activeTab === "employees" ? "bg-indigo-600 shadow-lg shadow-indigo-100" : ""}`}
                        onClick={() => setActiveTab("employees")}
                    >
                        <UserCircle className="mr-3 h-5 w-5" /> Nhân viên
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === "profile" && (
                        <Card className="border-none shadow-md bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                                        <Building className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">Hồ sơ cửa hàng</CardTitle>
                                        <CardDescription className="text-slate-500 font-medium">Thông tin này sẽ hiển thị trên hoá đơn bán hàng</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <form onSubmit={handleUpdateStore} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-slate-700">Tên cửa hàng</Label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Ví dụ: BizFlow Store"
                                                    className="pl-10 h-11 border-slate-200"
                                                    value={businessName}
                                                    onChange={(e) => setBusinessName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-slate-700">Số điện thoại</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="090x xxx xxx"
                                                    className="pl-10 h-11 border-slate-200"
                                                    value={businessPhone}
                                                    onChange={(e) => setBusinessPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="font-bold text-slate-700">Địa chỉ kinh doanh</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Số nhà, đường, quận/huyện..."
                                                    className="pl-10 h-11 border-slate-200"
                                                    value={businessAddress}
                                                    onChange={(e) => setBusinessAddress(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="font-bold text-slate-700">Ghi chú chân trang hoá đơn</Label>
                                            <Textarea
                                                placeholder="Cảm ơn quý khách đã mua hàng!"
                                                className="min-h-[100px] border-slate-200"
                                                value={footerNotes}
                                                onChange={(e) => setFooterNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 font-bold shadow-lg shadow-emerald-100"
                                            disabled={updateStoreMutation.isPending}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {updateStoreMutation.isPending ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "units" && (
                        <div className="space-y-6">
                            {/* Add Unit Form */}
                            <Card className="border-none shadow-md bg-white">
                                <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
                                    <CardTitle className="text-lg font-bold">Thêm đơn vị mới</CardTitle>
                                    <Info className="h-4 w-4 text-slate-400" />
                                </CardHeader>
                                <CardContent className="p-6">
                                    <form onSubmit={handleCreateUnit} className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 space-y-2">
                                            <Label className="font-bold text-xs uppercase text-slate-500">Tên đơn vị</Label>
                                            <Input
                                                placeholder="Cái, Thùng, Kg, Bộ..."
                                                value={newUnitName}
                                                onChange={(e) => setNewUnitName(e.target.value)}
                                                className="h-11 border-slate-200"
                                            />
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <Label className="font-bold text-xs uppercase text-slate-500">Mô tả (không bắt buộc)</Label>
                                            <Input
                                                placeholder="Ghi chú thêm..."
                                                value={newUnitDesc}
                                                onChange={(e) => setNewUnitDesc(e.target.value)}
                                                className="h-11 border-slate-200"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="h-11 bg-indigo-600 hover:bg-indigo-700 font-bold px-6 shadow-md shadow-indigo-100"
                                            disabled={createUnitMutation.isPending || !newUnitName}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> THÊM
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Units List */}
                            <Card className="border-none shadow-md bg-white overflow-hidden">
                                <CardHeader className="bg-slate-50 border-b py-4">
                                    <CardTitle className="text-lg font-bold">Danh sách đơn vị tính</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {unitsLoading ? (
                                        <div className="p-6 space-y-4">
                                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                                        </div>
                                    ) : units && units.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {units.map((unit: Unit) => (
                                                <div key={unit.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{unit.name}</p>
                                                        {unit.description && <p className="text-xs text-slate-500 mt-1 font-medium">{unit.description}</p>}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        onClick={() => deleteUnitMutation.mutate(unit.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-16 text-center text-slate-400">
                                            <Truck className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Chưa có đơn vị tính nào</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "employees" && (
                        <div className="space-y-6">
                            <Card className="border-none shadow-md bg-white">
                                <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
                                    <CardTitle className="text-lg font-bold">Quản lý nhân viên</CardTitle>
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => setIsAddingEmployee(!isAddingEmployee)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> THÊM NHÂN VIÊN
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isAddingEmployee && (
                                        <div className="p-6 bg-indigo-50/30 border-b border-indigo-100 animate-in slide-in-from-top duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Họ và tên</Label>
                                                    <Input
                                                        placeholder="Nguyễn Văn A"
                                                        value={empFullName}
                                                        onChange={(e) => setEmpFullName(e.target.value)}
                                                        className="h-10 bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Email (Tên đăng nhập)</Label>
                                                    <Input
                                                        type="email"
                                                        placeholder="staff@example.com"
                                                        value={empEmail}
                                                        onChange={(e) => setEmpEmail(e.target.value)}
                                                        className="h-10 bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Mật khẩu</Label>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={empPassword}
                                                        onChange={(e) => setEmpPassword(e.target.value)}
                                                        className="h-10 bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end gap-3">
                                                <Button variant="ghost" size="sm" onClick={() => setIsAddingEmployee(false)}>Hủy</Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600"
                                                    onClick={() => createEmployeeMutation.mutate({
                                                        email: empEmail,
                                                        password: empPassword,
                                                        full_name: empFullName,
                                                        role: "EMPLOYEE"
                                                    })}
                                                    disabled={createEmployeeMutation.isPending || !empEmail || !empPassword || !empFullName}
                                                >
                                                    Tạo tài khoản
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="min-h-[400px]">
                                        {employeesLoading ? (
                                            <div className="p-6 space-y-3">
                                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                            </div>
                                        ) : employees && employees.length > 0 ? (
                                            <div className="divide-y divide-slate-100">
                                                {employees.map((emp: any) => (
                                                    <div key={emp.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                                {emp.full_name?.charAt(0).toUpperCase() || 'E'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{emp.full_name}</p>
                                                                <p className="text-xs text-slate-500 font-medium">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                                                                Hoạt động
                                                            </span>
                                                            {/* Manage button? */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                                <UserCircle className="h-16 w-16 mb-4 opacity-10" />
                                                <p className="text-sm font-bold uppercase tracking-widest">Chưa có nhân viên nào</p>
                                                <p className="text-xs mt-1">Các tài khoản nhân viên bạn tạo sẽ xuất hiện tại đây.</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
