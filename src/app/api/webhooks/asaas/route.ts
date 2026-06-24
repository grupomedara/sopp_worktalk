import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Asaas Webhook Received:", body);

        const event = body.event;
        const payment = body.payment;
        const subscriptionId = payment?.subscription;

        if (!subscriptionId) {
            return NextResponse.json({ received: true });
        }

        // Find the subscription by asaasSubscriptionId
        const subscription = await db.subscription.findFirst({
            where: { asaasSubscriptionId: subscriptionId }
        });

        if (!subscription) {
            console.warn(`Subscription not found for Asaas ID: ${subscriptionId}`);
            return NextResponse.json({ received: true });
        }

        if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
            const dueDate = payment.dueDate ? new Date(payment.dueDate) : new Date();
            // Set currentPeriodEnd to due date + 31 days (to cover the next period)
            const currentPeriodEnd = new Date(dueDate);
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 31);

            await db.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: "ACTIVE",
                    currentPeriodEnd
                }
            });
            console.log(`Subscription ${subscription.id} marked as ACTIVE.`);
        } else if (event === "PAYMENT_OVERDUE") {
            await db.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: "PAST_DUE"
                }
            });
            console.log(`Subscription ${subscription.id} marked as PAST_DUE.`);
        } else if (event === "SUBSCRIPTION_DELETED") {
            await db.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: "CANCELED"
                }
            });
            console.log(`Subscription ${subscription.id} marked as CANCELED.`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Asaas Webhook Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Erro interno" }, { status: 500 });
    }
}
