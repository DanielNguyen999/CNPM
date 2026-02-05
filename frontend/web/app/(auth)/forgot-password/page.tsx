"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Không thể gửi yêu cầu');
            }

            setIsSent(true);
            toast({
                title: "Thành công",
                description: "Yêu cầu đã được gửi. Vui lòng chờ admin phê duyệt.",
                className: "bg-green-50 border-green-200 text-green-900"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error.message || "Không thể gửi yêu cầu. Vui lòng thử lại."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <Send className="h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center font-bold text-slate-900">Quên mật khẩu?</CardTitle>
                    <CardDescription className="text-center">
                        Nhập email của bạn để gửi yêu cầu cấp lại mật khẩu cho Admin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email đăng ký</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gửi yêu cầu"}
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 text-center">
                            <p className="font-semibold">Yêu cầu đã được gửi!</p>
                            <p>Vui lòng kiểm tra email hoặc chờ Admin liên hệ để cấp lại mật khẩu mới.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <Link href="/login" className="flex items-center text-sm text-slate-600 hover:text-slate-900 font-medium">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
