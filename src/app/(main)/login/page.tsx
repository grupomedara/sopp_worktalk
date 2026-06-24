import { getTenantFromHost } from "@/lib/tenant";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
    const tenant = await getTenantFromHost();
    const branding = tenant ? {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor
    } : null;

    return <LoginForm branding={branding} />;
}
