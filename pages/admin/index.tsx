// pages/admin/index.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Eye, AlertCircle, Search, Loader, Loader2 } from 'lucide-react';
import { PlanModel } from '@/models';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Info } from 'lucide-react';

// Verificação de autenticação e autorização no servidor
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin',
        permanent: false,
      },
    };
  }

  // Verificar se é administrador
  const isAdmin = session.user?.email?.endsWith('@magictraining.run') ||
    session.user?.email === 'admin@example.com';

  if (!isAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

// Funções auxiliares para filtros
const filterPlansByNivel = (plans: PlanModel[], nivel: string) => {
  if (nivel === 'todos') return plans;
  return plans.filter(plan => plan.nivel === nivel);
};

const filterPlansBySearch = (plans: PlanModel[], searchTerm: string) => {
  if (!searchTerm) return plans;
  const term = searchTerm.toLowerCase();
  return plans.filter(plan =>
    plan.name.toLowerCase().includes(term) ||
    plan.coach.toLowerCase().includes(term) ||
    plan.path.toLowerCase().includes(term) ||
    plan.info.toLowerCase().includes(term)
  );
};

const AdminDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados para gerenciamento de planos
  const [plans, setPlans] = useState<PlanModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanModel | null>(null);

  // Estado para formulário de plano
  const [formData, setFormData] = useState<Partial<PlanModel>>({
    name: '',
    nivel: 'iniciante',
    coach: '',
    info: '',
    path: '',
    duration: '',
    activities: [],
    distances: [],
    volume: '',
    dailyWorkouts: []
  });

  // Carregar planos ao iniciar
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }

    fetchPlans();
  }, [session, status, router]);

  // Buscar planos da API
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) {
        throw new Error('Erro ao buscar planos');
      }
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);

    } finally {
      setLoading(false);
    }
  };

  // Filtrar planos com base nos critérios atuais
  const filteredPlans = React.useMemo(() => {
    let filtered = [...plans];
    filtered = filterPlansByNivel(filtered, activeTab);
    filtered = filterPlansBySearch(filtered, searchTerm);
    return filtered;
  }, [plans, activeTab, searchTerm]);

  // Handlers para formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<PlanModel>) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: Partial<PlanModel>) => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (name: string, value: string) => {
    // Converter string separada por vírgulas em array
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData((prev: Partial<PlanModel>) => ({ ...prev, [name]: arrayValue }));
  };

  // CRUD operations
  const handleAddPlan = async () => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar plano');
      }



      setIsAddDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Erro ao adicionar plano:', error);

    }
  };

  const handleEditPlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/plans/${selectedPlan.path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar plano');
      }



      setIsEditDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);

    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/plans/${selectedPlan.path}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir plano');
      }



      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);

    }
  };

  // Funções de utilidade
  const resetForm = () => {
    setFormData({
      name: '',
      nivel: 'iniciante',
      coach: '',
      info: '',
      path: '',
      duration: '',
      activities: [],
      distances: [],
      volume: '',
      dailyWorkouts: []
    });
  };

  const openEditDialog = (plan: PlanModel) => {
    setSelectedPlan(plan);
    setFormData({
      ...plan,
      activities: plan.activities || [],
      distances: plan.distances || []
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (plan: PlanModel) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  // Se ainda está carregando autenticação, mostrar indicador
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Painel Administrativo - Magic Training</title>
        <meta name="description" content="Painel administrativo para gerenciar planos de treinamento do Magic Training" />
      </Head>

      <HeroLayout
        title="Painel Administrativo"
        description="Gerencie os planos de treinamento do Magic Training"
        info={
          <Card className="bg-primary/5 border-primary/20 p-4">
            <CardContent>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary/90">
                  Gerencie os planos de treinamento do Magic Training. Adicione, edite ou exclua planos conforme necessário.
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Adicionar Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Plano</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo plano de treinamento.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Nome</label>
                          <Input
                            name="name"
                            placeholder="Nome do plano"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Path/URL</label>
                          <Input
                            name="path"
                            placeholder="caminho-url"
                            value={formData.path}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Nível</label>
                          <Select
                            value={formData.nivel}
                            onValueChange={(value) => handleSelectChange('nivel', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o nível" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="iniciante">Iniciante</SelectItem>
                              <SelectItem value="intermediário">Intermediário</SelectItem>
                              <SelectItem value="avançado">Avançado</SelectItem>
                              <SelectItem value="elite">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Treinador</label>
                          <Input
                            name="coach"
                            placeholder="Nome do treinador"
                            value={formData.coach}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Duração</label>
                          <Input
                            name="duration"
                            placeholder="ex: 16 semanas"
                            value={formData.duration}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Volume (km/semana)</label>
                          <Input
                            name="volume"
                            placeholder="ex: 50"
                            value={formData.volume}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Distâncias (separadas por vírgula)</label>
                        <Input
                          name="distances"
                          placeholder="ex: 5km,10km,21km"
                          value={formData.distances?.join(', ')}
                          onChange={(e) => handleArrayInputChange('distances', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Atividades (separadas por vírgula)</label>
                        <Input
                          name="activities"
                          placeholder="ex: corrida,força"
                          value={formData.activities?.join(', ')}
                          onChange={(e) => handleArrayInputChange('activities', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <textarea
                          name="info"
                          placeholder="Descrição do plano"
                          value={formData.info}
                          onChange={handleInputChange}
                          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleAddPlan}>Adicionar Plano</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar planos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto sm:w-72">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                      <TabsTrigger value="iniciante">Iniciante</TabsTrigger>
                      <TabsTrigger value="intermediário">Interm.</TabsTrigger>
                      <TabsTrigger value="avançado">Avançado</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                {/* Tabela de Planos */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Nível</TableHead>
                          <TableHead>Treinador</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Distâncias</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlans.length > 0 ? (
                          filteredPlans.map((plan) => (
                            <TableRow key={plan.path}>
                              <TableCell className="font-medium">{plan.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {plan.nivel}
                                </Badge>
                              </TableCell>
                              <TableCell>{plan.coach}</TableCell>
                              <TableCell>{plan.duration}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {plan.distances?.map((distance: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {distance}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.open(`/plano/${plan.path}`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(plan)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive/80"
                                    onClick={() => openDeleteDialog(plan)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              Nenhum plano encontrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </HeroLayout>

      {/* Modais adicionais */}
      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Edite os dados do plano de treinamento.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Mesmo formulário do modal de adicionar... */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  name="name"
                  placeholder="Nome do plano"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Path/URL</label>
                <Input
                  name="path"
                  placeholder="caminho-url"
                  value={formData.path}
                  onChange={handleInputChange}
                  disabled // Não permitir editar o path
                />
              </div>
            </div>

            {/* Outros campos... */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nível</label>
                <Select
                  value={formData.nivel}
                  onValueChange={(value) => handleSelectChange('nivel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediário">Intermediário</SelectItem>
                    <SelectItem value="avançado">Avançado</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Treinador</label>
                <Input
                  name="coach"
                  placeholder="Nome do treinador"
                  value={formData.coach}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Duração</label>
                <Input
                  name="duration"
                  placeholder="ex: 16 semanas"
                  value={formData.duration}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Volume (km/semana)</label>
                <Input
                  name="volume"
                  placeholder="ex: 50"
                  value={formData.volume}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Distâncias (separadas por vírgula)</label>
              <Input
                name="distances"
                placeholder="ex: 5km,10km,21km"
                value={formData.distances?.join(', ')}
                onChange={(e) => handleArrayInputChange('distances', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Atividades (separadas por vírgula)</label>
              <Input
                name="activities"
                placeholder="ex: corrida,força"
                value={formData.activities?.join(', ')}
                onChange={(e) => handleArrayInputChange('activities', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                name="info"
                placeholder="Descrição do plano"
                value={formData.info}
                onChange={handleInputChange}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditPlan}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedPlan?.name}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center my-4 p-4 bg-destructive/10 rounded-md border border-destructive/20">
            <AlertCircle className="h-6 w-6 text-destructive mr-2" />
            <p className="text-sm text-destructive">
              Todos os dados do plano serão excluídos permanentemente.
            </p>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard;