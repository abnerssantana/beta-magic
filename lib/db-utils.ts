// lib/db-utils.ts
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';
import { PlanModel, TrainerModel } from '../models';

// Define proper types for query parameters
interface PlanQueryOptions {
  nivel?: string;
  coach?: string;
  distance?: string;
  search?: string;
  limit?: number;
}

// Interface for MongoDB queries
interface MongoQuery {
  nivel?: 'iniciante' | 'intermediário' | 'avançado' | 'elite';
  coach?: string;
  distances?: string;
  $or?: Array<{[key: string]: {$regex: string, $options: string}}>;
}

/**
 * Get all plans with optional filtering
 * @param options Filter options for plans
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getAllPlans(options: PlanQueryOptions = {}): Promise<PlanModel[]> {
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
    return await db
      .collection<PlanModel>('plans')
      .find(query)
      .limit(options.limit || 0)
      .toArray();
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
}

/**
 * Get a specific plan by its path
 * @param path The path/slug of the plan
 * @returns Promise resolving to a PlanModel or null
 */
export async function getPlanByPath(path: string): Promise<PlanModel | null> {
  if (!path) return null;
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    return await db
      .collection<PlanModel>('plans')
      .findOne({ path });
  } catch (error) {
    console.error(`Error fetching plan with path ${path}:`, error);
    return null;
  }
}

/**
 * Get all trainers
 * @returns Promise resolving to an array of TrainerModel objects
 */
export async function getAllTrainers(): Promise<TrainerModel[]> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    return await db
      .collection<TrainerModel>('trainers')
      .find({})
      .toArray();
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
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    return await db
      .collection<TrainerModel>('trainers')
      .findOne({ id });
  } catch (error) {
    console.error(`Error fetching trainer with ID ${id}:`, error);
    return null;
  }
}

/**
 * Get plans by a specific trainer
 * @param coach The name of the trainer/coach
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getPlansByTrainer(coach: string): Promise<PlanModel[]> {
  if (!coach) return [];
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    return await db
      .collection<PlanModel>('plans')
      .find({ coach })
      .toArray();
  } catch (error) {
    console.error(`Error fetching plans for trainer ${coach}:`, error);
    return [];
  }
}

/**
 * Get plans by level
 * @param nivel The level of plans to fetch
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getPlansByLevel(nivel: 'iniciante' | 'intermediário' | 'avançado' | 'elite'): Promise<PlanModel[]> {
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    return await db
      .collection<PlanModel>('plans')
      .find({ nivel })
      .toArray();
  } catch (error) {
    console.error(`Error fetching plans for level ${nivel}:`, error);
    return [];
  }
}

/**
 * Get plans by distance
 * @param distance The distance category
 * @returns Promise resolving to an array of PlanModel objects
 */
export async function getPlansByDistance(distance: string): Promise<PlanModel[]> {
  if (!distance) return [];
  
  try {
    const client = await clientPromise;
    const db = client.db('magic-training');
    
    return await db
      .collection<PlanModel>('plans')
      .find({ distances: distance })
      .toArray();
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
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Error deleting plan ${path}:`, error);
    return false;
  }
}