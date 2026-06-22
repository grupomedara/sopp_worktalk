import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Configure VAPID Keys lazily at runtime
    webpush.setVapidDetails(
      `mailto:${process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'admin@sopp.com'}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "placeholder",
      process.env.VAPID_PRIVATE_KEY || "placeholder"
    );

    // Verify Authorizarion secret for Cron runner security
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    // 1. Fetch due alarms
    const dueAlarms = await prisma.alarm.findMany({
      where: {
        sent: false,
        dateTime: {
          lte: tenMinutesFromNow,
        },
      },
      include: {
        event: true,
        task: true,
      },
    });

    let sentCount = 0;

    for (const alarm of dueAlarms) {
      const subscriptions = await prisma.pushSubscription.findMany({});
      const title = alarm.event ? "Compromisso 📅" : "Lembrete de Tarefa 📝";
      const body = alarm.event ? alarm.event.title : (alarm.task ? alarm.task.title : "Você tem um lembrete!");
      const url = alarm.event ? `/agenda` : `/tasks`;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title,
              body,
              url,
            })
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }

      // Mark alarm as sent
      await prisma.alarm.update({
        where: { id: alarm.id },
        data: { sent: true },
      });
      sentCount++;
    }

    return NextResponse.json({ success: true, notificationsSent: sentCount });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Cron Failed" }, { status: 500 });
  }
}
