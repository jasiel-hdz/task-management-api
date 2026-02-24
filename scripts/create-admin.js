/** Creates admin user. Run: node scripts/create-admin.js. Requires .env with DB_* and optionally ADMIN_EMAIL, ADMIN_PASSWORD. */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const email = process.env.ADMIN_EMAIL || 'admin@ejemplo.com';
const password = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'task_management',
  });
  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO users (id, name, email, password, role, created_at)
     VALUES ($1, $2, $3, $4, 'administrator', NOW())
     ON CONFLICT (email) DO NOTHING`,
    [id, 'Admin', email, hashed],
  );
  console.log('Admin user ready:', email, '(password:', password + ')');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
