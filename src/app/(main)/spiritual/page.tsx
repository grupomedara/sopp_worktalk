import { getPrayers, getReadingPlans, getUserPlans } from "@/app/actions/spiritual";
import { fetchBibleText } from "@/lib/bible-api";
import { VerseCard } from "@/components/spiritual/VerseCard";
import { PrayerList } from "@/components/spiritual/PrayerList";
import { BiblePlanList } from "@/components/spiritual/BiblePlanList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BookOpen, Scroll } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SpiritualPage() {
  const [prayersRes, plansRes, userPlansRes, verseRes] = await Promise.all([
    getPrayers(),
    getReadingPlans(),
    getUserPlans(),
    fetchBibleText("João 3:16"), // Default Verse of the Day
  ]);

  const prayers = prayersRes.success ? prayersRes.data || [] : [];
  const plans = plansRes.success ? plansRes.data || [] : [];
  const userPlans = userPlansRes.success ? userPlansRes.data || [] : [];
  const verse = verseRes || { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...", translation_name: "Almeida" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          Espiritual<span className="text-primary">.</span>
        </h1>
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
          Alimente sua fé, organize seus clamores e medite na Palavra.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <VerseCard 
          reference={verse.reference} 
          text={verse.text} 
          translation_name={verse.translation_name} 
        />

        <Tabs defaultValue="prayers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background/50 backdrop-blur-md border border-border/20 p-1 h-11 rounded-xl">
            <TabsTrigger value="prayers" className="gap-2 font-bold text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-foreground">
              <Heart className="h-4 w-4" /> Orações
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2 font-bold text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-foreground">
              <BookOpen className="h-4 w-4" /> Planos de Leitura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prayers" className="mt-4 outline-none">
            <PrayerList initialPrayers={prayers as any} />
          </TabsContent>

          <TabsContent value="plans" className="mt-4 outline-none">
            <BiblePlanList allPlans={plans as any} userPlans={userPlans as any} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
