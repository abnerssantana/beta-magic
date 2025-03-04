// lib/db-utils.ts
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';
import { PlanModel, TrainerModel } from '../models';
import { getCachedItem, setCachedItem, invalidateCacheItem, invalidateCacheByPrefix } from './cache';

// Definição da interface PlanQueryOptions
interface PlanQueryOptions {
  nivel?: string;
  coach?: string;
  distance?: string;
  search?: string;
  limit?: number;
  fields?: 'summary' | 'full'; // Novo campo para indicar projeção
  skip?: number;               // Para paginação
}

// Cache keys constants
const CACHE_KEYS = {
  ALL_PLANS: 'plans:all',
  PLAN_SUMMARIES: 'plans:summaries', // Novo cache key para sumários
  PLAN_BY_PATH: 'plan:',
  ALL_TRAINERS: 'trainers:all',
  TRAINER_SUMMARIES: 'trainers:summaries', // Novo cache key para sumários de treinadores
  TRAINER_BY_ID: 'trainer:',
  PLANS_BY_TRAINER: 'plans:trainer:',
  PLANS_BY_LEVEL: 'plans:level:',
  PLANS_BY_DISTANCE: 'plans:distance:'
};

// 7 dias (em milissegundos) para ttl do cache de planos
const PLANS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
// 1 dia para cache de sumários (dados leves e acessados com frequência)
const SUMMARIES_CACHE_TTL = 24 * 60 * 60 * 1000;

// Interface para MongoDB queries
interface MongoQuery {
  nivel?: 'iniciante' | 'intermediário' | 'avançado' | 'elite';
  coach?: string;
  distances?: string;
  $or?: Array<{[key: string]: {$regex: string, $options: string}}>;
}

// Campos para projeção de planos (sem dailyWorkouts)
const PLAN_SUMMARY_FIELDS = {
  _id: 1,
  name: 1,
  nivel: 1,
  coach: 1,
  info: 1,
  path: 1,
  duration: 1,
  activities: 1,
  img: 1,
  isNew: 1,
  distances: 1,
  volume: 1,
  trainingPeaksUrl: 1,
  videoUrl: 1,
  createdAt: 1,
  updatedAt: 1
  // Explicitamente excluindo dailyWorkouts
};

// Campos para projeção de treinadores (sem biography completa)
const TRAINER_SUMMARY_FIELDS = {
  _id: 1,
  id: 1,
  name: 1,
  fullName: 1,
  title: 1,
  profileImage: 1,
  "biography.0": 1, // Inclui apenas a primeira seção da biografia
  "socialMedia.website": 1, // Incluir apenas o website na visualização resumida
  createdAt: 1,
  updatedAt: 1
};

/**
 * NOVA FUNÇÃO: Obter apenas resumos dos planos (sem dailyWorkouts)
 * @param options Opções de filtro e paginação
 * @returns Promise com array de planos resumidos
 */
export async function getPlanSummaries(options: PlanQueryOptions = {}): Promise<Partial<PlanModel>[]> {
  const { limit = 0, skip = 0 } = options;
  
  // Gera um cache key que inclui os filtros
  const cacheKey = `${CACHE_KEYS.PLAN_SUMMARIES}:${JSON.stringify({...options, fields: undefined})}`; 
  
  // Tenta buscar do cache primeiro
  const cachedPlans = getCachedItem<Partial<PlanModel>[]>(cacheKey);
  if (cachedPlans) {
    return cachedPlans;
  }
  
  // Se não está no cache, busca do banco de dados
  const client = await clientPromise;
  const db = client.db('magic-training');
  
  const query: MongoQuery = {};
  
  // Apply filters only if they have valid values
  if (options.nivel && options.nivel !== 'todos') {
    if (['iniciante', 'intermediário', 'avançado', 'elite'].includes(options.nivel)) {
      query.nivel = options.nivel as 'iniciante' | 'intermediário' | 'avançado' | 'elite';
    }
  }
  
  if (options.coach && options.coach !== 'todos') {
    query.coach = options.coach;
  }
  
  if (options.distance && options.distance !== 'todas') {
    query.distances = options.distance;
  }
  
  // Search by text in multiple fields
  if (options.search && options.search.trim() !== '') {
    const searchRegex = options.search.trim();
    query.$or = [
      { name: { $regex: searchRegex, $options: 'i' } },
      { info: { $regex: searchRegex, $options: 'i' } },
      { coach: { $regex: searchRegex, $options: 'i' } }
    ];
  }
  
  try {
    // Use projection para limitar os campos retornados
    const plans = await db
      .collection<PlanModel>('plans')
      .find(query)
      .project(PLAN_SUMMARY_FIELDS)
      .skip(skip)
      .limit(limit || 0)
      .toArray();
    
    // Armazena no cache por menos tempo (dados de sumário mudam com frequência)
    setCachedItem(cacheKey, plans, SUMMARIES_CACHE_TTL);
    
    return plans;
  } catch (error) {
    console.error('Error fetching plan summaries:', error);
    return [];
  }
}

/**
 * Get all plans with optional filtering
 * ATUALIZADA: suporta campo 'fields' para controlar projeção
 * @param options Filter options for plans
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getAllPlans(options: PlanQueryOptions = {}): Promise<PlanModel[] | Partial<PlanModel>[]> {
  const { fields = 'full' } = options;
  
  // Se queremos apenas sumários, use a função dedicada
  if (fields === 'summary') {
    return getPlanSummaries(options);
  }
  
  // Gera um cache key que inclui os filtros
  const cacheKey = options && Object.keys(options).length > 0 
    ? `${CACHE_KEYS.ALL_PLANS}:${JSON.stringify(options)}`
    : CACHE_KEYS.ALL_PLANS;
  
  // Tenta buscar do cache primeiro
  const cachedPlans = getCachedItem<PlanModel[]>(cacheKey);
  if (cachedPlans) {
    return cachedPlans;
  }
  
  // Se não está no cache, busca do banco de dados
  const client = await clientPromise;
  const db = client.db('magic-training');
  
  const query: MongoQuery = {};
  
  // Apply filters only if they have valid values
  if (options.nivel && options.nivel !== 'todos') {
    if (['iniciante', 'intermediário', 'avançado', 'elite'].includes(options.nivel)) {
      query.nivel = options.nivel as 'iniciante' | 'intermediário' | 'avançado' | 'elite';
    }
  }
  
  if (options.coach && options.coach !== 'todos') {
    query.coach = options.coach;
  }
  
  if (options.distance && options.distance !== 'todas') {
    query.distances = options.distance;
  }
  
  // Search by text in multiple fields
  if (options.search && options.search.trim() !== '') {
    const searchRegex = options.search.trim();
    query.$or = [
      { name: { $regex: searchRegex, $options: 'i' } },
      { info: { $regex: searchRegex, $options: 'i' } },
      { coach: { $regex: searchRegex, $options: 'i' } }
    ];
  }
  
  try {
    // Use projection to limit fields if needed for performance
    const plans = await db
      .collection<PlanModel>('plans')
      .find(query)
      .limit(options.limit || 0)
      .toArray();
    
    // Armazena no cache
    setCachedItem(cacheKey, plans, PLANS_CACHE_TTL);
    
    return plans;
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
}

/**
 * NOVA FUNÇÃO: Obter apenas resumos dos treinadores
 * @returns Promise com array de treinadores resumidos
 */
export async function getTrainerSummaries(): Promise<Partial<TrainerModel>[]> {
  const cacheKey = CACHE_KEYS.TRAINER_SUMMARIES;
  
  // Tenta buscar do cache
  const cachedTrainers = getCachedItem<Partial<TrainerModel>[]>(cacheKey);
  if (cachedTrainers) {
    return cachedTrainers;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Use projeção para limitar os campos
    const trainers = await db
      .collection<TrainerModel>('trainers')
      .find({})
      .project(TRAINER_SUMMARY_FIELDS)
      .toArray();
    
    // Armazena no cache por menos tempo
    setCachedItem(cacheKey, trainers, SUMMARIES_CACHE_TTL);
    
    return trainers;
  } catch (error) {
    console.error('Error fetching trainer summaries:', error);
    return [];
  }
}

/**
 * Get a specific plan by its path
 * @param path The path/slug of the plan
 * @param options Opções adicionais como projeção
 * @returns Promise resolving to a PlanModel or null
 */
export async function getPlanByPath(
  path: string, 
  options: { fields?: 'summary' | 'full' } = {}
): Promise<PlanModel | Partial<PlanModel> | null> {
  if (!path) return null;
  
  const { fields = 'full' } = options;
  const cacheKey = `${CACHE_KEYS.PLAN_BY_PATH}${path}:${fields}`;
  
  // Tenta buscar do cache
  const cachedPlan = getCachedItem<PlanModel | Partial<PlanModel>>(cacheKey);
  if (cachedPlan) {
    return cachedPlan;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Seleciona os campos a serem retornados
    const projection = fields === 'summary' ? PLAN_SUMMARY_FIELDS : {};
    
    const plan = await db
      .collection<PlanModel>('plans')
      .findOne(
        { path },
        { projection }
      );
    
    if (plan) {
      // Define TTL baseado no tipo de dados
      const ttl = fields === 'summary' ? SUMMARIES_CACHE_TTL : PLANS_CACHE_TTL;
      setCachedItem(cacheKey, plan, ttl);
    }
    
    return plan;
  } catch (error) {
    console.error(`Error fetching plan with path ${path}:`, error);
    return null;
  }
}

/**
 * Get all trainers
 * @param options Opções adicionais (como fields)
 * @returns Promise resolving to an array of TrainerModel objects
 */
export async function getAllTrainers(
  options: { fields?: 'summary' | 'full' } = {}
): Promise<TrainerModel[] | Partial<TrainerModel>[]> {
  const { fields = 'full' } = options;
  
  // Se queremos apenas sumários, use a função dedicada
  if (fields === 'summary') {
    return getTrainerSummaries();
  }
  
  const cacheKey = CACHE_KEYS.ALL_TRAINERS;
  
  // Tenta buscar do cache
  const cachedTrainers = getCachedItem<TrainerModel[]>(cacheKey);
  if (cachedTrainers) {
    return cachedTrainers;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    const trainers = await db
      .collection<TrainerModel>('trainers')
      .find({})
      .toArray();
    
    // Armazena no cache (TTL mais longo para treinadores)
    setCachedItem(cacheKey, trainers, PLANS_CACHE_TTL);
    
    return trainers;
  } catch (error) {
    console.error('Error fetching trainers:', error);
    return [];
  }
}

/**
 * Get a specific trainer by ID
 * @param id The ID of the trainer
 * @returns Promise resolving to a TrainerModel or null
 */
export async function getTrainerById(id: string): Promise<TrainerModel | null> {
  if (!id) return null;
  
  const cacheKey = `${CACHE_KEYS.TRAINER_BY_ID}${id}`;
  
  // Tenta buscar do cache
  const cachedTrainer = getCachedItem<TrainerModel>(cacheKey);
  if (cachedTrainer) {
    return cachedTrainer;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    const trainer = await db
      .collection<TrainerModel>('trainers')
      .findOne({ id });
    
    if (trainer) {
      // Armazena no cache
      setCachedItem(cacheKey, trainer, PLANS_CACHE_TTL);
    }
    
    return trainer;
  } catch (error) {
    console.error(`Error fetching trainer with ID ${id}:`, error);
    return null;
  }
}

/**
 * Get plans by a specific trainer
 * @param coach The name of the trainer/coach
 * @param options Opções adicionais como projeção de campos
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getPlansByTrainer(
  coach: string,
  options: { fields?: 'summary' | 'full' } = {}
): Promise<PlanModel[] | Partial<PlanModel>[]> {
  if (!coach) return [];
  
  const { fields = 'full' } = options;
  const cacheKey = `${CACHE_KEYS.PLANS_BY_TRAINER}${coach}:${fields}`;
  
  // Tenta buscar do cache
  const cachedPlans = getCachedItem<PlanModel[] | Partial<PlanModel>[]>(cacheKey);
  if (cachedPlans) {
    return cachedPlans;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Seleciona a projeção adequada
    const projection = fields === 'summary' ? PLAN_SUMMARY_FIELDS : {};
    
    const plans = await db
      .collection<PlanModel>('plans')
      .find({ coach })
      .project(projection)
      .toArray();
    
    // Define TTL baseado no tipo de dados
    const ttl = fields === 'summary' ? SUMMARIES_CACHE_TTL : PLANS_CACHE_TTL;
    setCachedItem(cacheKey, plans, ttl);
    
    return plans;
  } catch (error) {
    console.error(`Error fetching plans for trainer ${coach}:`, error);
    return [];
  }
}

/**
 * Get plans by level
 * @param nivel The level of plans to fetch
 * @param options Opções adicionais como projeção
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getPlansByLevel(
  nivel: 'iniciante' | 'intermediário' | 'avançado' | 'elite',
  options: { fields?: 'summary' | 'full' } = {}
): Promise<PlanModel[] | Partial<PlanModel>[]> {
  const { fields = 'full' } = options;
  const cacheKey = `${CACHE_KEYS.PLANS_BY_LEVEL}${nivel}:${fields}`;
  
  // Tenta buscar do cache
  const cachedPlans = getCachedItem<PlanModel[] | Partial<PlanModel>[]>(cacheKey);
  if (cachedPlans) {
    return cachedPlans;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Seleciona a projeção adequada
    const projection = fields === 'summary' ? PLAN_SUMMARY_FIELDS : {};
    
    const plans = await db
      .collection<PlanModel>('plans')
      .find({ nivel })
      .project(projection)
      .toArray();
    
    // Define TTL baseado no tipo de dados
    const ttl = fields === 'summary' ? SUMMARIES_CACHE_TTL : PLANS_CACHE_TTL;
    setCachedItem(cacheKey, plans, ttl);
    
    return plans;
  } catch (error) {
    console.error(`Error fetching plans for level ${nivel}:`, error);
    return [];
  }
}

/**
 * Get plans by distance
 * @param distance The distance category
 * @param options Opções adicionais como projeção
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getPlansByDistance(
  distance: string,
  options: { fields?: 'summary' | 'full' } = {}
): Promise<PlanModel[] | Partial<PlanModel>[]> {
  if (!distance) return [];
  
  const { fields = 'full' } = options;
  const cacheKey = `${CACHE_KEYS.PLANS_BY_DISTANCE}${distance}:${fields}`;
  
  // Tenta buscar do cache
  const cachedPlans = getCachedItem<PlanModel[] | Partial<PlanModel>[]>(cacheKey);
  if (cachedPlans) {
    return cachedPlans;
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    // Seleciona a projeção adequada
    const projection = fields === 'summary' ? PLAN_SUMMARY_FIELDS : {};
    
    const plans = await db
      .collection<PlanModel>('plans')
      .find({ distances: distance })
      .project(projection)
      .toArray();
    
    // Define TTL baseado no tipo de dados
    const ttl = fields === 'summary' ? SUMMARIES_CACHE_TTL : PLANS_CACHE_TTL;
    setCachedItem(cacheKey, plans, ttl);
    
    return plans;
  } catch (error) {
    console.error(`Error fetching plans for distance ${distance}:`, error);
    return [];
  }
}

/**
 * Add a new plan
 * @param plan The plan data to add
 * @returns Promise resolving to the ObjectId of the inserted plan
 */
export async function addPlan(plan: Omit<PlanModel, '_id' | 'createdAt' | 'updatedAt'>): Promise<ObjectId> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    const timestamp = new Date();
    const result = await db.collection<PlanModel>('plans').insertOne({
      ...plan,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Invalidar caches relacionados
    invalidateCacheByPrefix(CACHE_KEYS.ALL_PLANS);
    invalidateCacheByPrefix(CACHE_KEYS.PLAN_SUMMARIES);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_TRAINER);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_LEVEL);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_DISTANCE);
    
    return result.insertedId;
  } catch (error) {
    console.error('Error adding plan:', error);
    throw error; // Re-throw to let caller handle it
  }
}

/**
 * Update an existing plan
 * @param path The path/slug of the plan to update
 * @param updates The partial plan data to update
 * @returns Promise resolving to a boolean indicating success
 */
export async function updatePlan(path: string, updates: Partial<PlanModel>): Promise<boolean> {
  if (!path) return false;
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    const result = await db.collection<PlanModel>('plans').updateOne(
      { path },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        } 
      }
    );
    
    // Invalidar caches relacionados
    invalidateCacheItem(`${CACHE_KEYS.PLAN_BY_PATH}${path}`);
    invalidateCacheByPrefix(`${CACHE_KEYS.PLAN_BY_PATH}${path}`); // Invalida todas as versões (summary/full)
    invalidateCacheByPrefix(CACHE_KEYS.ALL_PLANS);
    invalidateCacheByPrefix(CACHE_KEYS.PLAN_SUMMARIES);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_TRAINER);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_LEVEL);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_DISTANCE);
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Error updating plan ${path}:`, error);
    return false;
  }
}

/**
 * Delete a plan
 * @param path The path/slug of the plan to delete
 * @returns Promise resolving to a boolean indicating success
 */
export async function deletePlan(path: string): Promise<boolean> {
  if (!path) return false;
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    const result = await db.collection<PlanModel>('plans').deleteOne({ path });
    
    // Invalidar caches relacionados
    invalidateCacheItem(`${CACHE_KEYS.PLAN_BY_PATH}${path}`);
    invalidateCacheByPrefix(`${CACHE_KEYS.PLAN_BY_PATH}${path}`); // Invalida todas as versões (summary/full)
    invalidateCacheByPrefix(CACHE_KEYS.ALL_PLANS);
    invalidateCacheByPrefix(CACHE_KEYS.PLAN_SUMMARIES);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_TRAINER);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_LEVEL);
    invalidateCacheByPrefix(CACHE_KEYS.PLANS_BY_DISTANCE);
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Error deleting plan ${path}:`, error);
    return false;
  }
}