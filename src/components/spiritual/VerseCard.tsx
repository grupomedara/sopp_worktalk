import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export interface VerseCardProps {
  reference: string;
  text: string;
  translation_name: string;
}

export function VerseCard({ reference, text, translation_name }: VerseCardProps) {
  return (
    <Card className="border border-border/40 bg-background/50 backdrop-blur-xl hover:bg-background/60 transition-all duration-300 shadow-xl group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Versículo do Dia
        </CardTitle>
        <div className="text-[10px] text-muted-foreground uppercase font-black">
          {translation_name}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 relative z-10">
        <blockquote className="text-lg font-medium leading-relaxed tracking-tight text-foreground italic">
          "{text.trim()}"
        </blockquote>
        <p className="text-right font-black text-sm uppercase tracking-wider text-primary/80">
          — {reference}
        </p>
      </CardContent>
    </Card>
  );
}
