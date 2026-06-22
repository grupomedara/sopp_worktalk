"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export function PwaInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true); // Default to true so it doesn't flash before hydration
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // Register Service Worker reliably in Next.js
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .catch((err) => console.error('Service worker registration failed:', err));
        }

        // Detect if the app is already installed or running in standalone mode
        const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes("android-app://");

        setIsStandalone(isStandaloneMode);

        if (isStandaloneMode) return;

        // Detect iOS Device for custom instructions
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
            (navigator.maxTouchPoints > 0 && userAgent.includes("macintosh"));
        setIsIOS(isIOSDevice);

        // Listen to the beforeinstallprompt event for Android/Desktop
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Verificar se foi dispensado recentemente (últimos 7 dias)
            const dismissedTime = localStorage.getItem("pwa-prompt-dismissed-time");
            if (dismissedTime) {
                const daysElapsed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
                if (daysElapsed < 7) return; // Oculta por 7 dias
            } else {
                // Compatibilidade com lógica antiga
                const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
                if (hasDismissed) return;
            }

            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Show prompt for iOS users since they don't get the beforeinstallprompt event
        if (isIOSDevice) {
            const dismissedTime = localStorage.getItem("pwa-prompt-dismissed-time");
            let shouldShow = true;
            if (dismissedTime) {
                const daysElapsed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
                if (daysElapsed < 7) {
                    shouldShow = false;
                }
            } else {
                // Compatibilidade com lógica antiga
                const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
                if (hasDismissed) {
                    shouldShow = false;
                }
            }

            if (shouldShow) {
                // Delay prompt to not be aggressive
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            setIsInstalling(true);
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted") {
                    setShowPrompt(false);
                    setDeferredPrompt(null);
                }
            } catch (err) {
                console.error("Install prompt error:", err);
            } finally {
                setIsInstalling(false);
            }
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
    };

    const handleForceClear = () => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((r) => r.unregister());
            });
        }
        localStorage.removeItem("pwa-prompt-dismissed");
        window.location.reload();
    };

    if (isStandalone || !showPrompt) return null;

    return (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <Download className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-zinc-100">Instalar o SOPP</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                            {isIOS
                                ? "Adicione à Tela de Início para uma melhor experiência."
                                : "Instale o app para acesso rápido e notificações."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    aria-label="Dismiss"
                    disabled={isInstalling}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="mt-4">
                {isIOS ? (
                    <div className="text-xs text-zinc-300 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                        <p className="flex items-center gap-2">
                            <span>1. Toque no ícone de compartilhar <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 pb-[2px]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></span></span>
                        </p>
                        <p className="mt-2">2. Selecione <strong>"Adicionar à Tela de Início"</strong></p>
                    </div>
                ) : (
                    <Button
                        onClick={handleInstallClick}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2"
                        disabled={isInstalling}
                    >
                        {isInstalling && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isInstalling ? "Processando..." : "Instalar App"}
                    </Button>
                )}
            </div>
        </div>
    );
}
