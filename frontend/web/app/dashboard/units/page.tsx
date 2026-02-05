"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { unitsApi } from "@/lib/api/units";
import { useToast } from "@/components/ui/use-toast";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function UnitsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState("");
    const [newAbbr, setNewAbbr] = useState("");
    const [unitToDelete, setUnitToDelete] = useState<number | null>(null);

    const { data: units, isLoading } = useQuery({
        queryKey: ["units"],
        queryFn: unitsApi.list,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => unitsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            setNewName("");
            setNewAbbr("");
            toast({ title: "Đã thêm đơn vị" });
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: err.response?.data?.detail || "Không thể thêm đơn vị"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => unitsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            toast({ title: "Đã xóa đơn vị" });
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newAbbr) return;
        createMutation.mutate({ name: newName, abbreviation: newAbbr });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <Breadcrumb className="mb-2">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Đơn vị</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý đơn vị</h2>
                <p className="text-sm text-slate-500 mt-1">Định nghĩa các đơn vị tính cho sản phẩm (Cái, Thùng, Kg...)</p>
            </div>

            <Card className="border shadow-sm bg-white">
                <CardContent className="p-6">
                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Tên đơn vị</label>
                            <Input
                                placeholder="Ví dụ: Thùng, Cái..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 w-full sm:w-32">
                            <label className="text-xs font-bold uppercase text-slate-500">Viết tắt</label>
                            <Input
                                placeholder="T, C..."
                                value={newAbbr}
                                onChange={(e) => setNewAbbr(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-2" /> Thêm mới
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Tên đơn vị</TableHead>
                            <TableHead>Viết tắt</TableHead>
                            <TableHead className="w-[100px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (units?.length ?? 0) > 0 ? (
                            units?.map((unit: any) => (
                                <TableRow key={unit.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-bold text-slate-700">{unit.name}</TableCell>
                                    <TableCell>{unit.abbreviation}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-rose-600"
                                            onClick={() => setUnitToDelete(unit.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-48 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Package className="h-10 w-10 opacity-20" />
                                        <p>Chưa có đơn vị nào.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ConfirmDialog
                isOpen={!!unitToDelete}
                onClose={() => setUnitToDelete(null)}
                onConfirm={() => {
                    if (unitToDelete) {
                        deleteMutation.mutate(unitToDelete);
                        setUnitToDelete(null);
                    }
                }}
                title="Xóa đơn vị?"
                description="Hành động này không thể hoàn tác. Các sản phẩm đang sử dụng đơn vị này có thể gặp lỗi hiển thị."
            />
        </div>
    );
}
