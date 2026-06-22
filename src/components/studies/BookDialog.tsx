"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createBook } from "@/app/actions/books";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface BookDialogProps {
  onCreated: (book: any) => void;
}

export function BookDialog({ onCreated }: BookDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
     title: "",
     author: "",
     totalChapters: 10
  });

  const handleSubmit = async () => {
     if (!formData.title) {
        toast({ title: "Erro", description: "Título é obrigatório.", variant: "destructive" });
        return;
     }

     setLoading(true);
     const res = await createBook(formData);
     setLoading(false);

     if (res.success && res.data) {
        toast({ title: "Livro adicionado!", description: "Bons estudos! A meta é progredir." });
        onCreated(res.data);
        setOpen(false);
        setFormData({ title: "", author: "", totalChapters: 10 });
     } else {
        toast({ title: "Erro", description: res.error || "Falha ao criar livro", variant: "destructive" });
     }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-2 font-bold text-xs uppercase bg-white text-black hover:bg-white/90">
           <Plus className="h-4 w-4" /> Adicionar Livro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="font-black tracking-tight text-xl">Novo Livro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-xs uppercase font-bold text-muted-foreground">Título</Label>
            <Input 
              id="title" 
              placeholder="Ex: O Homem Mais Rico da Babilônia" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              className="bg-background/50 border-border/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="author" className="text-xs uppercase font-bold text-muted-foreground">Autor</Label>
            <Input 
              id="author" 
              placeholder="Ex: George S. Clason" 
              value={formData.author} 
              onChange={(e) => setFormData({ ...formData, author: e.target.value })} 
              className="bg-background/50 border-border/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="totalChapters" className="text-xs uppercase font-bold text-muted-foreground">Total de Capítulos</Label>
            <Input 
              id="totalChapters" 
              type="number" 
              min={1} 
              value={formData.totalChapters} 
              onChange={(e) => setFormData({ ...formData, totalChapters: parseInt(e.target.value) || 1 })} 
              className="bg-background/50 border-border/40"
            />
          </div>

          <div className="flex justify-end pt-2">
             <Button onClick={handleSubmit} disabled={loading} className="w-full font-bold uppercase text-xs">
                 {loading ? "Salvando..." : "Salvar Livro"}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
