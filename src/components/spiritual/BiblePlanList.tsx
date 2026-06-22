"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Clock, Play, Trash2 } from "lucide-react";
import { enrollInPlan, updatePlanProgress, createAutomaticPlan, createRecommendedPlan, deleteUserPlan, deleteReadingPlan } from "@/app/actions/spiritual";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BIBLE_BOOKS } from "@/lib/bible-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stripHtml } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export interface Plan {
  id: string;
  title: string;
  description: string | null;
  type: string;
  totalDays: number;
  readings?: Array<{ day: number; reference: string; books: string; chapters: string; }>;
}

export interface UserPlan {
  id: string;
  planId: string;
  currentDay: number;
  progress: number;
  status: string;
  startedAt: Date;
  plan: Plan;
}

interface BiblePlanListProps {
  allPlans: Plan[];
  userPlans: UserPlan[];
}

export function BiblePlanList({ allPlans, userPlans }: BiblePlanListProps) {
  const { toast } = useToast();
  const [activeUserPlans, setActiveUserPlans] = useState<UserPlan[]>(userPlans);
  const [localPlans, setLocalPlans] = useState<Plan[]>(allPlans);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<UserPlan | null>(null);
  const [formData, setFormData] = useState({ title: "", bookId: "GEN", days: 10 });

  // Confirmation modal states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmTemplateId, setConfirmTemplateId] = useState<string | null>(null);



  async function handleEnroll(planId: string) {
    const res = await enrollInPlan(planId);
    if (res.success && res.data) {
      toast({ title: "Inscrito com sucesso!", description: "Bons estudos! A Palavra alimentará sua alma." });
      const planDetails = localPlans.find(p => p.id === planId);
      if (planDetails) {
         setActiveUserPlans([...activeUserPlans, {
            id: res.data.id,
            planId,
            currentDay: 1,
            progress: 0,
            status: "IN_PROGRESS",
            startedAt: new Date(),
            plan: planDetails
         }]);
      }
    }
  }

  async function handleCreateAutomatic() {
    if (!formData.title || formData.days <= 0) return;
    setLoading(true);

    const res = await createAutomaticPlan(formData);
    setLoading(false);

    if (res.success && res.data) {
      toast({ title: "Plano Gerado!", description: "Seu plano automático foi criado e você foi inscrito!" });
      setLocalPlans([...localPlans, res.data as unknown as Plan]);
      
      // Auto enroll updates will come via revalidate or local list merging
      const createdPlan = res.data as unknown as Plan;
      setActiveUserPlans([...activeUserPlans, {
         id: "temp-" + Date.now(), // safe
         planId: createdPlan.id,
         currentDay: 1,
         progress: 0,
         status: "IN_PROGRESS",
         startedAt: new Date(),
         plan: createdPlan
      }]);

      setIsCreating(false);
      setFormData({ title: "", bookId: "GEN", days: 10 });
    } else {
      toast({ title: "Erro", description: res.error || "Falha ao gerar plano", variant: "destructive" });
    }
  }
  
  async function handleDeleteUserPlan(id: string) {
    setLoading(true);
    const res = await deleteUserPlan(id);
    setLoading(false);
    
    if (res.success) {
      toast({ title: "Plano removido", description: "O plano foi removido da sua lista." });
      setActiveUserPlans(activeUserPlans.filter(p => p.id !== id));
      setSelectedDetail(null);
    } else {
      toast({ title: "Erro", description: res.error || "Falha ao remover plano", variant: "destructive" });
    }
    setConfirmDeleteId(null);
  }

  async function handleDeleteTemplate(id: string) {
    setLoading(true);
    const res = await deleteReadingPlan(id);
    setLoading(false);
    
    if (res.success) {
      toast({ title: "Plano do Sistema removido", description: "O modelo de plano foi excluído permanentemente." });
      setLocalPlans(localPlans.filter(p => p.id !== id));
      setActiveUserPlans(activeUserPlans.filter(p => p.planId !== id));
    } else {
      toast({ title: "Erro", description: res.error || "Falha ao remover modelo de plano", variant: "destructive" });
    }
    setConfirmTemplateId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border/20 backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Planos de Leitura
        </h2>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-2 font-bold text-xs uppercase">
               + Criar Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-background/95 backdrop-blur-xl border-border/40">
            <DialogHeader>
              <DialogTitle className="font-black tracking-tight text-xl">Novo Plano de Leitura</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="auto" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-2 bg-background/30 border border-border/10 rounded-lg p-1 h-10">
                <TabsTrigger value="auto" className="text-xs font-bold uppercase">Automático</TabsTrigger>
                <TabsTrigger value="templates" className="text-xs font-bold uppercase">Recomendados</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="space-y-4 pt-4 outline-none">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-xs uppercase font-bold text-muted-foreground">Nome do Plano</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Minha Jornada em 10 dias"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-background/50 border-border/40"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="book" className="text-xs uppercase font-bold text-muted-foreground">Livro</Label>
                    <Select value={formData.bookId} onValueChange={(v) => setFormData({ ...formData, bookId: v })}>
                      <SelectTrigger className="bg-background/50 border-border/40">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 backdrop-blur-xl h-48 overflow-y-auto">
                        {BIBLE_BOOKS.map(book => (
                          <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="days" className="text-xs uppercase font-bold text-muted-foreground">Dias</Label>
                    <Input
                      id="days"
                      type="number"
                      min={1}
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                      className="bg-background/50 border-border/40"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleCreateAutomatic} disabled={loading} className="w-full font-bold uppercase text-xs">
                    {loading ? "Gerando..." : "Gerar Plano"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4 pt-4 outline-none">
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
                  {[
                    { type: "BIBLE_365", title: "Bíblia Toda", subtitle: "365 dias", desc: "Leitura sequencial completa de Gênesis a Apocalipse." },
                    { type: "BIBLE_180", title: "Bíblia Toda", subtitle: "180 dias", desc: "Leitura completa em um ritmo focado e acelerado." },
                    { type: "CHRONOLOGICAL", title: "Cronológica", subtitle: "365 dias", desc: "A Bíblia na sequência da história e acontecimentos." },
                    { type: "PENTATEUCH", title: "O Pentateuco", subtitle: "60 dias", desc: "Os cinco primeiros livros da Bíblia (Gênesis a Deuteronômio)." },
                    { type: "NT_90", title: "Novo Testamento", subtitle: "90 dias", desc: "Uma jornada diária pelos 27 livros do Novo Testamento." },
                    { type: "WISDOM_30", title: "Sabedoria", subtitle: "30 dias", desc: "Uma dose diária de provérbios e louvor com os Salmos." }
                  ].map((temp) => (
                    <Card key={temp.type} className="border border-border/30 bg-background/40 hover:bg-primary/5 transition-all cursor-pointer" onClick={async () => {
                      setLoading(true);
                      const res = await createRecommendedPlan(temp.type as any);
                      setLoading(false);
                      if (res.success && res.data) {
                        toast({ title: "Plano Criado!", description: `${temp.title} adicionado à sua lista!` });
                        setLocalPlans([...localPlans, res.data as unknown as Plan]);
                        setActiveUserPlans([...activeUserPlans, {
                          id: "temp-" + Date.now(),
                          planId: res.data.id,
                          currentDay: 1,
                          progress: 0,
                          status: "IN_PROGRESS",
                          startedAt: new Date(),
                          plan: res.data as unknown as Plan
                        }]);
                        setIsCreating(false);
                      } else {
                        toast({ title: "Erro", description: res.error || "Falha ao criar", variant: "destructive" });
                      }
                    }}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-black">{temp.title}</CardTitle>
                          <Badge variant="outline" className="text-[10px]">{temp.subtitle}</Badge>
                        </div>
                        <CardDescription className="text-[11px] mt-1 text-muted-foreground line-clamp-2">
                          {temp.desc}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>

        </Dialog>
      </div>

      {localPlans.length === 0 && (
         <p className="text-center text-xs text-muted-foreground py-10">Nenhum plano disponível.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localPlans.map((plan) => {

          const enrollment = activeUserPlans.find(up => up.planId === plan.id);
          const isEnrolled = !!enrollment;

          return (
            <Card key={plan.id} className="border border-border/30 bg-card/60 hover:bg-muted/10 backdrop-blur-xl transition-all h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-[10px] tracking-wider uppercase border-primary/30 text-primary bg-primary/5">
                    {plan.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {plan.totalDays} dias
                  </span>
                </div>
                <CardTitle className="text-md font-bold text-foreground leading-tight">
                  {plan.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                  {stripHtml(plan.description || "Nenhuma descrição.")}
                </p>

                <div className="mt-4 pt-4 border-t border-border/20 flex flex-col gap-3">
                  {isEnrolled ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="text-primary">{Math.round(enrollment!.progress)}%</span>
                      </div>
                      <Progress value={enrollment!.progress} className="h-1.5 bg-muted/30" />
                      <p className="text-[10px] text-muted-foreground text-center font-medium">
                         {enrollment!.progress >= 100 || enrollment!.status === "COMPLETED" ? (
                           <span className="text-green-500 flex items-center justify-center gap-1">
                             <CheckCircle className="h-3 w-3" /> Concluído
                           </span>
                         ) : (
                           `Dia ${enrollment!.currentDay} de ${plan.totalDays}`
                         )}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="outline" className="flex-1 text-xs font-bold uppercase gap-2 h-8 border-primary/20 text-primary hover:bg-primary/5" onClick={() => setSelectedDetail(enrollment || null)}>
                          {enrollment!.progress >= 100 || enrollment!.status === "COMPLETED" ? <CheckCircle className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          {enrollment!.progress >= 100 || enrollment!.status === "COMPLETED" ? "Revisar" : "Continuar"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-border/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(enrollment!.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEnroll(plan.id)} className="flex-1 text-xs font-bold uppercase gap-2 h-8">
                        <Play className="h-3 w-3" /> Iniciar Plano
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-border/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmTemplateId(plan.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {selectedDetail && (
        <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
          <DialogContent className="sm:max-w-[450px] bg-background/95 backdrop-blur-xl border-border/40">
            <DialogHeader className="pr-10">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="font-black tracking-tight text-xl">
                  {selectedDetail.plan.title}
                </DialogTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
                  onClick={() => setConfirmDeleteId(selectedDetail.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {(() => {
                const startedAt = new Date(selectedDetail.startedAt);
                startedAt.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const diffTime = today.getTime() - startedAt.getTime();
                const expectedDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
                
                const isBehind = selectedDetail.currentDay < expectedDay;
                const isAhead = selectedDetail.currentDay > expectedDay;
                const isOnTrack = selectedDetail.currentDay === expectedDay;

                return (
                  <>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/10">
                      <p className="text-xs uppercase font-bold text-muted-foreground flex justify-between">
                        Progresso Geral
                        <span className={`text-[10px] ${isBehind ? 'text-red-400' : isAhead ? 'text-green-400' : 'text-primary'}`}>
                          {isBehind ? "Atrasado" : isAhead ? "Adiantado" : "Em Dia"}
                        </span>
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-2xl font-black text-primary">{Math.round(selectedDetail.progress)}%</span>
                        <span className="text-xs text-muted-foreground font-bold">
                          {selectedDetail.progress >= 100 || selectedDetail.status === "COMPLETED" ? (
                            <span className="text-green-500 uppercase">Concluído</span>
                          ) : (
                            `Dia ${selectedDetail.currentDay} de ${selectedDetail.plan.totalDays}`
                          )}
                        </span>
                      </div>
                      <Progress value={selectedDetail.progress} className="h-2 mt-2 bg-background/50" />
                    </div>

                    {selectedDetail.currentDay > selectedDetail.plan.totalDays ? (
                       <Card className="border border-green-500/20 bg-green-500/5 shadow-none">
                         <CardContent className="p-6 text-center space-y-2">
                           <div className="mx-auto bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                             <CheckCircle className="h-6 w-6 text-green-500" />
                           </div>
                           <h3 className="font-black text-lg text-foreground">Plano Concluído! 🎉</h3>
                           <p className="text-xs text-muted-foreground leading-relaxed">Você completou toda a jornada. Que a Palavra continue sendo sua luz!</p>
                         </CardContent>
                       </Card>
                    ) : (
                      <Card className={`border shadow-none ${isBehind ? 'border-red-500/20 bg-red-500/5' : 'border-primary/20 bg-primary/5'}`}>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className={`text-xs font-bold uppercase tracking-wide ${isBehind ? 'text-red-400' : 'text-primary'}`}>
                            {isBehind ? `Sugerido para hoje — Dia ${expectedDay}` : `Leitura de Hoje — Dia ${selectedDetail.currentDay}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex justify-between items-center gap-2">
                            <div>
                               <p className="font-black text-lg text-foreground">
                                 {selectedDetail.plan.readings?.find(r => r.day === (isBehind ? expectedDay : selectedDetail.currentDay))?.reference || "Lido por hoje! 🎉"}
                               </p>
                               {isBehind && (
                                 <p className="text-[10px] text-muted-foreground mt-1 italic">
                                   Você parou no Dia {selectedDetail.currentDay}
                                 </p>
                               )}
                            </div>
                            <Button 
                              size="sm" 
                              className="font-bold text-xs uppercase h-8" 
                              disabled={loading}
                              onClick={async () => {
                                setLoading(true);
                                try {
                                  const nextDay = selectedDetail.currentDay + 1;
                                  const res = await updatePlanProgress(selectedDetail.id, nextDay);
                                  if (res.success) {
                                    const newProgress = Math.min(((nextDay - 1) / selectedDetail.plan.totalDays) * 100, 100);
                                    setActiveUserPlans(activeUserPlans.map(p => p.id === selectedDetail.id ? { ...p, currentDay: nextDay, progress: newProgress } : p));
                                    setSelectedDetail({ ...selectedDetail, currentDay: nextDay, progress: newProgress });
                                    toast({ title: `Dia ${selectedDetail.currentDay} concluído! 🙏` });
                                  } else {
                                    toast({ title: "Erro", description: res.error, variant: "destructive" });
                                  }
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              {loading ? "Processando..." : (isBehind ? "Avançar" : "Marcar Lido")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs uppercase font-bold text-muted-foreground">Cronograma</p>
                      <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                        {selectedDetail.plan.readings?.map(r => {
                          const readingDate = new Date(startedAt);
                          readingDate.setDate(readingDate.getDate() + r.day - 1);
                          const dateStr = readingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                          
                          const isRead = r.day < selectedDetail.currentDay;
                          const isToday = r.day === expectedDay;
                          const isCurrentReading = r.day === selectedDetail.currentDay;

                          return (
                            <div key={r.day} className={`flex justify-between items-center p-3 rounded-lg border text-xs ${
                              isRead
                                ? 'border-primary/10 bg-primary/5'
                                : isToday
                                ? 'border-amber-400/40 bg-amber-400/10 ring-1 ring-amber-400/30'
                                : isCurrentReading
                                ? 'border-primary bg-primary/5 shadow-[0_0_10px_rgba(var(--primary),0.1)]'
                                : 'border-border/20 bg-background/50'
                            }`}>
                              <div className="flex items-center gap-2">
                                {isRead
                                  ? <CheckCircle className="h-4 w-4 text-primary" />
                                  : isToday
                                  ? <Clock className="h-4 w-4 text-amber-400" />
                                  : <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                                }
                                <div className="flex flex-col">
                                  <span className={
                                    isRead ? 'text-muted-foreground line-through' :
                                    isToday ? 'text-amber-400 font-black' :
                                    isCurrentReading ? 'text-primary font-black' :
                                    'text-foreground font-bold'
                                  }>
                                    Dia {r.day} {isToday && "— HOJE"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{dateStr}</span>
                                </div>
                              </div>
                              <span className={isRead ? 'text-muted-foreground' : isToday ? 'text-amber-400 font-bold' : isCurrentReading ? 'text-primary font-bold' : 'font-medium'}>{r.reference}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDeleteUserPlan(confirmDeleteId)}
        title="Remover seu progresso?"
        description="Seus dados de leitura para este plano serão perdidos permanentemente."
      />

      <ConfirmModal
        isOpen={!!confirmTemplateId}
        onOpenChange={(open) => !open && setConfirmTemplateId(null)}
        onConfirm={() => confirmTemplateId && handleDeleteTemplate(confirmTemplateId)}
        title="Excluir Plano do Sistema?"
        description="Esta ação removerá o plano para TODOS os usuários e não pode ser desfeita."
      />
    </div>
  );
}
