"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, Search, UserPlus, Loader2, Check, X } from 'lucide-react';
import { customersApi } from '@/lib/api/customers';
import { usePosStore } from '@/store/posStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/DraggableDialog";
import { cn } from '@/lib/utils';

export const CustomerPicker = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { customer: selectedCustomer, setCustomer } = usePosStore();

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 0 && isDialogOpen) {
                setIsLoading(true);
                try {
                    const data = await customersApi.search(query);
                    setResults(data);
                } catch (error) {
                    console.error('Customer search error:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isDialogOpen]);

    const handleSelect = (customer: any) => {
        setCustomer({
            id: customer.id,
            full_name: customer.full_name,
            phone: customer.phone
        });
        setQuery('');
        setIsDialogOpen(false);
    };

    const handleQuickCreate = async () => {
        if (!query) return;

        setIsLoading(true);
        try {
            const cleanQuery = query.replace(/\D/g, '').slice(0, 10);
            const isPhone = cleanQuery.length >= 9 && /^\d+$/.test(cleanQuery);
            const name = isPhone ? `Khách mới ${cleanQuery}` : query;
            const phone = isPhone ? cleanQuery : '';

            const newCustomer = await customersApi.createQuick(name, phone);
            handleSelect(newCustomer);
        } catch (error) {
            alert("Không thể tạo khách hàng nhanh.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Khách hàng</label>
                    {selectedCustomer && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2"
                            onClick={() => setCustomer(null)}
                        >
                            <X className="h-3 w-3 mr-1" /> Gỡ bỏ
                        </Button>
                    )}
                </div>

                {selectedCustomer ? (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                            {selectedCustomer.full_name.charAt(0)}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="font-bold text-slate-900 truncate">{selectedCustomer.full_name}</span>
                            <span className="text-sm text-slate-500">{selectedCustomer.phone || 'Không có SĐT'}</span>
                        </div>
                        <Check className="h-5 w-5 text-indigo-600 shrink-0" />
                    </div>
                ) : (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-10 border-dashed border-2 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 justify-start">
                                <Search className="mr-2 h-4 w-4" />
                                <span>Tìm hoặc thêm khách hàng...</span>
                            </Button>
                        </DialogTrigger>
                        <DraggableDialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Chọn khách hàng</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Nhập tên hoặc số điện thoại..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="pl-10 h-12 text-lg focus-visible:ring-indigo-500"
                                        autoFocus
                                    />
                                    {isLoading && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                    )}
                                </div>

                                <div className="max-h-[300px] overflow-y-auto rounded-md border">
                                    {results.length > 0 ? (
                                        <div className="divide-y">
                                            {results.map((c) => (
                                                <div
                                                    key={c.id}
                                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                                    onClick={() => handleSelect(c)}
                                                >
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                        {c.full_name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900">{c.full_name}</span>
                                                        <span className="text-xs text-slate-500">{c.phone || 'N/A'}</span>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="ml-auto text-indigo-600">Chọn</Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : query.length > 0 && !isLoading ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Không thấy khách hàng nào khớp với "{query}"
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Nhập để tìm kiếm khách hàng hiện có
                                        </div>
                                    )}
                                </div>

                                {query.length > 0 && (
                                    <Button
                                        className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 border"
                                        onClick={handleQuickCreate}
                                        disabled={isLoading}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Thêm mới khách hàng "{query}"
                                    </Button>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Đóng</Button>
                            </DialogFooter>
                        </DraggableDialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
};
