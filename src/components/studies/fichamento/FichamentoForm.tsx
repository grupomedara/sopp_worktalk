"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FichamentoType, FichamentoSourceType } from "./fichamento-utils";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createFichamento, updateFichamento } from "@/app/actions/fichamentos";
import { useState, useEffect, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  FICHAMENTO_TYPE_LABELS,
  FICHAMENTO_SOURCE_LABELS,
  FICHAMENTO_SOURCE_ICONS,
  isPrintSource,
  isMediaSource,
} from "./fichamento-utils";

const schema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  type: z.enum(["CITACAO", "RESUMO", "BIBLIOGRAFICO", "TEMATICO", "COMENTARIO"] as const),
  sourceType: z.enum(["LIVRO", "ARTIGO", "VIDEO", "PODCAST", "CURSO_ONLINE", "SITE", "OUTRO"] as const),
  // Reference fields
  authorLastName: z.string().optional(),
  authorFirstName: z.string().optional(),
  sourceTitle: z.string().optional(),
  year: z.string().optional(),
  url: z.string().optional(),
  // Print fields
  edition: z.string().optional(),
  city: z.string().optional(),
  publisher: z.string().optional(),
  pages: z.string().optional(),
  // Media fields
  platform: z.string().optional(),
  duration: z.string().optional(),
  accessDate: z.string().optional(),
  // Content
  keywords: z.string().optional(),
  mainContent: z.string().optional(),
  personalNote: z.string().optional(),
  bookId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FichamentoFormProps {
  initialData?: any;
  books?: { id: string; title: string; author: string }[];
  onSuccess?: () => void;
}

export function FichamentoForm({ initialData, books = [], onSuccess }: FichamentoFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(initialData),
  });

  const watchedValues = form.watch();
  const sourceType = form.watch("sourceType");

  const handleAutoSave = useCallback(async (data: FormValues) => {
    if (!initialData) return;
    try {
      await updateFichamento(initialData.id, preparePayload(data));
    } catch (e) {
      console.error("AutoSave Error:", e);
    }
  }, [initialData]);

  const { isSaving } = useAutoSave({
    value: watchedValues,
    saveFn: handleAutoSave,
    enabled: !!initialData,
    isValid: form.formState.isValid,
  });

  useEffect(() => {
    form.reset(buildDefaults(initialData));
  }, [initialData, form]);

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const payload = preparePayload(data);
      const result = initialData
        ? await updateFichamento(initialData.id, payload)
        : await createFichamento(payload as any);

      if (result.success) {
        toast.success(initialData ? "Fichamento atualizado!" : "Fichamento criado!");
        if (!initialData) form.reset(buildDefaults(undefined));
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar fichamento.");
      }
    } catch {
      toast.error("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const isPrint = isPrintSource(sourceType as FichamentoSourceType);
  const isMedia = isMediaSource(sourceType as FichamentoSourceType);
  const isSite = sourceType === "SITE";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Título do Fichamento</FormLabel>
            <FormControl><Input placeholder="Ex: Revisão sobre Inteligência Artificial" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Type + SourceType */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Fichamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(FICHAMENTO_TYPE_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="sourceType" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Fonte</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(FICHAMENTO_SOURCE_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {FICHAMENTO_SOURCE_ICONS[v as FichamentoSourceType]} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Reference section divider */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1">
            Referência Bibliográfica
          </p>

          {/* Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="authorLastName" render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome {isPrint ? "(ABNT)" : "/ Canal / Instrutor"}</FormLabel>
                <FormControl><Input placeholder="SOBRENOME" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="authorFirstName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Nome" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Source title */}
          <FormField control={form.control} name="sourceTitle" render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isPrint ? "Título da Obra" : isMedia ? "Título do Vídeo / Episódio / Curso" : "Título / Nome do Site"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={isPrint ? "Título em itálico (ABNT)" : "Nome do conteúdo"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Print fields */}
          {isPrint && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="edition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Edição</FormLabel>
                  <FormControl><Input placeholder="Ex: 3ª" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl><Input type="number" placeholder="2024" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="publisher" render={({ field }) => (
                <FormItem>
                  <FormLabel>Editora</FormLabel>
                  <FormControl><Input placeholder="Atlas" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="pages" render={({ field }) => (
                <FormItem>
                  <FormLabel>Páginas</FormLabel>
                  <FormControl><Input placeholder="p. 45-67" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>DOI / URL</FormLabel>
                  <FormControl><Input placeholder="https://doi.org/..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {/* Media fields */}
          {isMedia && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma</FormLabel>
                  <FormControl><Input placeholder="YouTube, Spotify, Udemy..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl><Input type="number" placeholder="2024" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração</FormLabel>
                  <FormControl><Input placeholder="1h 20min" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {/* Site fields */}
          {isSite && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="accessDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Acesso</FormLabel>
                  <FormControl><Input placeholder="07 abr. 2026" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {/* Outro: just URL */}
          {sourceType === "OUTRO" && (
            <FormField control={form.control} name="url" render={({ field }) => (
              <FormItem>
                <FormLabel>URL / Referência Manual</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        {/* Keyword tags */}
        <FormField control={form.control} name="keywords" render={({ field }) => (
          <FormItem>
            <FormLabel>Palavras-chave <span className="text-muted-foreground text-[10px]">(separe por vírgula)</span></FormLabel>
            <FormControl><Input placeholder="IA, aprendizado, epistemologia" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Book link */}
        {books.length > 0 && (
          <FormField control={form.control} name="bookId" render={({ field }) => (
            <FormItem>
              <FormLabel>Vincular a Livro <span className="text-muted-foreground text-[10px]">(opcional)</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecionar leitura..." /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.title} — {b.author}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* Content section */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-1">
            Conteúdo
          </p>

          <FormField control={form.control} name="mainContent" render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo Principal <span className="text-muted-foreground text-[10px]">(citações, resumo, análise)</span></FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Cole citações, resuma com suas palavras, faça análise temática..."
                  className="min-h-[140px] resize-y"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="personalNote" render={({ field }) => (
            <FormItem>
              <FormLabel>💡 Análise / Reflexão Pessoal</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Suas impressões, críticas, conexões com outros conteúdos..."
                  className="min-h-[100px] resize-y"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading || isSaving}>
            {loading || isSaving ? "Salvando..." : initialData ? "Atualizar Fichamento" : "Criar Fichamento"}
          </Button>
          {isSaving && (
            <p className="text-[10px] text-primary text-center animate-pulse font-medium tracking-widest uppercase">
              Alterações salvas automaticamente
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}

function buildDefaults(initialData: any): FormValues {
  return {
    title: initialData?.title || "",
    type: initialData?.type || "RESUMO",
    sourceType: initialData?.sourceType || "LIVRO",
    authorLastName: initialData?.authorLastName || "",
    authorFirstName: initialData?.authorFirstName || "",
    sourceTitle: initialData?.sourceTitle || "",
    year: initialData?.year ? String(initialData.year) : "",
    url: initialData?.url || "",
    edition: initialData?.edition || "",
    city: initialData?.city || "",
    publisher: initialData?.publisher || "",
    pages: initialData?.pages || "",
    platform: initialData?.platform || "",
    duration: initialData?.duration || "",
    accessDate: initialData?.accessDate || "",
    keywords: initialData?.keywords || "",
    mainContent: initialData?.mainContent || "",
    personalNote: initialData?.personalNote || "",
    bookId: initialData?.bookId || "",
  };
}

function preparePayload(data: FormValues) {
  return {
    ...data,
    year: data.year && data.year.trim() !== "" ? parseInt(data.year, 10) : null,
    bookId: data.bookId && data.bookId !== "none" ? data.bookId : null,
  };
}
