import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI não definido em .env.local');
}

const PLANS_DIR = path.join(process.cwd(), 'planos');
const TRAINERS_FILE = path.join(process.cwd(), 'src/treinadores.json');

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Conectado ao MongoDB Atlas');
    
    const db = client.db('magic-training');
    const plansCollection = db.collection('plans');
    const trainersCollection = db.collection('trainers');
    
    await plansCollection.deleteMany({});
    await trainersCollection.deleteMany({});
    console.log('🧹 Coleções limpas');

    const plansMainFile = path.join(PLANS_DIR, 'index.js');
    const plansContent = fs.readFileSync(plansMainFile, 'utf8');
    const plansMatch = plansContent.match(/const plans = \[([\s\S]*?)\];/);
    
    if (!plansMatch) {
      throw new Error('Formato de arquivo de planos não reconhecido');
    }
    
    const plansArray = eval(`[${plansMatch[1]}]`);
    
    for (const plan of plansArray) {
      let dailyWorkouts = [];
      try {
        const planDataPath = path.join(PLANS_DIR, `${plan.path}.json`);
        if (fs.existsSync(planDataPath)) {
          dailyWorkouts = JSON.parse(fs.readFileSync(planDataPath, 'utf8'));
        } else {
          console.log(`⚠️ Arquivo de workouts não encontrado para: ${plan.path}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao carregar workouts para ${plan.path}:`, error);
      }

      const planDocument = {
        ...plan,
        dailyWorkouts,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await plansCollection.insertOne(planDocument);
      console.log(`✅ Plano migrado: ${plan.name}`);
    }

    try {
      const treinoPlans = await import('../planos/treino');
      for (const plan of treinoPlans.default) {
        let dailyWorkouts = [];
        try {
          const planDataPath = path.join(PLANS_DIR, 'treinos', `${plan.path}.json`);
          if (fs.existsSync(planDataPath)) {
            dailyWorkouts = JSON.parse(fs.readFileSync(planDataPath, 'utf8'));
          } else {
            console.log(`⚠️ Arquivo de treino não encontrado para: ${plan.path}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao carregar treino para ${plan.path}:`, error);
        }

        const planDocument = {
          ...plan,
          path: `treino/${plan.path}`,
          dailyWorkouts,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await plansCollection.insertOne(planDocument);
        console.log(`✅ Plano de treino migrado: ${plan.name}`);
      }
    } catch (error) {
      console.error('❌ Erro ao migrar planos de treino:', error);
    }

    try {
      const trainersData = JSON.parse(fs.readFileSync(TRAINERS_FILE, 'utf8'));
      for (const trainer of trainersData.trainers) {
        const trainerDocument = {
          ...trainer,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await trainersCollection.insertOne(trainerDocument);
        console.log(`✅ Treinador migrado: ${trainer.name}`);
      }
    } catch (error) {
      console.error('❌ Erro ao migrar treinadores:', error);
    }

    await plansCollection.createIndex({ path: 1 }, { unique: true });
    await plansCollection.createIndex({ nivel: 1 });
    await plansCollection.createIndex({ distances: 1 });
    await plansCollection.createIndex({ coach: 1 });
    
    await trainersCollection.createIndex({ id: 1 }, { unique: true });
    await trainersCollection.createIndex({ name: 1 });

    console.log('📊 Índices criados');
    console.log('✨ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

main().catch(console.error);
