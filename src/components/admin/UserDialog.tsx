"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser } from "@/app/actions/auth";
import { Plus } from "lucide-react";

interface UserDialogProps {
    user?: {
        id: string;
        name: string;
        document: string;
        role: any;
    }
}

export function UserDialog({ user }: UserDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const isEditing = !!user;

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        const formData = new FormData(event.currentTarget);
        if (isEditing) {
            formData.append("id", user.id);
        }

        const result = isEditing 
            ? await updateUser(undefined, formData)
            : await createUser(undefined, formData);
            
        setLoading(false);

        if (result === "Usuário criado com sucesso!" || result === "Usuário atualizado com sucesso!") {
            setOpen(false);
        } else {
            setMessage(result || "Erro desconhecido");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        EDITAR
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                        {isEditing 
                            ? "Altere as informações do usuário conforme necessário." 
                            : "Defina as credenciais do novo usuário."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                className="col-span-3"
                                required
                                defaultValue={user?.name}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="document" className="text-right">
                                CPF
                            </Label>
                            <Input
                                id="document"
                                name="document"
                                placeholder="000.000.000-00"
                                className="col-span-3"
                                required
                                minLength={11}
                                defaultValue={user?.document}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Senha
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="col-span-3"
                                required={!isEditing}
                                minLength={6}
                                placeholder={isEditing ? "Deixe em branco para manter" : ""}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Função
                            </Label>
                            <div className="col-span-3">
                                <Select name="role" defaultValue={user?.role || "USER"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">Usuário Padrão</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {message && <p className="text-sm text-red-500 mb-4 text-right">{message}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Usuário")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
