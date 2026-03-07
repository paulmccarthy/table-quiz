require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'table_quiz',
    multipleStatements: true,
  });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [executed] = await connection.execute('SELECT name FROM migrations ORDER BY id');
  const executedNames = executed.map((r) => r.name);

  const sqlDir = path.join(__dirname, 'sql');
  const files = fs.readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (!executedNames.includes(file)) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      await connection.query(sql);
      await connection.execute('INSERT INTO migrations (name) VALUES (?)', [file]);
      console.log(`Completed: ${file}`);
    }
  }

  await connection.end();
  console.log('All migrations complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
