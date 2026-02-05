"use client";

import { motion, useDragControls, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent as OriginalDialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, X, GripHorizontal } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * DraggableDialogContent
 * A wrapper for DialogContent that makes it draggable and maximizable.
 */
export const DraggableDialogContent = ({ children, className, title, ...props }: any) => {
    const dragControls = useDragControls();
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const toggleMaximize = () => setIsMaximized(!isMaximized);

    if (!isMounted) return null;

    return (
        <OriginalDialogContent
            {...props}
            className={cn(
                "p-0 overflow-hidden border-none bg-transparent shadow-none transition-all duration-300",
                isMaximized ? "max-w-[100vw] w-screen h-screen m-0 rounded-none" : "sm:max-w-[80vw] md:max-w-[60vw] max-h-[90vh]",
                className
            )}
        >
            <motion.div
                drag={!isMaximized}
                dragControls={dragControls}
                dragMomentum={false}
                dragListener={false}
                animate={isMaximized ? { x: 0, y: 0, width: "100vw", height: "100vh" } : {}}
                className={cn(
                    "bg-white flex flex-col shadow-2xl border transition-all duration-300",
                    isMaximized ? "rounded-none w-full h-full" : "rounded-xl overflow-hidden"
                )}
            >
                <div
                    className={cn(
                        "p-3 border-b bg-slate-50 flex items-center justify-between select-none",
                        !isMaximized && "cursor-move"
                    )}
                    onPointerDown={(e) => !isMaximized && dragControls.start(e)}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                            <GripHorizontal className="h-5 w-5" />
                        </div>
                        <div className="flex-1 px-2">
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                                {title || "Cửa sổ chức năng"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleMaximize}
                            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                            title={isMaximized ? "Thu nhỏ" : "Phóng to"}
                        >
                            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <DialogClose asChild>
                            <button className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-lg text-slate-500 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </DialogClose>
                    </div>
                </div>
                <div className={cn(
                    "flex-1 overflow-auto bg-white p-6",
                    isMaximized ? "p-10" : "max-h-[70vh]"
                )}>
                    {children}
                </div>
            </motion.div>
        </OriginalDialogContent>
    );
};
