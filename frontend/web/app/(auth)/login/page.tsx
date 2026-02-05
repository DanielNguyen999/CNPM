"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  MessageSquareQuote
} from "lucide-react";
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
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "owner1@example.com",
      password: "password123",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Login to get token
      const loginResponse = await api.post("/auth/login", data);
      const { access_token } = loginResponse.data;

      // 2. Set token temporarily to allow /me call (interceptor picks it up)
      localStorage.setItem("access_token", access_token);

      // 3. Call /me to get full profile
      const meResponse = await api.get("/auth/me");
      const userProfile = meResponse.data;

      // 4. Update store
      login(
        {
          id: userProfile.user_id,
          email: userProfile.email,
          role: userProfile.role,
          owner_id: userProfile.owner_id,
          full_name: userProfile.full_name
        },
        access_token
      );

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Đăng nhập thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-6 font-sans selection:bg-indigo-100 italic-none">
      <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Column: Brand & Trust */}
        <div className="hidden lg:flex flex-col space-y-12">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-transform">
              <Zap className="h-7 w-7" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900">
              BizFlow
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Quản lý cửa hàng <br />
              <span className="text-indigo-600">theo cách hiện đại</span>
            </h1>
            <p className="text-xl text-slate-600 font-medium max-w-lg leading-relaxed">
              Nền tảng vận hành tập trung giúp bạn bứt phá doanh thu và tối ưu hóa mọi nguồn lực kinh doanh.
            </p>
          </div>

          <div className="space-y-6">
            <FeaturePoint
              icon={<TrendingUp className="h-6 w-6 text-indigo-600" />}
              text="POS nhanh, chính xác & phím tắt thông minh"
            />
            <FeaturePoint
              icon={<ShieldCheck className="h-6 w-6 text-indigo-600" />}
              text="Quản lý kho tập trung & Đối soát công nợ"
            />
            <FeaturePoint
              icon={<Zap className="h-6 w-6 text-indigo-600" />}
              text="AI hỗ trợ nhập đơn từ tin nhắn tự động"
            />
          </div>

          {/* Testimonial Card */}
          <Card className="max-w-md border-none bg-white/60 backdrop-blur-md shadow-2xl shadow-indigo-100 rounded-3xl p-2">
            <CardContent className="p-8 space-y-6">
              <div className="flex text-amber-400 gap-1">
                {[1, 2, 3, 4, 5].map(i => <Zap key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-lg text-slate-700 font-bold italic leading-relaxed">
                "BizFlow đã thay đổi hoàn toàn cách tôi quản lý 3 cửa hàng của mình. Mọi thứ giờ đây minh bạch và tự động hơn bao giờ hết."
              </p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black shadow-lg">
                  TH
                </div>
                <div>
                  <div className="font-black text-slate-900">Trần Hoàng Nam</div>
                  <div className="text-sm text-slate-500 font-semibold">Chủ chuỗi cửa hàng RetailPlus</div>
                </div>
                <MessageSquareQuote className="ml-auto h-8 w-8 text-slate-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Login Card */}
        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md shadow-2xl shadow-indigo-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative group">
            {/* Decorative Top Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <CardHeader className="space-y-4 pt-12 pb-8 text-center">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Zap className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">Chào mừng</CardTitle>
              <CardDescription className="text-base text-slate-500 font-medium">
                Hãy đăng nhập để bắt đầu phiên làm việc.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-10 pb-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="p-4 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100 font-bold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-black text-slate-700 uppercase tracking-wider ml-1">Email của bạn</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className={cn(
                      "h-14 rounded-xl border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 font-medium",
                      errors.email && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                    disabled={isLoading}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 font-bold ml-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-sm font-black text-slate-700 uppercase tracking-wider">Mật khẩu</Label>
                    <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Quên?</Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "h-14 rounded-xl border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 font-medium",
                      errors.password && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                    disabled={isLoading}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-500 font-bold ml-1">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 group"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>Đăng nhập ngay <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-6 px-10 pb-12">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-white px-4 text-slate-400">Hoặc</span>
                </div>
              </div>

              <div className="flex justify-center gap-4 w-full">
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-bold">
                  Google
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-bold">
                  Facebook
                </Button>
              </div>

              <p className="text-center text-sm text-slate-500 font-medium pb-2">
                Chưa có tài khoản? <Link href="/register" className="text-indigo-600 hover:underline font-bold">Đăng ký ngay</Link>
              </p>

              <p className="text-center text-xs text-slate-400 font-medium px-4 leading-relaxed">
                Bằng cách đăng nhập, bạn đồng ý với <Link href="#" className="text-slate-600 hover:underline font-bold">Điều khoản</Link> và <Link href="#" className="text-slate-600 hover:underline font-bold">Chính sách</Link> của chúng tôi.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] -z-10 opacity-60" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-[100px] -z-10 opacity-50" />
    </div>
  );
}

function FeaturePoint({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="h-10 w-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-lg font-bold text-slate-700 tracking-tight">{text}</span>
    </div>
  );
}
