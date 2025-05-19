import mysql, { Connection } from 'mysql2/promise';
import { config } from './config';

let connection: Connection | null = null;

const connectionToDatabase = async (): Promise<Connection> => {
  if (!connection) {
    connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    console.log(' MySQL connected');
  }
  return connection;
};

export default connectionToDatabase;
