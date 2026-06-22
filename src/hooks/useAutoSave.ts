"use client";

import { useEffect, useRef, useState } from "react";

interface useAutoSaveProps<T> {
    value: T;
    saveFn: (data: T) => Promise<any>;
    delay?: number;
    enabled?: boolean;
    isValid?: boolean;
}

export function useAutoSave<T>({
    value,
    saveFn,
    delay = 2000,
    enabled = true,
    isValid = true,
}: useAutoSaveProps<T>) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const previousValueRef = useRef<string>(JSON.stringify(value));
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (!enabled || !isValid) return;

        const currentValueStr = JSON.stringify(value);

        // Skip first run to avoid saving on mount
        if (isFirstRun.current) {
            isFirstRun.current = false;
            previousValueRef.current = currentValueStr;
            return;
        }

        // Only save if value actually changed
        if (previousValueRef.current === currentValueStr) {
            return;
        }

        setIsSaving(true);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(async () => {
            try {
                await saveFn(value);
                setLastSaved(new Date());
                previousValueRef.current = currentValueStr;
            } catch (error) {
                console.error("AutoSave Error:", error);
            } finally {
                setIsSaving(false);
            }
        }, delay);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, saveFn, delay, enabled, isValid]);

    return { isSaving, lastSaved };
}
