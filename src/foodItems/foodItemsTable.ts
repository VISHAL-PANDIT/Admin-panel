import getConnection from "../config/db";

const createFoodTable = async () => {
  const db = await getConnection();

  // Create the table only if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS food (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  console.log(`Table 'food' ensured`);
};

export default createFoodTable;
