"use client"

import {
  ChevronsUpDown,
  Settings,
  Shield,
  LogOut,
  User,
  Sparkles
} from "lucide-react"
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function NavUser() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Verificar se o usuário é administrador
  const isAdmin = session?.user?.email?.endsWith('@magictraining.run') || 
                session?.user?.email === 'admin@example.com'
  
  // Se o usuário não estiver autenticado, exibir botão de login
  if (status !== 'authenticated' || !session) {
    return (
      <div className="px-3 py-4 mt-2">
        <Button 
          variant="outline"
          className="w-full justify-between text-sm h-10 rounded-lg border-dashed border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-primary"
          onClick={() => router.push('/auth/signin')}
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Entrar</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </div>
    )
  }

  // Obter iniciais para o avatar fallback
  const getInitials = () => {
    if (!session.user?.name) return '?'
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="px-3 py-4 mt-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-auto justify-between py-2 px-3 rounded-lg border-border/40 bg-muted/10 hover:bg-muted/30 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage 
                src={session.user?.image || ""} 
                alt={session.user?.name || "User"} 
                className="object-cover rounded-lg"
              />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span className="truncate font-semibold text-foreground">{session.user?.name}</span>
              <span className="truncate text-xs text-muted-foreground">{session.user?.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 p-3 text-left text-sm">
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarImage 
                  src={session.user?.image || ""} 
                  alt={session.user?.name || "User"} 
                  className="object-cover rounded-lg"
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">{session.user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{session.user?.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Painel Admin</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/admin/perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/configuracoes" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            {/* Se a aplicação tiver recurso premium */}
            <DropdownMenuItem asChild>
              <Link href="/apoiar" className="cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Upgrade Premium</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="cursor-pointer text-red-500 dark:text-red-400 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair da conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}