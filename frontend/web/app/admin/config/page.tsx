"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function AdminConfigPage() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Thành công",
            description: "Đã cập nhật cấu hình hệ thống",
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Cấu hình hệ thống</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Thiết lập chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Tên ứng dụng</Label>
                        <Input defaultValue="BizFlow Platform" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email hỗ trợ</Label>
                        <Input defaultValue="support@bizflow.vn" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Phiên bản</Label>
                        <Input defaultValue="2.0.0" readOnly className="bg-slate-100" />
                    </div>
                    <Button onClick={handleSave}>Lưu thay đổi</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mẫu báo cáo tài chính</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Cập nhật template cho báo cáo PDF xuất ra từ hệ thống.</p>
                    <Button variant="outline">Tải lên mẫu mới (.docx)</Button>
                </CardContent>
            </Card>
        </div>
    );
}
