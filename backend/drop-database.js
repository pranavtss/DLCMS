const mongoose = require('mongoose');

async function dropDatabase() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/dlcms');
    console.log('Connected to MongoDB');
    
    await mongoose.connection.dropDatabase();
    console.log('✅ Database dropped successfully');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error dropping database:', error);
  }
}

dropDatabase();
