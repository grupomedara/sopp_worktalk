import { db } from "@/lib/db";

interface AsaasConfig {
    token: string;
    baseUrl: string;
}

async function getAsaasConfig(): Promise<AsaasConfig> {
    const settings = await db.globalSettings.findFirst();
    const token = settings?.asaasToken || process.env.ASAAS_API_KEY || "";
    const isProd = settings?.asaasEnvironment === "PRODUCTION";
    const baseUrl = isProd ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/v3";
    return { token, baseUrl };
}

export async function createAsaasCustomer(name: string, email: string, document: string) {
    try {
        const { token, baseUrl } = await getAsaasConfig();
        if (!token) {
            return { success: false, error: "Asaas API Token não configurado." };
        }

        const cleanDocument = document.replace(/\D/g, "");

        const res = await fetch(`${baseUrl}/customers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "access_token": token
            },
            body: JSON.stringify({
                name,
                email,
                cpfCnpj: cleanDocument
            })
        });

        const data = await res.json();
        if (!res.ok || data.errors) {
            console.error("Asaas Customer Error:", data);
            return { success: false, error: data.errors?.[0]?.description || "Erro ao criar cliente no Asaas" };
        }

        return { success: true, customerId: data.id };
    } catch (error: any) {
        console.error("Error in createAsaasCustomer:", error);
        return { success: false, error: error.message || "Erro de rede com Asaas" };
    }
}

export async function createAsaasSubscription(
    customerId: string, 
    value: number, 
    plan: "PROFESSIONAL" | "ENTERPRISE",
    billingType: "CREDIT_CARD" | "BOLETO" | "PIX" | "UNDEFINED" = "UNDEFINED"
) {
    try {
        const { token, baseUrl } = await getAsaasConfig();
        if (!token) {
            return { success: false, error: "Asaas API Token não configurado." };
        }

        // Set next due date to tomorrow or 3 days from now
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 3);
        const formattedDate = nextDueDate.toISOString().split("T")[0];

        const res = await fetch(`${baseUrl}/subscriptions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "access_token": token
            },
            body: JSON.stringify({
                customer: customerId,
                billingType,
                value,
                nextDueDate: formattedDate,
                cycle: "MONTHLY",
                description: `Assinatura Plano ${plan} - SOPP Worktalk`,
            })
        });

        const data = await res.json();
        if (!res.ok || data.errors) {
            console.error("Asaas Subscription Error:", data);
            return { success: false, error: data.errors?.[0]?.description || "Erro ao criar assinatura no Asaas" };
        }

        return { 
            success: true, 
            subscriptionId: data.id,
            invoiceUrl: data.invoiceUrl || null,
            bankSlipUrl: data.bankSlipUrl || null,
            pixQrCodeUrl: data.pixQrCodeUrl || null
        };
    } catch (error: any) {
        console.error("Error in createAsaasSubscription:", error);
        return { success: false, error: error.message || "Erro de rede com Asaas" };
    }
}

export async function cancelAsaasSubscription(subscriptionId: string) {
    try {
        const { token, baseUrl } = await getAsaasConfig();
        if (!token) {
            return { success: false, error: "Asaas API Token não configurado." };
        }

        const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
            method: "DELETE",
            headers: {
                "access_token": token
            }
        });

        const data = await res.json();
        if (!res.ok || data.errors) {
            console.error("Asaas Cancel Error:", data);
            return { success: false, error: data.errors?.[0]?.description || "Erro ao cancelar assinatura no Asaas" };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in cancelAsaasSubscription:", error);
        return { success: false, error: error.message || "Erro de rede com Asaas" };
    }
}
