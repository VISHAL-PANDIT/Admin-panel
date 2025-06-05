import getConnection from "../config/db";

const createTable = async (tableName: string) => {
  try {
    const db = await getConnection(); 

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(`Table '${tableName}' created or already exists`);
  } catch (error) {
    console.error('Error creating user table:', error);
    throw error;
  }
};

export default createTable;