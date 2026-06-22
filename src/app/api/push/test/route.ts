import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import webpush from "web-push";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicVapidKey || !privateVapidKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    webpush.setVapidDetails(
      "mailto:suporte@sopp.com.br",
      publicVapidKey,
      privateVapidKey
    );

    // Find all subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "No subscriptions found for this user" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: "🔔 SOPP Notificações",
      body: "Suas notificações estão funcionando! Este é um teste.",
      icon: "/logo-sopp.png",
      url: "/",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        console.error("[PUSH_TEST] Failed to send:", err.statusCode, err.body);
        failed++;
        // Clean up expired/invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      totalSubscriptions: subscriptions.length,
    });
  } catch (error) {
    console.error("[PUSH_TEST]", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
