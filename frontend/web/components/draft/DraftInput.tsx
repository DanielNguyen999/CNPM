"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { draftOrdersApi } from '@/lib/api/draftOrders';
import { VoiceRecorder } from './VoiceRecorder';
import { notifications } from '@/lib/notifications';

interface DraftInputProps {
    onParsed: (draft: any) => void;
}

export const DraftInput = ({ onParsed }: DraftInputProps) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'text' | 'voice'>('text');

    const handleParse = async () => {
        if (!text.trim()) return;

        setIsLoading(true);
        try {
            const result = await draftOrdersApi.aiParse(text);
            notifications.success("Thành công", "Đã phân tích xong đơn hàng bằng AI.");
            onParsed(result);
        } catch (error) {
            console.error('AI Parse error:', error);
            notifications.error("Lỗi phân tích", "Không thể xử lý dữ liệu. Vui lòng kiểm tra lại nội dung.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border shadow-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-indigo-600">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">Tạo đơn hàng thông minh</h3>
                        <p className="text-xs text-slate-500 font-medium">Bóc tách dữ liệu tự động bằng AI</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border">
                    <button
                        onClick={() => setMode('text')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        VĂN BẢN
                    </button>
                    <button
                        onClick={() => setMode('voice')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'voice' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        GIỌNG NÓI
                    </button>
                </div>
            </div>

            {mode === 'text' ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground italic bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-400">
                        Gợi ý: "Bán cho anh Đăng 10 bao xi măng Long An, 15 khối cát, ghi nợ cho anh ấy."
                    </p>

                    <div className="relative">
                        <Textarea
                            placeholder="Dán nội dung đặt hàng của khách tại đây..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[180px] text-lg p-6 focus-visible:ring-indigo-500 rounded-2xl border-slate-200 shadow-inner bg-slate-50/30"
                        />
                        <Button
                            onClick={handleParse}
                            disabled={isLoading || !text.trim()}
                            className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 px-6 shadow-lg transition-all active:scale-[0.95]"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            PHÂN TÍCH ĐƠN HÀNG
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="py-4">
                    <VoiceRecorder onTranscript={(val) => setText(val)} />
                    {text && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Kết quả chuyển đổi:</p>
                            <p className="text-slate-700 font-medium leading-relaxed italic">"{text}"</p>
                            <Button
                                onClick={handleParse}
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                TIẾP TỤC PHÂN TÍCH CHI TIẾT
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest pt-2">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Tự động nhận diện khách hàng</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span> Bóc tách sản phẩm & đơn giá</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Tự động xử lý trạng thái nợ</span>
            </div>
        </div>
    );
};
