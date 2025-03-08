import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { compare } from 'bcrypt';
import clientPromise from '@/lib/mongodb';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      stravaAccessToken?: string | null;
      stravaRefreshToken?: string | null;
      stravaTokenExpires?: number | null;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    stravaAccessToken?: string | null;
    stravaRefreshToken?: string | null; 
    stravaTokenExpires?: number | null;
  }
}

// Função para verificar se o usuário é administrador
const isAdminEmail = (email: string): boolean => {
  return email.endsWith('@magictraining.run');
};

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          scope: 'openid profile email'
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Define role baseado apenas no email
          role: isAdminEmail(profile.email) ? 'admin' : 'user'
        };
      }
    }),
    {
      id: 'strava',
      name: 'Strava',
      type: 'oauth',
      authorization: {
        url: 'https://www.strava.com/oauth/authorize',
        params: {
          scope: 'read,activity:read_all',
          response_type: 'code'
        }
      },
      token: 'https://www.strava.com/oauth/token',
      userinfo: 'https://www.strava.com/api/v3/athlete',
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: `${profile.firstname} ${profile.lastname}`,
          email: profile.email,
          image: profile.profile
        };
      }
    },
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
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Users: 'users',
      Accounts: 'accounts',
      Sessions: 'sessions',
      VerificationTokens: 'verification_tokens'
    }
  }),
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
    async signIn({ account, profile }) {
      // Quando for login do Google, remove qualquer restrição de domínio
      if (account?.provider === 'google') {
        // Log para rastreamento
        console.log('Google Sign In Attempt:', {
          email: profile?.email,
          name: profile?.name
        });

        // Remove validações de domínio
        // Apenas verifica se tem email
        return !!profile?.email;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Adiciona informações do usuário ao token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // Define role baseado apenas no email, permitindo qualquer domínio
        token.role = isAdminEmail(user.email as string) ? 'admin' : 'user';
      }
      
      // Adiciona tokens do Strava quando disponíveis
      if (account?.provider === 'strava') {
        token.stravaAccessToken = account.access_token;
        token.stravaRefreshToken = account.refresh_token;
        token.stravaTokenExpires = account.expires_at;
      }

      return token;
    },

    async session({ session, token }) {
      // Transfere informações do token para a sessão
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.role = token.role as string;
        
        // Adiciona tokens do Strava à sessão
        session.user.stravaAccessToken = token.stravaAccessToken as string;
        session.user.stravaRefreshToken = token.stravaRefreshToken as string;
        session.user.stravaTokenExpires = token.stravaTokenExpires as number;
      }

      return session;
    }
  },
};

export default NextAuth(authOptions);