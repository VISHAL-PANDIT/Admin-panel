import getConnection from "../config/db";

const createFoodTable = async () => {
  const db = await getConnection();

  await db.query(`
    CREATE TABLE IF NOT EXISTS foodItem (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  console.log(` Table 'foodItem' ensured`);
};

export default createFoodTable;
