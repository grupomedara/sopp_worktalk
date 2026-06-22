import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Missing encryption keys" }, { status: 400 });
    }

    // Upsert: update if endpoint exists, create otherwise
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUSH_SUBSCRIBE]", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
