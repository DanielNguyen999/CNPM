import { cn } from "@/lib/utils";

/**
 * Skeleton component for high-quality loading states
 */

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800", className)}
            {...props}
        />
    );
}

export { Skeleton };
