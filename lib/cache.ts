// lib/cache.ts

// Interface para o cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache global
const cache: {
  [key: string]: CacheItem<any>;
} = {};

// Tempo de expiração padrão: 24 horas em milissegundos
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

/**
 * Obtém um item do cache
 * @param key Chave do cache
 * @returns O item do cache ou null se não existir ou estiver expirado
 */
export function getCachedItem<T>(key: string): T | null {
  const item = cache[key];
  
  // Se o item não existe no cache ou está expirado
  if (!item || Date.now() > item.expiresAt) {
    return null;
  }
  
  return item.data;
}

/**
 * Armazena um item no cache
 * @param key Chave do cache
 * @param data Dados a serem armazenados
 * @param ttl Tempo de vida do cache em milissegundos
 */
export function setCachedItem<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const now = Date.now();
  
  cache[key] = {
    data,
    timestamp: now,
    expiresAt: now + ttl
  };
}

/**
 * Remove um item específico do cache
 * @param key Chave do cache a ser removida
 */
export function invalidateCacheItem(key: string): void {
  delete cache[key];
}

/**
 * Invalida todos os itens do cache que correspondem a um prefixo
 * @param prefix Prefixo das chaves a serem invalidadas
 */
export function invalidateCacheByPrefix(prefix: string): void {
  Object.keys(cache).forEach(key => {
    if (key.startsWith(prefix)) {
      delete cache[key];
    }
  });
}

/**
 * Limpa todo o cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
}

// Função utilitária para logs de desenvolvimento
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: Object.keys(cache).length,
    keys: Object.keys(cache)
  };
}