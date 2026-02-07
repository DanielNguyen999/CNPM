"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
    onTranscript: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscript }: VoiceRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Khởi tạo SpeechRecognition duy nhất một lần
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';

        recognition.onstart = () => {
            console.log('STT: Bắt đầu lắng nghe...');
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPiece = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPiece;
                } else {
                    interimTranscript += transcriptPiece;
                }
            }

            if (finalTranscript) {
                setTranscript(prev => {
                    const cleanFinal = finalTranscript.trim();
                    if (prev.endsWith(cleanFinal)) return prev;
                    return prev ? prev + ' ' + cleanFinal : cleanFinal;
                });
            }

            if (interimTranscript) {
                setIsProcessing(false);
                setInterimText(interimTranscript);
            } else {
                setInterimText('');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('STT Error:', event.error);
            if (event.error === 'not-allowed') {
                alert('Vui lòng cấp quyền truy cập Micro cho trình duyệt.');
            }
        };

        recognition.onend = () => {
            console.log('STT: Kết thúc phiên lắng nghe');
            // Chúng ta không tự động restart ở đây để tránh loop vô tận
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    // 2. Quản lý Timer tách biệt
    useEffect(() => {
        if (isRecording) {
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording]);

    const startRecording = () => {
        if (!recognitionRef.current) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome.');
            return;
        }

        try {
            setTranscript('');
            setInterimText('');
            setIsRecording(true);
            setIsProcessing(false);
            recognitionRef.current.start();
        } catch (e) {
            console.warn('STT: Đã đang nghe hoặc lỗi khởi động:', e);
            // Một số trường hợp start() gọi lại trên instance đang chạy sẽ throw error, 
            // chúng ta có thể ignore hoặc xử lý tùy ý
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        setIsProcessing(true);
        setInterimText('');

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error('STT Stop error:', e);
            }
        }

        setTimeout(() => setIsProcessing(false), 500);
    };

    const handleUseTranscript = () => {
        if (transcript) {
            onTranscript(transcript);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center p-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 gap-4">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 z-10 relative",
                            isRecording
                                ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-110"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                        )}
                    >
                        {isRecording ? (
                            <Square className="h-8 w-8 text-white fill-current" />
                        ) : (
                            <Mic className="h-10 w-10 text-white" />
                        )}
                    </button>
                    {isRecording && (
                        <div className="absolute inset-x-0 -inset-y-0 w-20 h-20 bg-rose-400 rounded-full animate-ping opacity-25" />
                    )}
                </div>

                <div className="flex flex-col min-w-[200px]">
                    <span className={cn(
                        "text-xs font-bold uppercase tracking-[0.2em]",
                        isRecording ? "text-rose-600 animate-pulse" : "text-indigo-600"
                    )}>
                        {isRecording ? "Đang lắng nghe..." : "Nhấn để bắt đầu nói"}
                    </span>
                    <span className="text-3xl font-mono font-black text-slate-800 tabular-nums">
                        {formatTime(recordingTime)}
                    </span>
                </div>
            </div>

            {/* Transcript Preview Area */}
            <div className={cn(
                "w-full min-h-[80px] p-4 bg-white rounded-xl border border-indigo-100 text-sm transition-all",
                (transcript || interimText) ? "text-slate-700" : "text-slate-400 italic"
            )}>
                {isProcessing && !transcript && !interimText ? (
                    <div className="flex items-center justify-center h-full gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span>Đang xử lý âm thanh...</span>
                    </div>
                ) : (
                    <div className="space-x-1">
                        <span>{transcript}</span>
                        <span className="text-slate-400">{interimText}</span>
                        {!transcript && !interimText && "Kết quả nhận diện giọng nói sẽ hiển thị tại đây..."}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                    variant="outline"
                    className="border-slate-200 h-11 font-bold text-slate-600"
                    disabled={isRecording || isProcessing || !transcript}
                    onClick={() => {
                        setTranscript('');
                    }}
                >
                    <Trash2 className="h-4 w-4 mr-2" /> Xóa kết quả
                </Button>
                <Button
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 font-bold shadow-indigo-200 shadow-lg"
                    disabled={isRecording || isProcessing || !transcript}
                    onClick={handleUseTranscript}
                >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Dùng văn bản này
                </Button>
            </div>

            <div className="text-[10px] text-slate-400 font-medium">
                Sử dụng công nghệ nhận diện giọng nói của Google
            </div>
        </div>
    );
};

