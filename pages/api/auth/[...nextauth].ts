// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { compare } from 'bcrypt';
import clientPromise from '@/lib/mongodb';

// Define extended types for NextAuth
import { Session, User } from 'next-auth';

// Extended types to avoid using 'any'
interface ExtendedUser extends User {
  role?: string;
}

interface ExtendedSession extends Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    id?: string;
  };
}

// Função para verificar se o usuário é administrador
const isAdminEmail = (email: string): boolean => {
  return email.endsWith('@magictraining.run') || email === 'admin@example.com';
};

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // Permite apenas emails específicos no login com Google
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: isAdminEmail(profile.email) ? 'admin' : 'user',
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const client = await clientPromise;
        const db = client.db('magic-training');
        const user = await db.collection('users').findOne({ email: credentials.email });
        
        if (!user) {
          throw new Error('Email ou senha incorretos');
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error('Email ou senha incorretos');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: isAdminEmail(user.email) ? 'admin' : 'user',
        };
      }
    })
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Inicialização inicial ao fazer login
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.role = isAdminEmail(extendedUser.email as string) ? 'admin' : 'user';
        token.name = extendedUser.name;
        token.email = extendedUser.email;
        token.id = extendedUser.id;
        token.picture = extendedUser.image;
      }
      
      // Este callback é chamado sempre que um token JWT é criado ou atualizado
      if (trigger === "update" && session) {
        const extendedSession = session as ExtendedSession;
        // Atualize os campos necessários do token
        if (extendedSession.user?.name) token.name = extendedSession.user.name;
        if (extendedSession.user?.email) token.email = extendedSession.user.email;
        if (extendedSession.user?.image) token.picture = extendedSession.user.image;
        if (extendedSession.user?.role) token.role = extendedSession.user.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Transferir as reivindicações do token para a sessão
      const extendedSession = session as ExtendedSession;
      if (extendedSession.user) {
        extendedSession.user.role = token.role as string;
        extendedSession.user.name = token.name as string; 
        extendedSession.user.email = token.email as string;
        extendedSession.user.image = token.picture as string;
        extendedSession.user.id = token.id as string;
      }
      return extendedSession;
    },
  },
};

export default NextAuth(authOptions);