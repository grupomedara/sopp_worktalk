"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Trash2, Heart, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createPrayer, updatePrayerStatus, deletePrayer, updatePrayer } from "@/app/actions/spiritual";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


export interface Prayer {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  createdAt: Date;
}

interface PrayerListProps {
  initialPrayers: Prayer[];
}

const CATEGORIES = ["Pessoal", "Família", "Intercessão", "Igreja", "Trabalho", "Saúde"];

export function PrayerList({ initialPrayers }: PrayerListProps) {
  const [prayers, setPrayers] = useState<Prayer[]>(initialPrayers);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Pessoal",
  });

  async function handleSavePrayer() {
    if (!formData.title) return;
    setLoading(true);

    if (editingPrayer) {
      const res = await updatePrayer(editingPrayer.id, formData);
      setLoading(false);
      if (res.success && res.data) {
        setPrayers(prayers.map(p => p.id === editingPrayer.id ? (res.data as unknown as Prayer) : p));
        setIsAdding(false);
        setEditingPrayer(null);
        setFormData({ title: "", description: "", category: "Pessoal" });
        toast({ title: "Oração atualizada", description: "As alterações foram salvas com sucesso." });
      } else {
        toast({ title: "Erro", description: "Falha ao atualizar oração", variant: "destructive" });
      }
    } else {
      const res = await createPrayer(formData);
      setLoading(false);
      if (res.success && res.data) {
        setPrayers([res.data as unknown as Prayer, ...prayers]);
        setIsAdding(false);
        setFormData({ title: "", description: "", category: "Pessoal" });
        toast({ title: "Oração adicionada", description: "Obrigado por registrar seu clamor!" });
      } else {
        toast({ title: "Erro", description: "Falha ao adicionar oração", variant: "destructive" });
      }
    }
  }

  function handleOpenEdit(prayer: Prayer) {
    setEditingPrayer(prayer);
    setFormData({
      title: prayer.title,
      description: prayer.description || "",
      category: prayer.category,
    });
    setIsAdding(true);
  }

  async function handleStatusChange(id: string, currentStatus: string) {
    const newStatus = currentStatus === "PENDING" ? "COMPLETED" : "PENDING";
    const res = await updatePrayerStatus(id, newStatus as any);
    
    if (res.success) {
      setPrayers(prayers.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (newStatus === "COMPLETED") {
        toast({ title: "Oração Respondida!", description: "Louvado seja Deus!", duration: 3000 });
      }
    }
  }

  async function handleDelete(id: string) {
    const res = await deletePrayer(id);
    if (res.success) {
      setPrayers(prayers.filter(p => p.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border/20 backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500 fill-red-500/10" />
          Meus Clamores
        </h2>

        <Dialog open={isAdding} onOpenChange={(open) => {
          setIsAdding(open);
          if (!open) {
            setEditingPrayer(null);
            setFormData({ title: "", description: "", category: "Pessoal" });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-2 font-bold text-xs uppercase" onClick={() => {
              setEditingPrayer(null);
              setFormData({ title: "", description: "", category: "Pessoal" });
            }}>
              <Plus className="h-4 w-4" /> Nova Oração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/40">
            <DialogHeader>
              <DialogTitle className="font-black tracking-tight text-xl">
                {editingPrayer ? "Editar Oração" : "Nova Oração"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs uppercase font-bold text-muted-foreground">Motivo</Label>
                <Input
                  id="title"
                  placeholder="Ex: Pela saúde do meu filho"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/50 border-border/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-xs uppercase font-bold text-muted-foreground">Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-background/50 border-border/40">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs uppercase font-bold text-muted-foreground">Detalhes (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Se quiser, detalhe mais seu pedido..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50 border-border/40 h-24"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSavePrayer} disabled={loading} className="w-full font-bold uppercase text-xs">
                {loading ? "Salvando..." : (editingPrayer ? "Atualizar Oração" : "Salvar Oração")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {prayers.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-10 italic">Nenhuma oração registrada ainda. Abra seu coração.</p>
        )}
        {prayers.map((prayer) => {
          const isCompleted = prayer.status === "COMPLETED";
          return (
            <div
              key={prayer.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border border-border/30 backdrop-blur-md transition-all",
                isCompleted ? "bg-muted/30 border-primary/20 opacity-75" : "bg-card hover:bg-muted/10"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleStatusChange(prayer.id, prayer.status)}
                  className="mt-1 flex-shrink-0"
                >
                  <CheckCircle2 className={cn(
                    "h-5 w-5 transition-all text-muted-foreground hover:text-primary",
                    isCompleted && "text-primary fill-primary/10"
                  )} />
                </button>
                <div>
                  <h3 className={cn("text-sm font-semibold leading-none", isCompleted && "line-through text-muted-foreground")}>
                    {prayer.title}
                  </h3>
                  {prayer.description && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">{prayer.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider py-0 px-2 border-primary/20 text-primary">
                      {prayer.category}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground self-center">
                      {new Date(prayer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleOpenEdit(prayer)} 
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(prayer.id)} 
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
