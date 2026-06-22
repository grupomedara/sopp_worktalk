"use server";

import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const LoginSchema = z.object({
    document: z.string().min(11, "CPF é obrigatório"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const CreateUserSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    document: z.string().min(11, "CPF inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    role: z.enum(["USER", "SUPER_ADMIN"]).default("USER"),
});

const UpdateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Nome é obrigatório"),
    document: z.string().min(11, "CPF inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
    role: z.enum(["USER", "SUPER_ADMIN"]),
});

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const data = Object.fromEntries(formData.entries());
    const result = LoginSchema.safeParse(data);

    if (!result.success) {
        return "Dados inválidos.";
    }

    try {
        const document = result.data.document.replace(/\D/g, "");
        await signIn("credentials", {
            ...result.data,
            document,
            redirectTo: "/",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "CPF ou Senha Inválidos.";
                default:
                    return "Algo deu errado.";
            }
        }
        throw error;
    }
}

export async function createUser(
    prevState: string | undefined,
    formData: FormData,
) {
    const data = Object.fromEntries(formData.entries());
    const result = CreateUserSchema.safeParse(data);

    if (!result.success) {
        return "Dados inválidos. Verifique os campos.";
    }

    const { password, name, role } = result.data;
    const document = result.data.document.replace(/\D/g, "");

    try {
        const existingUser = await db.user.findUnique({
            where: { document },
        });

        if (existingUser) {
            return "Este CPF já está em uso.";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                document,
                password: hashedPassword,
                name,
                role,
            },
        });

        revalidatePath("/admin/users");
        return "Usuário criado com sucesso!";

    } catch (error) {
        console.error("Create user error:", error);
        return "Erro ao criar usuário.";
    }
}

export async function updateUser(
    prevState: string | undefined,
    formData: FormData,
) {
    const data = Object.fromEntries(formData.entries());
    const result = UpdateUserSchema.safeParse(data);

    if (!result.success) {
        return "Dados inválidos. Verifique os campos.";
    }

    const { id, password, name, role } = result.data;
    const document = result.data.document.replace(/\D/g, "");

    try {
        const existingUser = await db.user.findFirst({
            where: { 
                document,
                id: { not: id }
            },
        });

        if (existingUser) {
            return "Este CPF já está em uso por outro usuário.";
        }

        const updateData: any = {
            document,
            name,
            role,
        };

        if (password && password.length >= 6) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await db.user.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/admin/users");
        return "Usuário atualizado com sucesso!";

    } catch (error) {
        console.error("Update user error:", error);
        return "Erro ao atualizar usuário.";
    }
}

export async function deleteUser(userId: string) {
    try {
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== "SUPER_ADMIN") {
            return "Acesso negado.";
        }

        // Prevent self-deletion
        // @ts-ignore
        if (session?.user?.id === userId) {
            return "Você não pode deletar sua própria conta.";
        }

        // Manual cleanup of all related data before deleting user
        await db.$transaction([
            db.task.deleteMany({ where: { userId } }),
            db.finance.deleteMany({ where: { userId } }),
            db.event.deleteMany({ where: { userId } }),
            db.study.deleteMany({ where: { userId } }),
            db.lesson.deleteMany({ where: { userId } }),
            db.fichamento.deleteMany({ where: { userId } }),
            db.note.deleteMany({ where: { userId } }),
            db.interaction.deleteMany({ where: { userId } }),
            db.person.deleteMany({ where: { userId } }),
            db.prayer.deleteMany({ where: { userId } }),
            db.goal.deleteMany({ where: { userId } }),
            db.project.deleteMany({ where: { ownerId: userId } }),
            db.user.delete({ where: { id: userId } }),
        ]);

        revalidatePath("/admin/users");
        return "Usuário deletado com sucesso!";
    } catch (error) {
        console.error("Delete user error:", error);
        return "Erro ao deletar usuário. Detalhes: " + (error instanceof Error ? error.message : "Erro desconhecido");
    }
}
