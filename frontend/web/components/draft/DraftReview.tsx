"use client";

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    Save,
    ShoppingCart,
    User,
    Package,
    Trash2,
    HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { draftOrdersApi } from '@/lib/api/draftOrders';
import { useRouter } from 'next/navigation';

interface DraftReviewProps {
    draft: any;
    onUpdate: (updatedDraft: any) => void;
}

export const DraftReview = ({ draft, onUpdate }: DraftReviewProps) => {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [editedData, setEditedData] = useState<any>(draft.parsed_data);

    useEffect(() => {
        setEditedData(draft.parsed_data);
    }, [draft]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...editedData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditedData({ ...editedData, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = editedData.items.filter((_: any, i: number) => i !== index);
        setEditedData({ ...editedData, items: newItems });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await draftOrdersApi.updateDraft(draft.id, { parsed_data: editedData });
            onUpdate(updated);
            alert('Lưu bản nháp thành công!');
        } catch (error) {
            alert('Lỗi khi lưu bản nháp.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await draftOrdersApi.confirmDraft(draft.id, editedData);
            alert('Xác nhận tạo đơn hàng thành công!');
            router.push('/orders');
        } catch (error: any) {
            alert('Lỗi khi xác nhận đơn hàng: ' + (error.response?.data?.detail || 'Không xác định'));
        } finally {
            setIsConfirming(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const confidenceColor = (score: number) => {
        if (score >= 0.8) return 'success';
        if (score >= 0.5) return 'warning';
        return 'destructive';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">Kiểm tra kết quả AI</h2>
                    <Badge variant={confidenceColor(draft.confidence_score)}>
                        Độ tin cậy: {(draft.confidence_score * 100).toFixed(0)}%
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSave} disabled={isSaving || isConfirming}>
                        <Save className="h-4 w-4 mr-2" /> Lưu nháp
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirm} disabled={isSaving || isConfirming}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Xác nhận đơn hàng
                    </Button>
                </div>
            </div>

            {draft.missing_fields?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-800">Thông tin còn thiếu:</p>
                        <ul className="text-sm text-amber-700 list-disc list-inside">
                            {draft.missing_fields.map((field: string, idx: number) => (
                                <li key={idx}>Cần bổ sung: <span className="font-bold underline italic capitalize">{field}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* Customer Info */}
                <Card className="col-span-12 lg:col-span-4 border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4 text-indigo-600" /> Thông tin khách hàng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Tên khách hàng</label>
                            <Input
                                value={editedData.customer?.name || ''}
                                onChange={(e) => setEditedData({ ...editedData, customer: { ...editedData.customer, name: e.target.value } })}
                                placeholder="Tên khách hàng..."
                                className={!editedData.customer?.name ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200" : ""}
                            />
                            {editedData.customer?.name && !editedData.customer?.id && editedData.customer?.name.toLowerCase() !== 'khách lẻ' && (
                                <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-1 rounded border border-amber-100 mt-1 flex items-center gap-1">
                                    ✨ Khách hàng mới! Hệ thống sẽ tự động lưu vào danh bạ.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Số điện thoại</label>
                            <Input
                                value={editedData.customer?.phone || ''}
                                onChange={(e) => setEditedData({ ...editedData, customer: { ...editedData.customer, phone: e.target.value } })}
                                placeholder="Số điện thoại..."
                            />
                        </div>
                        <div className="pt-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_debt"
                                checked={editedData.payment?.is_debt || false}
                                onChange={(e) => setEditedData({ ...editedData, payment: { ...editedData.payment, is_debt: e.target.checked } })}
                                className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                            />
                            <label htmlFor="is_debt" className="text-sm font-medium">Khách nợ đơn này</label>
                        </div>
                    </CardContent>
                </Card>

                {/* Items List */}
                <Card className="col-span-12 lg:col-span-8 border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4 text-indigo-600" /> Danh sách sản phẩm
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead className="w-[120px]">Đơn vị</TableHead>
                                    <TableHead className="w-[100px] text-center">Số lượng</TableHead>
                                    <TableHead className="w-[150px] text-right">Đơn giá</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {editedData.items?.map((item: any, idx: number) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <Input
                                                value={item.product_name || ''}
                                                onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                                                className={`h-8 font-medium ${!item.product_name ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200 placeholder:text-rose-400" : ""}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={item.unit_name || ''}
                                                onChange={(e) => handleItemChange(idx, 'unit_name', e.target.value)}
                                                className={`h-8 text-xs ${!item.unit_name ? "border-rose-300 bg-rose-50" : ""}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.quantity || 0}
                                                onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="h-8 text-center"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-end gap-1">
                                                <Input
                                                    type="number"
                                                    value={item.unit_price || 0}
                                                    onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-right font-medium"
                                                />
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    = {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleRemoveItem(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!editedData.items || editedData.items.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                            Không có sản phẩm nào được bóc tách. Hãy thêm bằng tay hoặc sửa nội dung.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">
                                Đã bóc tách được <strong>{editedData.items?.length || 0}</strong> dòng sản phẩm.
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setEditedData({ ...editedData, items: [...(editedData.items || []), { product_name: '', unit_name: '', quantity: 1, unit_price: 0 }] })}>
                                <Package className="h-3 w-3 mr-2" /> Thêm dòng mới
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {
                draft.questions?.length > 0 && (
                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                                <HelpCircle className="h-4 w-4" /> AI còn phân vân một số điểm:
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-indigo-600 space-y-1">
                                {draft.questions.map((q: string, idx: number) => (
                                    <li key={idx} className="flex gap-2"><span>•</span> {q}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
};
