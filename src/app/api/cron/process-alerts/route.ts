import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import webpush from "web-push";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicVapidKey || !privateVapidKey) {
      return NextResponse.json(
        { error: "VAPID keys not configured" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      "mailto:suporte@sopp.com.br",
      publicVapidKey,
      privateVapidKey
    );

    const now = new Date();
    let totalSent = 0;
    const debug: any[] = [];

    // Helper: send push to a specific user's subscriptions only
    const sendToUser = async (
      userId: string | null,
      title: string,
      body: string,
      url: string
    ) => {
      const subs = await prisma.pushSubscription.findMany({
        where: userId ? { userId } : {},
      });

      let sent = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title, body, icon: "/logo-sopp.png", url })
          );
          sent++;
          totalSent++;
        } catch (err: any) {
          console.error("[CRON] Push failed:", err.statusCode);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          }
        }
      }
      return sent;
    };

    // ==========================================
    // 1. TASKS with reminders (via task creator/owner)
    // ==========================================
    const tasks = await prisma.task.findMany({
      where: {
        date: { not: null },
        reminderMinutes: { gte: 0 },
        status: { notIn: ["COMPLETED", "ARCHIVED", "CANCELED"] },
      }
    });

    for (const task of tasks) {
      if (!task.date || task.reminderMinutes === null || task.reminderMinutes < 0) continue;

      let alertTime: Date;
      let notificationBody: string;

      if (task.reminderMinutes >= 1000) {
        const daysBefore = Math.round(task.reminderMinutes / 10000);
        const taskDay = new Date(task.date);
        taskDay.setHours(0, 0, 0, 0); // midnight of task day
        const alertDay = new Date(taskDay.getTime() - daysBefore * 24 * 60 * 60 * 1000);
        alertDay.setHours(8, 0, 0, 0); // fire at 8h00
        alertTime = alertDay;

        if (daysBefore === 0) {
          notificationBody = `Você tem uma tarefa para hoje!`;
        } else if (daysBefore === 1) {
          notificationBody = `Você tem uma tarefa amanhã!`;
        } else if (daysBefore === 7) {
          notificationBody = `Você tem uma tarefa daqui a 1 semana!`;
        } else {
          notificationBody = `Você tem uma tarefa em ${daysBefore} dias!`;
        }
      } else {
        // Legacy minute-based (fallback for old records)
        alertTime = new Date(task.date.getTime() - task.reminderMinutes * 60000);
        notificationBody = task.reminderMinutes === 0
          ? `Sua tarefa está iniciando agora!`
          : `A tarefa começa em ${task.reminderMinutes} min.`;
      }

      const diffMs = now.getTime() - alertTime.getTime();
      const willSend = diffMs >= 0 && diffMs < 5 * 60 * 1000;
      const ownerId = task.userId || null;

      debug.push({
        type: "task",
        title: task.title,
        ownerId,
        taskDate: task.date.toISOString(),
        reminderMinutes: task.reminderMinutes,
        alertTime: alertTime.toISOString(),
        serverNow: now.toISOString(),
        diffMinutes: Math.round(diffMs / 60000),
        willSend,
      });

      if (willSend) {
        await sendToUser(
          ownerId,
          `📝 Tarefa: ${task.title}`,
          notificationBody,
          task.listId ? `/processes/${task.listId}` : "/processes"
        );
        // Mark as sent
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderMinutes: -1 },
        });
      }
    }

    // ==========================================
    // 2. ALARMS (Custom UI Scheduled Alarms)
    // ==========================================
    const alarms = await prisma.alarm.findMany({
      where: {
        sent: false,
        dateTime: {
          gte: new Date(now.getTime() - 60 * 60 * 1000), // Catch past hour misses
        },
      },
      include: {
        task: true,
      },
    });

    for (const alarm of alarms) {
      const diffMs = now.getTime() - alarm.dateTime.getTime();
      const willSend = diffMs >= 0 && diffMs < 5 * 60 * 1000;

      let ownerId: string | null = null;
      let title = "Alarme SOPP";
      let body = "Lembrete programado.";
      let url = "/";

      if (alarm.task) {
        ownerId = alarm.task.userId || null;
        title = `📝 Lembrete Tarefa: ${alarm.task.title}`;
        
        const taskDate = alarm.task.date ? new Date(alarm.task.date) : null;
        if (taskDate) {
          const dateString = taskDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
          body = `Atenção à tarefa agendada para o dia ${dateString}.`;
        } else {
          body = `Lembrete de tarefa programada.`;
        }
        url = alarm.task.listId ? `/processes/${alarm.task.listId}` : "/processes";
      }

      debug.push({
        type: "alarm",
        title,
        ownerId,
        alarmTime: alarm.dateTime.toISOString(),
        serverNow: now.toISOString(),
        diffMinutes: Math.round(diffMs / 60000),
        willSend,
      });

      if (willSend && ownerId) {
        await sendToUser(ownerId, title, body, url);
        await prisma.alarm.update({
          where: { id: alarm.id },
          data: { sent: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Alerts processed. ${totalSent} notifications sent.`,
      sent: totalSent,
      serverTime: now.toISOString(),
      checked: {
        tasks: tasks.length,
        alarms: alarms.length,
      },
      debug,
    });
  } catch (error) {
    console.error("[CRON_PROCESS_ALERTS]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
