"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/app/actions/users";

export function ChangePasswordForm({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        formData.append("userId", userId);

        const result = await changePassword(undefined, formData);
        setLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            (event.target as HTMLFormElement).reset();
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                />
            </div>

            {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message.text}
                </p>
            )}

            <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Alterar Senha"}
            </Button>
        </form>
    );
}
