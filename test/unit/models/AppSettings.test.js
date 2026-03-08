const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('AppSettings Model', () => {
  let AppSettings;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      execute: sinon.stub(),
    };
    AppSettings = proxyquire('../../../src/models/AppSettings', {
      '../config/database': mockPool,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get', () => {
    it('should return the setting value when found', async () => {
      mockPool.execute.resolves([[{ setting_value: 'true' }]]);
      const result = await AppSettings.get('email_verification_enabled');
      expect(result).to.equal('true');
    });

    it('should return null when setting not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await AppSettings.get('nonexistent_key');
      expect(result).to.be.null;
    });
  });

  describe('getBoolean', () => {
    it('should return true when value is "true"', async () => {
      mockPool.execute.resolves([[{ setting_value: 'true' }]]);
      const result = await AppSettings.getBoolean('some_key');
      expect(result).to.be.true;
    });

    it('should return false when value is "false"', async () => {
      mockPool.execute.resolves([[{ setting_value: 'false' }]]);
      const result = await AppSettings.getBoolean('some_key');
      expect(result).to.be.false;
    });

    it('should return default value when setting not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await AppSettings.getBoolean('missing_key', false);
      expect(result).to.be.false;
    });

    it('should default to true when no default provided and setting not found', async () => {
      mockPool.execute.resolves([[]]);
      const result = await AppSettings.getBoolean('missing_key');
      expect(result).to.be.true;
    });
  });

  describe('set', () => {
    it('should upsert the setting with admin id', async () => {
      mockPool.execute.resolves([{}]);
      await AppSettings.set('some_key', 'some_value', 1);
      expect(mockPool.execute.calledOnce).to.be.true;
      const args = mockPool.execute.firstCall.args;
      expect(args[1]).to.deep.equal(['some_key', 'some_value', 1]);
    });

    it('should convert value to string', async () => {
      mockPool.execute.resolves([{}]);
      await AppSettings.set('some_key', true, null);
      const args = mockPool.execute.firstCall.args;
      expect(args[1][1]).to.equal('true');
    });
  });

  describe('getAll', () => {
    it('should return all settings as key-value object', async () => {
      const rows = [
        { setting_key: 'key1', setting_value: 'val1' },
        { setting_key: 'key2', setting_value: 'val2' },
      ];
      mockPool.execute.resolves([rows]);
      const result = await AppSettings.getAll();
      expect(result).to.deep.equal({ key1: 'val1', key2: 'val2' });
    });

    it('should return empty object when no settings', async () => {
      mockPool.execute.resolves([[]]);
      const result = await AppSettings.getAll();
      expect(result).to.deep.equal({});
    });
  });

  describe('getOAuthSettings', () => {
    it('should return OAuth enabled status for all providers', async () => {
      // Each getBoolean call triggers a get which calls pool.execute
      mockPool.execute
        .onFirstCall().resolves([[{ setting_value: 'true' }]])
        .onSecondCall().resolves([[{ setting_value: 'false' }]])
        .onThirdCall().resolves([[{ setting_value: 'true' }]]);

      const result = await AppSettings.getOAuthSettings();
      expect(result).to.deep.equal({
        facebook: true,
        microsoft: false,
        github: true,
      });
    });
  });

  describe('isEmailVerificationEnabled', () => {
    it('should return true when enabled', async () => {
      mockPool.execute.resolves([[{ setting_value: 'true' }]]);
      const result = await AppSettings.isEmailVerificationEnabled();
      expect(result).to.be.true;
    });

    it('should return false when disabled', async () => {
      mockPool.execute.resolves([[{ setting_value: 'false' }]]);
      const result = await AppSettings.isEmailVerificationEnabled();
      expect(result).to.be.false;
    });

    it('should default to true when not set', async () => {
      mockPool.execute.resolves([[]]);
      const result = await AppSettings.isEmailVerificationEnabled();
      expect(result).to.be.true;
    });
  });
});
