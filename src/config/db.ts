import mysql from 'mysql2/promise';

const createDatabase = async () => {
  try {
    // First connect without database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS products`);
    await connection.end();

    console.log('Database created or already exists');
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  }
};

const getConnection = async () => {
  try {
    // Create database first
    await createDatabase();

    // Then create connection with database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'products'
    });

    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export default getConnection;
