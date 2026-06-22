import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';
import { db as prisma } from "@/lib/db";
import webpush from "web-push";

export async function POST(req: Request) {
    try {
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

        if (publicVapidKey && privateVapidKey) {
            webpush.setVapidDetails(
                "mailto:suporte@sopp.com.br",
                publicVapidKey,
                privateVapidKey
            );
        }
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const subscription = await req.json();

        // Check if subscription already exists for user
        const existingSub = await prisma.pushSubscription.findFirst({
            where: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
            },
        });

        if (!existingSub) {
            await prisma.pushSubscription.create({
                data: {
                    userId: session.user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            });
        }

        return new NextResponse("Subscribed successfully", { status: 201 });
    } catch (error) {
        console.error("[NOTIFICATIONS_SUBSCRIBE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
