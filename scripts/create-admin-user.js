const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI não encontrado no arquivo .env.local!');
    process.exit(1);
  }
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado ao MongoDB');
    
    const db = client.db('magic-training');
    const usersCollection = db.collection('users');
    
    // Limpa qualquer usuário admin existente - isso garante um reset limpo
    await usersCollection.deleteOne({ email: 'admin@magictraining.run' });
    console.log('Usuário admin existente removido (se existia)');
    
    // Gera o hash da senha (12 é o número de rounds de salt)
    const passwordHash = await bcrypt.hash('MagicTraining2024', 12);
    
    // Cria o novo usuário
    const newUser = {
      name: 'Administrador',
      email: 'admin@magictraining.run',
      password: passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(newUser);
    console.log('Usuário administrador criado com sucesso!');
    console.log('Email: admin@magictraining.run');
    console.log('Senha: MagicTraining2024');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.close();
    console.log('Conexão fechada');
  }
}

main().catch(console.error);