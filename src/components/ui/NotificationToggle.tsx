"use client";

import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationToggleProps {
  collapsed?: boolean;
}

export function NotificationToggle({ collapsed = false }: NotificationToggleProps) {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array | null => {
    try {
      if (!base64String || base64String.length < 10) {
        console.error("[SOPP Push] Invalid VAPID key (too short):", base64String?.length);
        return null;
      }
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (e) {
      console.error("[SOPP Push] Failed to decode VAPID key:", e);
      return null;
    }
  }, []);

  // Check actual subscription state on mount
  useEffect(() => {
    setMounted(true);
    checkSubscriptionState();
  }, []);

  const checkSubscriptionState = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!registration) {
        setIsActive(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      setIsActive(!!subscription);
    } catch (e) {
      console.warn("[SOPP Push] Check state failed:", e);
      setIsActive(false);
    }
  };

  const handleActivate = async () => {
    setIsProcessing(true);
    try {
      // 1. Check secure context
      const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost";
      if (!isSecure) {
        toast.error("Notificações requerem HTTPS.");
        return;
      }

      // 2. Check API support
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        toast.error("Seu navegador não suporta notificações push.");
        return;
      }

      // 3. Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === "denied") {
        toast.error("Notificações foram bloqueadas. Vá em Configurações do Site > Notificações e permita.");
        return;
      }

      if (permission !== "granted") {
        toast.warning("Permissão não concedida. Tente novamente e clique em 'Permitir'.");
        return;
      }

      // 4. Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 5. Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Chave VAPID não configurada no servidor.");
        return;
      }

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        if (!applicationServerKey) {
          toast.error("Chave VAPID inválida. Verifique a variável NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
          return;
        }
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
      }

      // 6. Extract keys
      const rawP256dh = subscription.getKey("p256dh");
      const rawAuth = subscription.getKey("auth");

      if (!rawP256dh || !rawAuth) {
        toast.error("Falha ao extrair chaves do navegador. Tente outro navegador.");
        return;
      }

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawP256dh))));
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))));

      // 7. Save to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: { p256dh, auth },
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(`Erro ao salvar: ${data.error || "Falha desconhecida"}`);
        return;
      }


      setIsActive(true);
      toast.success("🔔 Notificações ativadas!");
    } catch (error: any) {
      console.error("[SOPP Push] Activate failed:", error);
      toast.error(`Erro: ${error.message || "Falha ao ativar notificações"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    setIsProcessing(true);
    try {
      // Unsubscribe from push manager
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      // Delete from server
      await fetch("/api/push/unsubscribe", { method: "POST" });

      setIsActive(false);
      toast.info("Notificações desativadas.");
    } catch (error) {
      console.error("[SOPP Push] Deactivate failed:", error);
      toast.error("Erro ao desativar notificações.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await handleActivate();
    } else {
      await handleDeactivate();
    }
  };

  if (!mounted) return null;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center justify-center w-full mt-1 gap-1 px-1">
        <div className="flex items-center gap-1">
          <Bell className={cn("w-3.5 h-3.5 transition-colors", isActive ? "text-emerald-500" : "text-zinc-500")} />
          <span className="text-[7px] font-black uppercase text-zinc-400">AVISOS</span>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isProcessing}
          className="scale-75 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-700"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40 w-full mt-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-100">Notificações</span>
        <span className="text-[9px] text-zinc-500 font-medium">
          {isProcessing ? "Processando..." : isActive ? "Ativas" : "Desativadas"}
        </span>
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isProcessing}
        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-700"
      />
    </div>
  );
}
