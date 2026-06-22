import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db as prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const subscription = await req.json();

        await prisma.pushSubscription.deleteMany({
            where: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
            },
        });

        return new NextResponse("Unsubscribed successfully", { status: 200 });
    } catch (error) {
        console.error("[NOTIFICATIONS_UNSUBSCRIBE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
