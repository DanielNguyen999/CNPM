"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/components/ui/use-toast";

export default function AdminReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const { toast } = useToast();

    const handleExport = async (type: "orders" | "users") => {
        setDownloading(type);
        try {
            const endpoint = type === "orders" ? "/admin/reports/export" : "/admin/reports/users/export";
            const response = await apiClient.get(endpoint, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = type === "orders" ? "bao_cao_don_hang.csv" : "danh_sach_nguoi_dung.csv";
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: "Thành công",
                description: "Đã tải xuống báo cáo thành công",
                className: "bg-green-50 border-green-200 text-green-900"
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể xuất báo cáo. Vui lòng thử lại sau.",
            });
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Báo cáo hệ thống</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý và xuất dữ liệu toàn sàn phục vụ mục tiêu quản lý.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b bg-slate-50/50">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            Báo cáo đơn hàng toàn hệ thống
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Tổng hợp tất cả đơn hàng từ các doanh nghiệp trên hệ thống.
                            Dữ liệu bao gồm mã đơn, khách hàng, số điện thoại, tổng tiền, trạng thái và ngày đặt.
                        </p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
                            onClick={() => handleExport("orders")}
                            disabled={downloading !== null}
                        >
                            {downloading === "orders" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Xuất báo cáo (.csv)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b bg-slate-50/50">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            Báo cáo tăng trưởng người dùng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Thống kê danh sách toàn bộ người dùng trong hệ thống.
                            Bao gồm thông tin liên hệ, vai trò (Admin/Owner/Employee), trạng thái hoạt động và ngày tham gia.
                        </p>
                        <Button
                            className="w-full font-semibold border-slate-200"
                            variant="outline"
                            onClick={() => handleExport("users")}
                            disabled={downloading !== null}
                        >
                            {downloading === "users" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Xuất báo cáo (.csv)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-dashed bg-slate-50/30">
                <CardContent className="p-8 text-center flex flex-col items-center gap-2">
                    <p className="text-sm text-slate-400 italic">Các mẫu báo cáo định dạng PDF và biểu đồ phân tích sâu sẽ sớm khả dụng.</p>
                </CardContent>
            </Card>
        </div>
    );
}
