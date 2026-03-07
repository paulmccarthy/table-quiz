require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function rollback() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'table_quiz',
    multipleStatements: true,
  });

  const [executed] = await connection.execute(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1',
  );

  if (executed.length === 0) {
    console.log('No migrations to rollback.');
    await connection.end();
    return;
  }

  const lastMigration = executed[0].name;
  const downFile = lastMigration.replace('.sql', '.down.sql');
  const downPath = path.join(__dirname, 'sql', downFile);

  if (fs.existsSync(downPath)) {
    console.log(`Rolling back: ${lastMigration}`);
    const sql = fs.readFileSync(downPath, 'utf8');
    await connection.query(sql);
    await connection.execute('DELETE FROM migrations WHERE name = ?', [lastMigration]);
    console.log(`Rolled back: ${lastMigration}`);
  } else {
    console.log(`No down migration found for: ${lastMigration}`);
  }

  await connection.end();
}

rollback().catch((err) => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
