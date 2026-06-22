import { useState } from 'react';
import { Plus, User, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ContextBadge } from '@/components/ui/ContextBadge';
import { mockPeople } from '@/data/mockData';
import { Person, PersonType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const personTypeLabels: Record<PersonType, string> = {
  FILHO: 'Filho(a)',
  CLIENTE: 'Cliente',
  COLABORADOR: 'Colaborador',
  SOCIO: 'Sócio',
};

export default function PeoplePage() {
  const [people] = useState<Person[]>(mockPeople);

  const groupedByType = people.reduce((acc, person) => {
    if (!acc[person.tipo]) {
      acc[person.tipo] = [];
    }
    acc[person.tipo].push(person);
    return acc;
  }, {} as Record<PersonType, Person[]>);

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Pessoas"
        description="Gerencie contatos e relacionamentos"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Pessoa
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({people.length})
            </TabsTrigger>
            {Object.entries(groupedByType).map(([type, persons]) => (
              <TabsTrigger key={type} value={type}>
                {personTypeLabels[type as PersonType]} ({persons.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </TabsContent>

          {Object.entries(groupedByType).map(([type, persons]) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {persons.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

interface PersonCardProps {
  person: Person;
}

function PersonCard({ person }: PersonCardProps) {
  const initials = person.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {person.nome}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {personTypeLabels[person.tipo]}
              </span>
              <ContextBadge context={person.contexto} />
            </div>

            {person.observacoes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {person.observacoes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
