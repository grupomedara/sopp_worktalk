import { useState } from 'react';
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockFinances, mockPeople, mockProjects } from '@/data/mockData';
import { Finance, FinanceCategory } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const categoryLabels: Record<FinanceCategory, string> = {
  PESSOAL: 'Pessoal',
  EMPRESA: 'Empresa',
  FILHO: 'Filho(a)',
};

const categoryColors: Record<FinanceCategory, string> = {
  PESSOAL: 'bg-context-personal-bg text-context-personal-foreground',
  EMPRESA: 'bg-context-work-bg text-context-work-foreground',
  FILHO: 'bg-context-family-bg text-context-family-foreground',
};

export default function FinancesPage() {
  const [finances] = useState<Finance[]>(mockFinances);

  const pendingFinances = finances.filter(f => f.status === 'PENDENTE');
  const paidFinances = finances.filter(f => f.status === 'CONCLUIDO');

  const totalPending = pendingFinances.reduce((acc, f) => acc + f.valor, 0);
  const overdueCount = pendingFinances.filter(f => f.vencimento && f.vencimento < new Date()).length;

  const getPersonName = (personId?: string) => {
    if (!personId) return null;
    return mockPeople.find(p => p.id === personId)?.nome;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Finanças"
        description="Acompanhe compromissos financeiros"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-status-pending/10 p-2.5">
                  <Wallet className="h-5 w-5 text-status-pending" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-priority-high/10 p-2.5">
                  <AlertCircle className="h-5 w-5 text-priority-high" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-status-done/10 p-2.5">
                  <ArrowDownCircle className="h-5 w-5 text-status-done" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagos este mês</p>
                  <p className="text-2xl font-bold">{paidFinances.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingFinances.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Pagos ({paidFinances.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {pendingFinances.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Nenhum pagamento pendente</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingFinances.map((finance) => (
                      <FinanceRow 
                        key={finance.id} 
                        finance={finance}
                        personName={getPersonName(finance.pessoaId)}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {paidFinances.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Nenhum pagamento realizado</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {paidFinances.map((finance) => (
                      <FinanceRow 
                        key={finance.id} 
                        finance={finance}
                        personName={getPersonName(finance.pessoaId)}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface FinanceRowProps {
  finance: Finance;
  personName?: string | null;
  formatCurrency: (value: number) => string;
}

function FinanceRow({ finance, personName, formatCurrency }: FinanceRowProps) {
  const isOverdue = finance.vencimento && finance.vencimento < new Date() && finance.status === 'PENDENTE';

  return (
    <div className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
      <div 
        className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          finance.tipo === 'FIXO' ? 'bg-muted' : 'bg-status-pending/10'
        )}
      >
        {finance.tipo === 'FIXO' ? (
          <ArrowUpCircle className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ArrowDownCircle className="h-5 w-5 text-status-pending" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium">{finance.descricao}</p>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', categoryColors[finance.categoria])}>
            {categoryLabels[finance.categoria]}
          </span>
          {personName && <span>• {personName}</span>}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {finance.vencimento && (
          <div className={cn(
            'flex items-center gap-1 text-sm',
            isOverdue ? 'text-priority-high' : 'text-muted-foreground'
          )}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(finance.vencimento, "d MMM", { locale: ptBR })}</span>
          </div>
        )}
        <span className="font-semibold text-foreground min-w-[100px] text-right">
          {formatCurrency(finance.valor)}
        </span>
        <StatusBadge status={finance.status} />
      </div>
    </div>
  );
}
