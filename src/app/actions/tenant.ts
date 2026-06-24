"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createAsaasCustomer, createAsaasSubscription } from "@/lib/asaas";
import crypto from "crypto";

export async function createTenant(
    tenantName: string,
    tenantSlug: string,
    tenantDocument: string,
    userName: string,
    userEmail: string,
    userDocument: string,
    userPassword: string
) {
    try {
        // Validate unique tenant slug
        const slugExists = await db.tenant.findUnique({
            where: { slug: tenantSlug.toLowerCase().trim() }
        });
        if (slugExists) {
            return { success: false, error: "Esse subdomínio já está em uso por outra empresa." };
        }

        // Validate unique user CPF or Email
        const cleanUserDoc = userDocument.replace(/\D/g, "");
        const userExists = await db.user.findFirst({
            where: {
                OR: [
                    { email: userEmail },
                    { document: cleanUserDoc }
                ]
            }
        });
        if (userExists) {
            return { success: false, error: "E-mail ou CPF de usuário já cadastrado." };
        }

        // Create Tenant, User, and Subscription in a transaction
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial

        const tenant = await db.tenant.create({
            data: {
                name: tenantName,
                slug: tenantSlug.toLowerCase().trim(),
                users: {
                    create: {
                        name: userName,
                        email: userEmail,
                        password: hashedPassword,
                        document: cleanUserDoc,
                        role: "USER",
                        tenantRole: "OWNER"
                    }
                },
                subscription: {
                    create: {
                        status: "TRIAL",
                        plan: "PROFESSIONAL",
                        currentPeriodEnd: trialEnd
                    }
                }
            },
            include: {
                subscription: true
            }
        });

        // Trigger Asaas Customer Creation asynchronously
        try {
            const customerRes = await createAsaasCustomer(userName, userEmail, cleanUserDoc);
            if (customerRes.success && customerRes.customerId) {
                // Update subscription with customer ID
                await db.subscription.update({
                    where: { id: tenant.subscription!.id },
                    data: { asaasCustomerId: customerRes.customerId }
                });

                // Trigger Asaas Subscription
                const subRes = await createAsaasSubscription(
                    customerRes.customerId,
                    49.90, // Example value R$ 49,90/month
                    "PROFESSIONAL"
                );
                if (subRes.success && subRes.subscriptionId) {
                    await db.subscription.update({
                        where: { id: tenant.subscription!.id },
                        data: { asaasSubscriptionId: subRes.subscriptionId }
                    });
                }
            }
        } catch (e) {
            console.error("Asaas onboarding integration failed:", e);
            // Non-blocking, they can update/re-trigger payment setup later
        }

        return { success: true, data: tenant };
    } catch (error: any) {
        console.error("Error in createTenant:", error);
        return { success: false, error: error.message || "Falha ao registrar empresa" };
    }
}

export async function inviteUser(email: string, role: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;
        // @ts-ignore
        const tenantRole = session.user.tenantRole;

        if (!tenantId || (tenantRole !== "OWNER" && tenantRole !== "ADMIN")) {
            return { success: false, error: "Apenas administradores podem convidar membros." };
        }

        const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return { success: false, error: "Empresa não encontrada." };

        // Generate invitation token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // Expires in 48 hours

        const invite = await db.tenantInvite.create({
            data: {
                email,
                role,
                token,
                tenantId,
                expiresAt
            }
        });

        // Generate invite URL
        // Detection is local/production based
        const host = process.env.NODE_ENV === "production" ? "sopp.com.br" : "localhost:3000";
        const inviteUrl = `http://${tenant.slug}.${host}/register?token=${token}`;

        return { success: true, data: invite, inviteUrl };
    } catch (error: any) {
        console.error("Error in inviteUser:", error);
        return { success: false, error: error.message || "Erro ao gerar convite" };
    }
}

export async function acceptInvite(
    token: string,
    name: string,
    document: string,
    password: string
) {
    try {
        const invite = await db.tenantInvite.findUnique({
            where: { token },
            include: { tenant: true }
        });

        if (!invite) {
            return { success: false, error: "Convite inválido ou expirado." };
        }

        if (new Date() > invite.expiresAt) {
            await db.tenantInvite.delete({ where: { id: invite.id } });
            return { success: false, error: "Este convite expirou (limite de 48h excedido)." };
        }

        const cleanDoc = document.replace(/\D/g, "");
        const userExists = await db.user.findFirst({
            where: {
                OR: [
                    { email: invite.email },
                    { document: cleanDoc }
                ]
            }
        });
        if (userExists) {
            return { success: false, error: "CPF ou E-mail já cadastrado no sistema." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.user.create({
            data: {
                name,
                email: invite.email,
                password: hashedPassword,
                document: cleanDoc,
                role: "USER",
                tenantId: invite.tenantId,
                tenantRole: invite.role
            }
        });

        // Delete the invite record
        await db.tenantInvite.delete({ where: { id: invite.id } });

        return { success: true, user: newUser };
    } catch (error: any) {
        console.error("Error in acceptInvite:", error);
        return { success: false, error: error.message || "Erro ao aceitar convite" };
    }
}

export async function updateTenantBranding(primaryColor?: string, logoUrl?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;
        // @ts-ignore
        const tenantRole = session.user.tenantRole;

        if (!tenantId || (tenantRole !== "OWNER" && tenantRole !== "ADMIN")) {
            return { success: false, error: "Apenas proprietários podem alterar a identidade visual." };
        }

        const updated = await db.tenant.update({
            where: { id: tenantId },
            data: {
                primaryColor: primaryColor || undefined,
                logoUrl: logoUrl || undefined
            }
        });

        revalidatePath("/profile");
        return { success: true, data: updated };
    } catch (error: any) {
        console.error("Error in updateTenantBranding:", error);
        return { success: false, error: error.message || "Erro ao atualizar identidade visual" };
    }
}

export async function getGlobalSettings() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return { success: false, error: "Não autorizado: Acesso Admin necessário." };
        }

        const settings = await db.globalSettings.findFirst();
        return { success: true, data: settings };
    } catch (error: any) {
        console.error("Error in getGlobalSettings:", error);
        return { success: false, error: error.message || "Erro ao ler configurações" };
    }
}

export async function saveGlobalSettings(asaasToken: string, asaasEnvironment: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return { success: false, error: "Não autorizado: Acesso Admin necessário." };
        }

        const existing = await db.globalSettings.findFirst();
        let settings;
        if (existing) {
            settings = await db.globalSettings.update({
                where: { id: existing.id },
                data: {
                    asaasToken,
                    asaasEnvironment
                }
            });
        } else {
            settings = await db.globalSettings.create({
                data: {
                    asaasToken,
                    asaasEnvironment
                }
            });
        }

        return { success: true, data: settings };
    } catch (error: any) {
        console.error("Error in saveGlobalSettings:", error);
        return { success: false, error: error.message || "Erro ao salvar configurações" };
    }
}
