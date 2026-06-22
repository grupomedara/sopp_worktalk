"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { EventForm } from "@/components/agenda/EventForm";
import { Project } from "@prisma/client";
import { useMediaQuery } from "@/hooks/use-media-query";

interface EventDialogProps {
    projects: Project[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    initialData?: any;
}

export function EventDialog({ projects, open, onOpenChange, trigger, initialData }: EventDialogProps) {
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const router = useRouter();

    // Determine current state and setter
    const isOpen = isControlled ? open : internalOpen;
    const setOpen = isControlled ? onOpenChange : setInternalOpen;
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleSuccess = () => {
        if (setOpen) {
            setOpen(false);
        }
        router.refresh(); // Re-fetch events from server to show new recurring instances
    };

    const TriggerComponent = trigger ? trigger : (
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Compromisso
        </Button>
    );

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {TriggerComponent}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{initialData?.id ? "Editar Compromisso" : "Novo Compromisso"}</DialogTitle>
                        <DialogDescription>
                            {initialData?.id ? "Atualize as informações do compromisso." : "Agende uma reunião, aula ou evento."}
                        </DialogDescription>
                    </DialogHeader>
                    <EventForm projects={projects} onSuccess={handleSuccess} initialData={initialData} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {TriggerComponent}
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh] bg-white dark:bg-zinc-950 border-t shadow-2xl">
                <DrawerHeader className="text-left bg-white dark:bg-zinc-950 rounded-t-xl">
                    <DrawerTitle>{initialData?.id ? "Editar Compromisso" : "Novo Compromisso"}</DrawerTitle>
                    <DrawerDescription>
                        {initialData?.id ? "Atualize as informações do compromisso." : "Agende uma reunião, aula ou evento."}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8 overflow-y-auto bg-white dark:bg-zinc-950">
                    <EventForm projects={projects} onSuccess={handleSuccess} initialData={initialData} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
