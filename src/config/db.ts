import mysql, { Connection } from 'mysql2/promise';
import { config } from './config';

let connection: Connection | null = null;

const getConnection = async (): Promise<Connection> => {
  if (!connection) {
    console.log(`Connecting to MySQL Server at ${config.host} as ${config.user}`);

    connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    });

    console.log("Connected to MySQL (no database selected)");

    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);

    // Switch to the database
    await connection.changeUser({ database: config.database });

    console.log(`Using database: ${config.database}`);
  }
  return connection;
};

export default getConnection;
