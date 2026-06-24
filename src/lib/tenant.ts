import { headers } from "next/headers";
import { db } from "@/lib/db";

export interface TenantBranding {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    slug: string;
}

/**
 * Detects the current tenant from the host header (subdomain mapping).
 * Supported: 
 * - empresa.sopp.com.br
 * - empresa.localhost:3000
 */
export async function getTenantFromHost() {
    try {
        const hostHeader = headers().get("host") || "";
        // Clean host header (remove port if local)
        const host = hostHeader.split(":")[0];
        const parts = host.split(".");

        // Subdomain check
        // e.g. subdomain.domain.com -> parts.length >= 3
        // e.g. subdomain.localhost -> parts.length >= 2 (if local)
        const isLocalhost = host.endsWith("localhost");
        const partsLimit = isLocalhost ? 2 : 3;

        if (parts.length >= partsLimit) {
            const slug = parts[0];
            if (slug !== "www" && slug !== "sopp" && slug !== "localhost") {
                const tenant = await db.tenant.findUnique({
                    where: { slug },
                    include: { subscription: true }
                });
                return tenant;
            }
        }
        return null;
    } catch (e) {
        console.error("Error in getTenantFromHost:", e);
        return null;
    }
}

/**
 * Validates if the tenant has an active subscription.
 */
export async function isSubscriptionActive(tenantId: string): Promise<boolean> {
    try {
        const sub = await db.subscription.findUnique({
            where: { tenantId }
        });
        if (!sub) return false;
        
        if (sub.status === "ACTIVE" || sub.status === "TRIAL") {
            return true;
        }

        // If trial or active expired
        if (sub.currentPeriodEnd && new Date() > sub.currentPeriodEnd) {
            return false;
        }

        return false;
    } catch (e) {
        console.error("Error checking subscription:", e);
        return false;
    }
}
