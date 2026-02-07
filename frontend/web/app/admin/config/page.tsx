"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminConfigPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        APP_NAME: "BizFlow Platform",
        SUPPORT_EMAIL: "support@bizflow.vn",
        VERSION: "2.0.0"
    });

    const { data: config, isLoading } = useQuery({
        queryKey: ["admin", "config"],
        queryFn: async () => {
            const res = await apiClient.get("/admin/config");
            return res.data;
        }
    });

    useEffect(() => {
        if (config) {
            setFormData({
                APP_NAME: config.APP_NAME || "BizFlow Platform",
                SUPPORT_EMAIL: config.SUPPORT_EMAIL || "support@bizflow.vn",
                VERSION: config.VERSION || "2.0.0"
            });
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiClient.post("/admin/config", { items: data });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "config"] });
            toast({ title: "Thành công", description: "Đã cập nhật cấu hình hệ thống", className: "bg-green-50 text-green-900 border-green-200" });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: "Lỗi", description: err.response?.data?.detail || "Không thể lưu cấu hình" });
        }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Cấu hình hệ thống</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Thiết lập chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <div className="py-8 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div> : (
                        <>
                            <div className="grid gap-2">
                                <Label>Tên ứng dụng</Label>
                                <Input
                                    value={formData.APP_NAME}
                                    onChange={(e) => setFormData({ ...formData, APP_NAME: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email hỗ trợ</Label>
                                <Input
                                    value={formData.SUPPORT_EMAIL}
                                    onChange={(e) => setFormData({ ...formData, SUPPORT_EMAIL: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Phiên bản</Label>
                                <Input
                                    value={formData.VERSION}
                                    onChange={(e) => setFormData({ ...formData, VERSION: e.target.value })}
                                />
                            </div>
                            <Button onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
                                {updateMutation.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Lưu thay đổi
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mẫu báo cáo tài chính</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Cập nhật template cho báo cáo PDF xuất ra từ hệ thống.</p>
                    <Button variant="outline" disabled>Tải lên mẫu mới (.docx)</Button>
                </CardContent>
            </Card>
        </div>
    );
}
