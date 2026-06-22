import { getStudies, getStudyFilterOptions } from "@/app/actions/studies";
import { getBooks } from "@/app/actions/books";
import { getFichamentos } from "@/app/actions/fichamentos";
import { StudyDialog } from "@/components/studies/StudyDialog";
import { StudyTable } from "@/components/studies/StudyTable";
import { StudyFilters } from "@/components/studies/StudyFilters";
import { StudyMetrics } from "@/components/studies/StudyMetrics";
import { BookList } from "@/components/studies/BookList";
import { FichamentoTab } from "@/components/studies/fichamento/FichamentoTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, BookMarked } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function StudiesPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string; course?: string; subject?: string; topic?: string }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "createdAt";
    const order = (params.order as "asc" | "desc") || "desc";

    const course = params.course;
    const subject = params.subject;
    const topic = params.topic;

    const [studiesResult, optionsResult, booksResult] = await Promise.all([
        getStudies(sort, order, { course, subject, topic }),
        getStudyFilterOptions(),
        getBooks(),
    ]);

    // Isolated so a failure here never breaks the rest of the page
    const fichamentosResult = await getFichamentos().catch(() => ({ success: false, data: [] }));

    const studies = studiesResult.data || [];
    const filterOptions = optionsResult.data || { courses: [], subjects: [], topics: [] };
    const books = booksResult.success ? booksResult.data || [] : [];
    const fichamentos = (fichamentosResult as any).success ? (fichamentosResult as any).data || [] : [];

    // Prepare book list for fichamento linking (id, title, author)
    const bookOptions = books.map((b: any) => ({ id: b.id, title: b.title, author: b.author }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Estudos</h2>
                    <p className="text-muted-foreground">
                        Registro de aprendizado e gestão de conhecimento.
                    </p>
                </div>
                <StudyDialog />
            </div>

            <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[560px] bg-background/50 border border-border/10 p-1 h-11 rounded-xl backdrop-blur-md">
                    <TabsTrigger value="notes" className="gap-2 font-bold text-xs uppercase data-[state=active]:bg-primary">
                        <FileText className="h-4 w-4" /> Resumos
                    </TabsTrigger>
                    <TabsTrigger value="books" className="gap-2 font-bold text-xs uppercase data-[state=active]:bg-primary">
                        <BookOpen className="h-4 w-4" /> Leituras
                    </TabsTrigger>
                    <TabsTrigger value="fichamentos" className="gap-2 font-bold text-xs uppercase data-[state=active]:bg-primary">
                        <BookMarked className="h-4 w-4" /> Fichamentos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="space-y-6 mt-6 outline-none">
                    <StudyMetrics studies={studies} />
                    <StudyFilters
                        courses={filterOptions.courses}
                        subjects={filterOptions.subjects}
                        topics={filterOptions.topics}
                    />
                    <StudyTable studies={studies} />
                </TabsContent>

                <TabsContent value="books" className="space-y-6 mt-6 outline-none">
                    <BookList initialBooks={books as any} />
                </TabsContent>

                <TabsContent value="fichamentos" className="space-y-6 mt-6 outline-none">
                    <FichamentoTab
                        initialFichamentos={fichamentos as any}
                        books={bookOptions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

