"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Zap, ArrowRight, Building2, User, Mail, Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const registerSchema = z.object({
    full_name: z.string().min(2, "Họ tên quá ngắn"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
    business_name: z.string().min(2, "Tên kinh doanh quá ngắn"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post("/auth/register", {
                ...data,
                role: "OWNER"
            });
            const { access_token, user_id, email, role, owner_id } = response.data;

            login({ id: user_id, email, role, owner_id, full_name: data.full_name }, access_token);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-6 pb-12 font-sans selection:bg-indigo-100">
            <div className="max-w-md w-full">
                <div className="flex items-center justify-center gap-2 mb-8 group cursor-pointer">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Zap className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-slate-900">BizFlow</span>
                </div>

                <Card className="shadow-2xl shadow-indigo-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                    <CardHeader className="space-y-2 pt-10 pb-6 text-center">
                        <CardTitle className="text-3xl font-black text-slate-900">Bắt đầu ngay</CardTitle>
                        <CardDescription className="text-slate-500 font-medium px-4">
                            Chỉ mất 30 giây để thiết lập tài khoản của bạn.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-10 pb-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-100 font-bold flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Họ và tên</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        {...register("full_name")}
                                        placeholder="Nguyễn Văn A"
                                        className={cn("h-12 pl-11 rounded-xl bg-slate-50/50 border-slate-200", errors.full_name && "border-rose-500")}
                                    />
                                </div>
                                {errors.full_name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.full_name.message}</p>}
                            </div>

                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Tên cửa hàng / Hộ kinh doanh</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        {...register("business_name")}
                                        placeholder="BizFlow Shop"
                                        className={cn("h-12 pl-11 rounded-xl bg-slate-50/50 border-slate-200", errors.business_name && "border-rose-500")}
                                    />
                                </div>
                                {errors.business_name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.business_name.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="email"
                                        {...register("email")}
                                        placeholder="owner@example.com"
                                        className={cn("h-12 pl-11 rounded-xl bg-slate-50/50 border-slate-200", errors.email && "border-rose-500")}
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Mật khẩu</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        {...register("password")}
                                        placeholder="••••••••"
                                        className={cn("h-12 pl-11 rounded-xl bg-slate-50/50 border-slate-200", errors.password && "border-rose-500")}
                                    />
                                </div>
                                {errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>

                            <Button
                                disabled={isLoading}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg mt-2 group"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Đăng ký ngay <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-10 pb-10">
                        <p className="text-center text-sm font-medium text-slate-500">
                            Đã có tài khoản? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
