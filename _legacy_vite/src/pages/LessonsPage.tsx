import { useState } from 'react';
import { Plus, GraduationCap, ChevronRight, Users, BookOpen, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockLessons } from '@/data/mockData';
import { Lesson } from '@/types';

export default function LessonsPage() {
  const [lessons] = useState<Lesson[]>(mockLessons);

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Aulas & Mentorias"
        description="Registre aulas e mentorias ministradas"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-context-work-bg p-2.5">
                  <GraduationCap className="h-5 w-5 text-context-work" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Aulas</p>
                  <p className="text-2xl font-bold">{lessons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-context-family-bg p-2.5">
                  <Users className="h-5 w-5 text-context-family" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes/Turmas</p>
                  <p className="text-2xl font-bold">
                    {new Set(lessons.map(l => l.clienteOuTurma)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons List */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Histórico de Aulas</h2>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
            {lessons.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma aula registrada</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar primeira aula
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface LessonCardProps {
  lesson: Lesson;
}

function LessonCard({ lesson }: LessonCardProps) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-sidebar-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{lesson.clienteOuTurma}</span>
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-sidebar-primary transition-colors">
              {lesson.tema}
            </h3>
            {lesson.objetivo && (
              <p className="text-sm text-muted-foreground mt-1">
                Objetivo: {lesson.objetivo}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-sidebar-primary transition-colors" />
        </div>

        {lesson.conteudoAplicado && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{lesson.conteudoAplicado}</span>
          </div>
        )}

        {lesson.followUp && (
          <div className="mt-3 p-3 rounded-md bg-context-work-bg/50 text-sm">
            <div className="flex items-center gap-2 text-context-work-foreground font-medium mb-1">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Follow-up</span>
            </div>
            <p className="text-muted-foreground">{lesson.followUp}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          {format(lesson.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}
