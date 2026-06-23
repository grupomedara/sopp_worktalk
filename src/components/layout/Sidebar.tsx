"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Target,
  FolderOpen,
  CheckSquare,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Wallet,
  Calendar,
  LayoutDashboard,
  StickyNote,
  KanbanSquare,
  ShieldAlert,
  UserCircle,
  LogOut,
  Menu,
  HelpCircle,
  Heart,
  List,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetClose } from "@/components/ui/sheet";
import { NotificationToggle } from "@/components/ui/NotificationToggle";
import { ManualDialog } from "./ManualDialog";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Acomp. Processos", href: "/processes", icon: List },
  { name: "Rotinas & SOPs", href: "/routines", icon: ClipboardList },
  { name: "Notas & Mapas", href: "/notes", icon: StickyNote },
  {
    name: "Sistema",
    icon: UserCircle,
    children: [
      { name: "Perfil", href: "/profile", icon: UserCircle },
      { name: "Admin", href: "/admin/users", icon: ShieldAlert },
    ],
  },
];

// Items displayed in the mobile bottom navigation (most important ones)
const bottomNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Processos", href: "/processes", icon: List },
  { name: "Rotinas", href: "/routines", icon: ClipboardList },
  { name: "Notas", href: "/notes", icon: StickyNote },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [openGroups, setOpenGroups] = useState<string | null>(null);

  // Save scroll position on scroll
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("sidebar-scroll", e.currentTarget.scrollTop.toString());
  };

  // Restore scroll on mount/pathname change
  useEffect(() => {
    const saved = sessionStorage.getItem("sidebar-scroll");
    if (saved && navRef.current) {
      navRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [pathname]);

  // Sync open group with current pathname (Breadcrumb persistence)
  useEffect(() => {
    const activeGroup = navigation.find(item => 
      "children" in item && item.children?.some(c => c.href === pathname)
    );
    if (activeGroup) {
      setOpenGroups(activeGroup.name);
    } else {
      setOpenGroups(null);
    }
  }, [pathname]);

  const toggleGroup = (name: string) => {
    if (!isSidebarExpanded) setIsSidebarExpanded(true);
    setOpenGroups(prev => prev === name ? null : name);
  };

  if (pathname === "/login") return null;

  return (
    <>
      {/* ── Desktop Sidebar (md and above) ── */}
      <div className={cn(
        "hidden md:flex flex-col h-screen bg-zinc-950 border-r border-border fixed left-0 top-0 z-50 transition-all group/sidebar shadow-2xl",
        isSidebarExpanded ? "w-64" : "w-20 [@media(hover:hover)]:hover:w-64"
      )}>
        <div
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className={cn(
            "p-4 flex items-center justify-center group-hover/sidebar:justify-start cursor-pointer md:cursor-pointer",
            isSidebarExpanded && "justify-start"
          )}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/logo-sopp.svg" alt="SOPP Logo" className={cn(
              "w-8 h-8 text-primary group-hover/sidebar:w-10 group-hover/sidebar:h-10 transition-all duration-300",
              isSidebarExpanded && "w-10 h-10"
            )} />
          </div>
          <div className={cn(
            "ml-4 opacity-0 group-hover/sidebar:opacity-100 transition-opacity whitespace-nowrap overflow-hidden flex flex-col items-start justify-center",
            isSidebarExpanded && "opacity-100"
          )}>
            <h1 className="text-xl font-black tracking-tight text-foreground leading-none">
              SOPP<span className="text-primary">.</span>
            </h1>
            <p className="text-[6px] font-bold text-muted-foreground tracking-widest mt-0.5 whitespace-nowrap">
              Sistema Operacional de Performance Pessoal
            </p>
          </div>
        </div>

        <nav 
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 px-3 mt-8 space-y-2 overflow-y-auto scrollbar-none"
        >
          {navigation.map((item) => {
            if ("children" in item && item.children) {
              const isChildActive = item.children.some(c => pathname === c.href);
              const isOpenGroup = (openGroups === item.name);

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      "flex items-center w-full h-12 rounded-none transition-all relative overflow-hidden group/item",
                      isChildActive ? "text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <div className="min-w-[56px] flex items-center justify-center">
                      <item.icon className="h-5 w-5 transition-transform group-hover/item:scale-110" />
                    </div>
                    <span className={cn(
                      "ml-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2 transition-all duration-300 whitespace-nowrap font-bold text-xs uppercase tracking-widest flex items-center justify-between w-full pr-4",
                      isSidebarExpanded && "opacity-100 ml-2"
                    )}>
                      {item.name}
                      <span className={cn("text-[8px] transition-transform", isOpenGroup ? "rotate-90" : "")}>▶</span>
                    </span>
                  </button>
                  <div className={cn(
                    "pl-12 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                    isOpenGroup && isSidebarExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}>
                    {item.children.map(child => {
                      const isSubActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setIsSidebarExpanded(false)}
                          className={cn(
                            "flex items-center h-9 text-xs font-semibold tracking-wider uppercase transition-all",
                            isSubActive ? "text-primary" : "text-zinc-500 hover:text-foreground hover:pl-1"
                          )}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Single Item rendering
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href as string}
                onClick={() => setIsSidebarExpanded(false)}
                className={cn(
                  "flex items-center h-12 rounded-none transition-all relative overflow-hidden group/item",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-1 absolute left-0 h-full transition-transform duration-300",
                  isActive ? "bg-primary scale-y-100" : "bg-primary scale-y-0 group-hover/item:scale-y-50"
                )} />

                <div className="min-w-[56px] flex items-center justify-center">
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform group-hover/item:scale-110",
                      isActive ? "text-primary" : "text-current"
                    )}
                  />
                </div>

                <span className={cn(
                  "ml-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2 transition-all duration-300 whitespace-nowrap font-bold text-xs uppercase tracking-widest",
                  isSidebarExpanded && "opacity-100 ml-2"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsManualOpen(true)}
            className="flex items-center w-full h-12 rounded-none transition-all relative overflow-hidden group/manual text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <div className="w-1 absolute left-0 h-full transition-transform duration-300 bg-primary scale-y-0 group-hover/manual:rotate-12 group-hover/manual:scale-y-100" />
            <div className="min-w-[56px] flex items-center justify-center">
              <HelpCircle className="h-5 w-5 transition-transform group-hover/manual:scale-110" />
            </div>
            <span className={cn(
              "ml-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2 transition-all duration-300 whitespace-nowrap font-black text-[10px] uppercase tracking-widest",
              isSidebarExpanded && "opacity-100 ml-2"
            )}>
              Manual
            </span>
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center w-full h-12 rounded-none transition-all relative overflow-hidden group/logout text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          >
            <div className="w-1 absolute left-0 h-full transition-transform duration-300 bg-red-500 scale-y-0 group-hover/logout:scale-y-100" />
            <div className="min-w-[56px] flex items-center justify-center">
              <LogOut className="h-5 w-5 transition-transform group-hover/logout:scale-110" />
            </div>
            <span className={cn(
              "ml-0 opacity-0 group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2 transition-all duration-300 whitespace-nowrap font-black text-[10px] uppercase tracking-widest",
              isSidebarExpanded && "opacity-100 ml-2"
            )}>
              Sair
            </span>
          </button>
        </nav>

        <div className="px-3 w-full mb-2">
          <NotificationToggle collapsed={!isSidebarExpanded} />
        </div>

        <div className={cn("border-t border-border flex flex-col items-center justify-center overflow-hidden w-full transition-all duration-300", isSidebarExpanded ? "p-4" : "p-2")}>
          <p className="text-[7px] uppercase font-bold tracking-widest text-muted-foreground mb-1 text-center whitespace-normal">
            Desenvolvido por
          </p>
          <div className="w-full flex justify-center mt-1">
            <a href="https://www.cobusiness.com.br" target="_blank" rel="noopener noreferrer" className="cursor-pointer transition-all hover:scale-105">
              <img
                src="/logo-cobusiness.png"
                alt="CO. Business Group"
                className={cn("transition-all duration-300", isSidebarExpanded ? "w-28" : "w-16")}
              />
            </a>
          </div>
          <p className="text-[7px] text-muted-foreground mt-1.5 text-center whitespace-normal opacity-60 font-medium tracking-wide">
            © 2026 Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation (below md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-16 w-full gap-1 transition-all",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive ? "text-primary scale-110" : "text-current"
                )}
              />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest transition-all",
                isActive ? "opacity-100" : "opacity-50"
              )}>
                {item.name}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center h-16 w-full gap-1 transition-all text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5 transition-all" />
              <span className="text-[9px] font-bold uppercase tracking-widest transition-all opacity-50">
                Menu
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl pt-2 pb-6 px-4 bg-zinc-950 border-t border-zinc-900 border-x-0 outline-none flex flex-col items-center">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mb-6 mt-1" />
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
            </SheetHeader>
            <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-2">
              <div className="flex flex-col gap-2 mb-4 w-full">
                {navigation.map((item) => {
                  if ("children" in item && item.children) {
                    const isChildActive = item.children.some(c => pathname === c.href);
                    const isOpenGroup = (openGroups === item.name);

                    return (
                      <div key={`mob-group-${item.name}`} className="space-y-1 w-full">
                        <button
                          onClick={() => toggleGroup(item.name)}
                          className={cn(
                            "flex items-center justify-between w-full p-4 rounded-xl transition-all border",
                            isChildActive
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="font-bold text-[11px] tracking-widest uppercase">{item.name}</span>
                          </div>
                          <span className={cn("text-xs transition-transform", isOpenGroup ? "rotate-180" : "")}>▼</span>
                        </button>
                        <div className={cn(
                          "pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out w-full",
                          isOpenGroup ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                        )}>
                          {item.children.map(child => {
                            const isSubActive = pathname === child.href;
                            return (
                              <Link
                                key={`mob-sub-${child.name}`}
                                href={child.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-lg transition-all text-xs font-semibold uppercase tracking-wider",
                                  isSubActive ? "text-primary bg-zinc-900 border border-zinc-800" : "text-zinc-500 hover:text-zinc-100"
                                )}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={`mob-${item.name}`}
                      href={item.href as string}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl transition-all border w-full",
                        isActive
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-bold text-[11px] tracking-widest uppercase truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Mobile Footer Area */}
            <div className="w-full pt-4 mt-auto space-y-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsManualOpen(true);
                }}
                className="flex items-center gap-3 w-full p-4 rounded-2xl transition-all border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              >
                <HelpCircle className="w-5 h-5 opacity-80" />
                <span className="font-bold text-[10px] tracking-widest uppercase opacity-90">Manual do Usuário</span>
              </button>
              <NotificationToggle />
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex items-center gap-3 w-full p-4 rounded-2xl transition-all border bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
              >
                <LogOut className="w-5 h-5 opacity-80" />
                <span className="font-bold text-[10px] tracking-widest uppercase opacity-90">Sair do Sistema</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      <ManualDialog open={isManualOpen} onOpenChange={setIsManualOpen} />
    </>
  );
}
