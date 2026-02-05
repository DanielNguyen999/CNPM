"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShieldCheck,
    CreditCard,
    Activity,
    AlertCircle
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminOwnerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ownerId = params.id as string;

    const { data: owner, isLoading } = useQuery({
        queryKey: ["admin", "owners", ownerId],
        queryFn: () => adminApi.getOwner(parseInt(ownerId)),
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96 col-span-2" />
                    <Skeleton className="h-96 col-span-1" />
                </div>
            </div>
        );
    }

    if (!owner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 gap-4">
                <AlertCircle className="h-16 w-16 opacity-20" />
                <h2 className="text-xl font-bold">Không tìm thấy chủ doanh nghiệp</h2>
                <Button onClick={() => router.push("/admin/owners")}>Quay lại danh sách</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/admin/owners">Chủ doanh nghiệp</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{owner.business_name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {owner.business_name}
                            </h1>
                            <Badge variant={owner.is_active ? "success" : "secondary"}>
                                {owner.is_active ? "Đang hoạt động" : "Tạm dừng"}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            ID Doanh nghiệp: #{owner.id} • Thành viên từ {format(new Date(owner.created_at), "MMMM yyyy", { locale: vi })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className={owner.is_active ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}>
                        {owner.is_active ? "Tạm dừng tài khoản" : "Kích hoạt tài khoản"}
                    </Button>
                    <Button variant="destructive">Xóa vĩnh viễn</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-sm bg-white overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-red-500" /> Thông tin doanh nghiệp
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên kinh doanh</label>
                                    <p className="mt-1 font-bold text-slate-900 text-lg">{owner.business_name}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ trụ sở</label>
                                    <div className="mt-1 flex items-start gap-2 text-slate-600">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                        <p className="text-sm">{owner.business_address || "Chưa cập nhật"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kế hoạch hiện tại</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge className="bg-indigo-600 text-white border-none py-1 px-3">
                                            {owner.plan_name || "Gói Cơ Bản"}
                                        </Badge>
                                        <span className="text-xs text-slate-400">Hết hạn: 12/2026</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã số thuế</label>
                                    <p className="mt-1 font-mono text-sm text-slate-700 font-bold">{owner.id}00-BIZFLOW</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" /> Chỉ số hoạt động
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</div>
                                    <div className="text-xl font-bold text-slate-900">0</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Đơn hàng</div>
                                    <div className="text-xl font-bold text-slate-900">0</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Nhân viên</div>
                                    <div className="text-xl font-bold text-slate-900">0</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng</div>
                                    <div className="text-xl font-bold text-slate-900">0</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User className="h-4 w-4 text-red-500" /> Đại diện sở hữu
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                        {owner.full_name?.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{owner.full_name}</div>
                                        <div className="text-xs text-slate-500 italic">Chủ sở hữu hệ thống</div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Mail className="h-4 w-4 text-slate-400" /> {owner.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="h-4 w-4 text-slate-400" /> {owner.phone || "Chưa cung cấp"}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm bg-white overflow-hidden border-t-4 border-t-red-500">
                        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-red-500" /> Bảo mật & Thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-red-600" />
                                <div>
                                    <div className="text-xs font-bold text-red-900">Trạng thái thanh toán</div>
                                    <div className="text-sm font-medium text-red-700">Đã thanh toán đủ</div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-widest h-10">
                                Khôi phục mật khẩu
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
