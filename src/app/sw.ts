/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push Notification Event
self.addEventListener("push", (event) => {
    if (event.data) {
        try {
            const data = event.data.json();
            const options: NotificationOptions = {
                body: data.body,
                icon: data.icon || "/logo-sopp.svg",
                badge: data.badge || "/logo-sopp.svg",
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: "2",
                    url: data.url || "/",
                },
            };
            event.waitUntil(self.registration.showNotification(data.title, options));
        } catch (e) {
            console.error("[SOPP Service Worker] Push event error:", e);
        }
    }
});

// Notification Click Event
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            const urlToOpen = event.notification.data?.url || "/";
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
