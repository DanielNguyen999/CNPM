"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

export default function AdminAnnouncementsPage() {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    const publishMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post("/admin/announcements", { title, message });
            return data;
        },
        onSuccess: (data) => {
            toast({
                title: "Thành công",
                description: data.message,
                className: "bg-green-50 border-green-200 text-green-900"
            });
            setTitle("");
            setMessage("");
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error.response?.data?.detail || "Không thể gửi thông báo."
            });
        }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Quản lý thông báo (Announcements)</h1>

            <Card className="border-red-100 shadow-md">
                <CardHeader>
                    <CardTitle>Tạo thông báo mới</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề</label>
                        <Input
                            placeholder="VD: Bảo trì hệ thống - 20/10/2024"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nội dung</label>
                        <Textarea
                            placeholder="Nhập nội dung thông báo..."
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" disabled={publishMutation.isPending}>Gửi thử (Test)</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => publishMutation.mutate()}
                            disabled={!title || !message || publishMutation.isPending}
                        >
                            {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Đăng thông báo
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử thông báo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground text-center py-8">
                        Lịch sử đang được cập nhật...
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
