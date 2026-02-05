"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { draftOrdersApi } from '@/lib/api/draftOrders';

interface DraftInputProps {
    onParsed: (draft: any) => void;
}

export const DraftInput = ({ onParsed }: DraftInputProps) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleParse = async () => {
        if (!text.trim()) return;

        setIsLoading(true);
        try {
            const result = await draftOrdersApi.aiParse(text);
            onParsed(result);
        } catch (error) {
            console.error('AI Parse error:', error);
            alert('Lỗi khi phân tích đơn hàng. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-bold">Nhập đơn bằng AI (Tiếng Việt)</h3>
            </div>

            <p className="text-sm text-muted-foreground italic">
                Ví dụ: "Bán cho anh Hòa số điện thoại 0987654321 10 bao xi măng, 5 khối cát, ghi nợ cho anh ấy."
            </p>

            <div className="relative">
                <Textarea
                    placeholder="Nhập nội dung đơn hàng tại đây..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[200px] text-lg p-6 focus-visible:ring-indigo-500 rounded-xl border-slate-200 shadow-inner bg-slate-50/50"
                />
                <Button
                    onClick={handleParse}
                    disabled={isLoading || !text.trim()}
                    className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 rounded-full h-12 px-6 shadow-lg shadow-indigo-100 transition-all active:scale-[0.95]"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Send className="h-4 w-4 mr-2" />
                    )}
                    PHÂN TÍCH BẰNG AI
                </Button>
            </div>

            <div className="flex gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest pt-2">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Tự động nhận diện khách hàng</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span> Bóc tách sản phẩm & đơn giá</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Tự động xử lý trạng thái nợ</span>
            </div>
        </div>
    );
};
