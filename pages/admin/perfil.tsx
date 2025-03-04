// pages/admin/perfil.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useSession, getSession, signOut } from 'next-auth/react';
import { toast } from "sonner";
import { Layout } from '@/components/layout';
import { HeroLayout } from '@/components/default/HeroLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Info, Camera, KeyRound, Loader2 } from 'lucide-react';
import { Session } from 'next-auth';

// Verificação de autenticação no servidor e obtenção dos dados mais recentes
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/perfil',
        permanent: false,
      },
    };
  }

  return {
    props: { 
      sessionData: session 
    },
  };
};

interface UserProfileProps {
  sessionData: Session;
}

const UserProfile: React.FC<UserProfileProps> = ({ sessionData }) => {
  // Utilizaremos apenas status da useSession, mas obteremos dados da prop sessionData
  const { status } = useSession();

  // Estados para gerenciamento do perfil
  const [name, setName] = useState(sessionData?.user?.name || '');
  const [email] = useState(sessionData?.user?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar carregamento da sessão
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handlers para atualização de perfil
  const handleProfileUpdate = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Nome inválido", {
        description: "O nome deve ter pelo menos 2 caracteres"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar perfil');
      }

      toast.success("Perfil atualizado com sucesso", {
        description: "Suas informações foram atualizadas",
      });

      // Solução: Regenerar a sessão completamente
      setIsEditingProfile(false);
      
      // Recarregar a página para obter os dados atualizados
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil", {
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o perfil',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para mudança de senha
  const handlePasswordChange = async () => {
    // Validações
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }

      // Limpar campos e fechar diálogo
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      
      // Exibir mensagem de sucesso com Sonner
      toast.success("Senha alterada com sucesso", {
        description: "Por favor, faça login novamente com sua nova senha",
        duration: 5000,
      });
      
      // Fazer logout e redirecionar para o login após um breve intervalo
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/signin' });
      }, 3000);
      
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error("Erro ao alterar senha", {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Perfil do Usuário - Magic Training</title>
        <meta name="description" content="Gerencie suas informações de perfil" />
      </Head>

      <HeroLayout
        title="Perfil do Usuário"
        description="Gerencie suas informações pessoais e de acesso"
        info={
          <Card className="bg-primary/5 border-primary/20">
            <CardContent>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary/90">
                  Aqui você pode atualizar seus dados pessoais e configurações de conta.
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className="mx-auto space-y-6">
          {/* Cartão de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Visualize e atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar e Upload */}
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={sessionData?.user?.image || '/placeholder-avatar.png'} 
                      alt={`Foto de perfil de ${sessionData?.user?.name}`} 
                    />
                    <AvatarFallback>
                      {sessionData?.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Atualizar Foto de Perfil</DialogTitle>
                        <DialogDescription>
                          Faça upload de uma nova imagem de perfil
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input type="file" accept="image/*" />
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancelar</Button>
                        <Button>Enviar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Informações Pessoais */}
                <div className="flex-1 w-full">
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Nome</Label>
                        <Input 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          value={email} 
                          disabled 
                          className="cursor-not-allowed opacity-50" 
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setName(sessionData?.user?.name || '');
                            setIsEditingProfile(false);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleProfileUpdate}
                          disabled={isLoading}
                        >
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-semibold">{sessionData?.user?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{sessionData?.user?.email}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingProfile(true)}
                      >
                        Editar Perfil
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cartão de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie suas configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mudança de Senha */}
              <Dialog 
                open={isChangingPassword} 
                onOpenChange={setIsChangingPassword}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <KeyRound className="w-4 h-4" />
                    Alterar Senha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                      Preencha os campos abaixo para alterar sua senha
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Senha Atual</Label>
                      <Input 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                      />
                    </div>
                    <div>
                      <Label>Nova Senha</Label>
                      <Input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite sua nova senha"
                      />
                    </div>
                    <div>
                      <Label>Confirmar Nova Senha</Label>
                      <Input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme sua nova senha"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsChangingPassword(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Alterar Senha
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </HeroLayout>
    </Layout>
  );
};

export default UserProfile;