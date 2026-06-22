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
      // If userId provided, send only to that user's subscriptions
      // If no userId (e.g. events without a project), send to all subscribers
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
    // 1. TASKS with reminders (via project owner)
    // ==========================================
    const tasks = await prisma.task.findMany({
      where: {
        date: { not: null },
        reminderMinutes: { gte: 0 },
        status: { notIn: ["COMPLETED", "ARCHIVED", "CANCELED"] },
      },
      include: { project: true },
    });

    for (const task of tasks) {
      if (!task.date || task.reminderMinutes === null || task.reminderMinutes < 0) continue;

      // Day-based reminder (new): values >= 1000 encode (daysBefore * 10000)
      // We fire at 8h00 on (task.date - daysBefore)
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
      const ownerId = task.project?.ownerId || null;

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
          "/tasks"
        );
        // Mark as sent
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderMinutes: -1 },
        });
      }
    }

    // ==========================================
    // 2. EVENTS — only those with explicit reminder configured
    // ==========================================
    const events = await prisma.event.findMany({
      where: {
        reminderMinutes: { gt: 0 }, // explicit pre-reminders
        startDate: {
          gte: new Date(now.getTime() - 60 * 60 * 1000),
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { project: true },
    });

    for (const event of events) {
      const alertTime = new Date(
        event.startDate.getTime() - event.reminderMinutes! * 60000
      );
      const diffMs = now.getTime() - alertTime.getTime();
      const willSend = diffMs >= 0 && diffMs < 5 * 60 * 1000;
      const ownerId = event.project?.ownerId || null;

      debug.push({
        type: "event_reminder",
        title: event.title,
        ownerId,
        startDate: event.startDate.toISOString(),
        reminderMinutes: event.reminderMinutes,
        alertTime: alertTime.toISOString(),
        serverNow: now.toISOString(),
        diffMinutes: Math.round(diffMs / 60000),
        willSend,
      });

      if (willSend) {
        await sendToUser(
          ownerId,
          `📅 Agenda: ${event.title}`,
          `Seu compromisso começa em ${event.reminderMinutes} min.`,
          "/agenda"
        );
        await prisma.event.update({
          where: { id: event.id },
          data: { reminderMinutes: -1 },
        });
      }
    }

    // ==========================================
    // 2.5. EVENTS — EXACT START TIME NOTIFICATIONS
    // ==========================================
    const startingEvents = await prisma.event.findMany({
      where: {
        startNotified: false,
        startDate: {
          gte: new Date(now.getTime() - 5 * 60 * 1000), // last 5 minutes
          lte: new Date(now.getTime() + 60 * 1000),      // next 1 minute edge-cases
        },
      },
      include: { project: true },
    });

    for (const event of startingEvents) {
      const diffMs = now.getTime() - event.startDate.getTime();
      const willSend = diffMs >= 0 && diffMs < 5 * 60 * 1000;
      const ownerId = (event as any).project?.ownerId || null;

      if (willSend) {
        await sendToUser(
          ownerId,
          `📅 Agenda: ${event.title}`,
          `O evento está iniciando agora!`,
          "/agenda"
        );
        // Casting to any to avoid TS errors on the user's locked local environment
        // Vercel handles this perfectly but we keep the local server clean
        await (prisma.event.update as any)({
          where: { id: event.id },
          data: { startNotified: true },
        });
      }
    }

    // ==========================================
    // 3. FINANCES with reminders
    // ==========================================
    const finances = await prisma.finance.findMany({
      where: {
        dueDate: { not: null },
        reminderMinutes: { not: null },
        status: { notIn: ["COMPLETED", "ARCHIVED", "CANCELED"] },
      },
      include: { project: true },
    });

    for (const finance of finances) {
      if (!finance.dueDate || finance.reminderMinutes === null || finance.reminderMinutes < 0) continue;

      let alertTime: Date;
      let notificationBody: string;

      if (finance.reminderMinutes >= 1000) {
        const daysBefore = Math.round(finance.reminderMinutes / 10000);
        const dueDay = new Date(finance.dueDate);
        dueDay.setHours(0, 0, 0, 0); 
        const alertDay = new Date(dueDay.getTime() - daysBefore * 24 * 60 * 60 * 1000);
        alertDay.setHours(8, 0, 0, 0); 
        alertTime = alertDay;

        if (daysBefore === 0) {
          notificationBody = `Hoje vence: ${finance.description}`;
        } else if (daysBefore === 1) {
          notificationBody = `Vence amanhã: ${finance.description}`;
        } else if (daysBefore === 7) {
          notificationBody = `Vence em 1 semana: ${finance.description}`;
        } else {
          notificationBody = `Vence em ${daysBefore} dias: ${finance.description}`;
        }
      } else {
        alertTime = new Date(
          finance.dueDate.getTime() - finance.reminderMinutes * 60000
        );
        notificationBody = finance.reminderMinutes === 0
          ? `Vencimento agora: ${finance.description}`
          : `Vencimento em ${finance.reminderMinutes} min.`;
      }

      const diffMs = now.getTime() - alertTime.getTime();
      const willSend = diffMs >= 0 && diffMs < 5 * 60 * 1000;
      const ownerId = finance.project?.ownerId || null;

      if (willSend) {
        await sendToUser(
          ownerId,
          `💰 Finanças: ${finance.description}`,
          notificationBody,
          "/financas"
        );
        await prisma.finance.update({
          where: { id: finance.id },
          data: { reminderMinutes: -1 },
        });
      }
    }

    // ==========================================
    // 4. ALARMS (Custom UI Scheduled Alarms)
    // ==========================================
    const alarms = await prisma.alarm.findMany({
      where: {
        sent: false,
        dateTime: {
          gte: new Date(now.getTime() - 60 * 60 * 1000), // Catch past hour misses
        },
      },
      include: {
        event: { include: { project: true } },
        task: { include: { project: true } },
      },
    });

    for (const alarm of alarms) {
      const diffMs = now.getTime() - alarm.dateTime.getTime();
      const willSend = diffMs >= 0 && diffMs < 5 * 60 * 1000;

      let ownerId: string | null = null;
      let title = "Alarme SOPP";
      let body = "Lembrete programado.";
      let url = "/";

      if (alarm.event) {
        ownerId = alarm.event.project?.ownerId || null;
        title = `⏰ Alarme Agenda: ${alarm.event.title}`;
        
        // Formatar o horário do evento forçando o fuso horário de Brasília
        const eventDate = new Date(alarm.event.startDate);
        const timeString = eventDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
        const dateString = eventDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
        
        body = `Alarme referente ao compromisso de ${dateString} às ${timeString}.`;
        url = "/agenda";
      } else if (alarm.task) {
        ownerId = alarm.task.project?.ownerId || null;
        title = `📝 Lembrete Tarefa: ${alarm.task.title}`;
        
        const taskDate = alarm.task.taskDate ? new Date(alarm.task.taskDate) : null;
        if (taskDate) {
          const dateString = taskDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
          body = `Atenção à tarefa agendada para o dia ${dateString}.`;
        } else {
          body = `Lembrete de tarefa programada.`;
        }
        url = "/tasks";
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

      if (willSend) {
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
        events: events.length,
        finances: finances.length,
        alarms: alarms.length,
      },
      debug,
    });
  } catch (error) {
    console.error("[CRON_PROCESS_ALERTS]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
