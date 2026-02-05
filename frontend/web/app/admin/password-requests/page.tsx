"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import { adminApi } from "@/lib/api/admin";

export default function PasswordRequestsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ["password-requests"],
        queryFn: adminApi.listPasswordRequests,
    });

    const approveMutation = useMutation({
        mutationFn: adminApi.approvePasswordRequest,
        onSuccess: (data: any) => {
            toast({
                title: "Thành công",
                description: `Đã phê duyệt. Mật khẩu tạm thời: ${data.temp_password}`,
                className: "bg-green-50 text-green-900 border-green-200"
            });
            queryClient.invalidateQueries({ queryKey: ["password-requests"] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: adminApi.rejectPasswordRequest,
        onSuccess: () => {
            toast({
                title: "Đã từ chối",
                description: "Yêu cầu đã bị xóa khỏi danh sách.",
            });
            queryClient.invalidateQueries({ queryKey: ["password-requests"] });
        }
    });

    // ... handle reject click in the button below

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Yêu cầu cấp lại mật khẩu</h1>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Người dùng</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                                </TableCell>
                            </TableRow>
                        ) : requests?.map((req: any) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{req.role}</Badge>
                                </TableCell>
                                <TableCell>{req.email}</TableCell>
                                <TableCell>{req.created_at}</TableCell>
                                <TableCell>
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approveMutation.mutate(req.id)}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Duyệt
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(req.id)}>
                                        <XCircle className="h-4 w-4 mr-1" /> Từ chối
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
