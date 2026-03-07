const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const User = {
  async create({ email, password, displayName, role = 'player' }) {
    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, display_name, role, verification_token)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, displayName || email, role, verificationToken],
    );
    return { id: result.insertId, email, displayName, role, verificationToken };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findByOAuth(provider, oauthId) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      [provider, oauthId],
    );
    return rows[0] || null;
  },

  async createOAuth({ email, displayName, role = 'player', provider, oauthId }) {
    const [result] = await pool.execute(
      `INSERT INTO users (email, display_name, role, oauth_provider, oauth_id, email_verified)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [email, displayName || email, role, provider, oauthId],
    );
    return { id: result.insertId, email, displayName, role };
  },

  async verifyEmail(token) {
    const [result] = await pool.execute(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE verification_token = ?',
      [token],
    );
    return result.affectedRows > 0;
  },

  async setResetToken(email, token, expires) {
    const [result] = await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email],
    );
    return result.affectedRows > 0;
  },

  async findByResetToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token],
    );
    return rows[0] || null;
  },

  async updatePassword(id, password) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, id],
    );
  },

  async comparePassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },

  async updateRole(id, role) {
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  },

  async updatePasskeyCredential(id, credential) {
    await pool.execute(
      'UPDATE users SET passkey_credential = ? WHERE id = ?',
      [JSON.stringify(credential), id],
    );
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT id, email, display_name, role, email_verified, created_at FROM users ORDER BY created_at DESC');
    return rows;
  },

  async deleteById(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = User;
