const pool = require('../config/database');

const AppSettings = {
  async get(key) {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      [key],
    );
    return rows[0] ? rows[0].setting_value : null;
  },

  async getBoolean(key, defaultValue = true) {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    return value === 'true';
  },

  async set(key, value, updatedBy = null) {
    await pool.execute(
      `INSERT INTO app_settings (setting_key, setting_value, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      [key, String(value), updatedBy],
    );
  },

  async getAll() {
    const [rows] = await pool.execute('SELECT * FROM app_settings ORDER BY setting_key');
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  },

  async getOAuthSettings() {
    return {
      facebook: await this.getBoolean('oauth_facebook_enabled', true),
      microsoft: await this.getBoolean('oauth_microsoft_enabled', true),
      github: await this.getBoolean('oauth_github_enabled', true),
    };
  },

  async isEmailVerificationEnabled() {
    return this.getBoolean('email_verification_enabled', true);
  },
};

module.exports = AppSettings;
