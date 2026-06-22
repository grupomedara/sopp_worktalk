import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Configurações"
        description="Personalize sua experiência"
      />
      
      <div className="p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Configure como deseja receber alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tarefas vencidas</Label>
                <p className="text-sm text-muted-foreground">
                  Receba lembretes sobre tarefas atrasadas
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compromissos do dia</Label>
                <p className="text-sm text-muted-foreground">
                  Resumo diário de eventos e tarefas
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pagamentos próximos</Label>
                <p className="text-sm text-muted-foreground">
                  Alertas sobre vencimentos financeiros
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>Ajuste o comportamento do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gerar tarefas de estudo</Label>
                <p className="text-sm text-muted-foreground">
                  Criar automaticamente tarefas após registrar estudos
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mostrar tarefas concluídas</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir tarefas finalizadas nas listas
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados</CardTitle>
            <CardDescription>Gerenciamento de informações</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta versão utiliza dados locais. Em breve: sincronização com banco de dados PostgreSQL via Prisma.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
