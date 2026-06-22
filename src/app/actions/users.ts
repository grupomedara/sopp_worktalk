"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
});

export async function changePassword(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Não autorizado" };

    const userId = session.user.id;
    const data = Object.fromEntries(formData.entries());

    const result = ChangePasswordSchema.safeParse(data);

    if (!result.success) {
        return { success: false, message: "Dados inválidos or senhas não conferem." };
    }

    const { currentPassword, newPassword } = result.data;

    try {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, message: "Usuário não encontrado." };

        const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordsMatch) {
            return { success: false, message: "Senha atual incorreta." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true, message: "Senha alterada com sucesso!" };
    } catch (error) {
        console.error("Failed to change password:", error);
        return { success: false, message: "Erro ao alterar senha." };
    }
}
