const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { createMockReq, createMockRes } = require('../../helpers/setup');

describe('AdminController', () => {
  let AdminController;
  let mockAdminService;
  let mockUser;

  beforeEach(() => {
    mockAdminService = {
      getSettings: sinon.stub(),
      updateSettings: sinon.stub().resolves(),
      resetUserPassword: sinon.stub(),
      bulkUploadQuestions: sinon.stub(),
    };
    mockUser = {
      findAll: sinon.stub(),
    };
    AdminController = proxyquire('../../../src/controllers/adminController', {
      '../services/adminService': mockAdminService,
      '../models/User': mockUser,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getSettings', () => {
    it('should render settings page with current settings', async () => {
      const settings = { oauth_facebook_enabled: 'true' };
      mockAdminService.getSettings.resolves(settings);
      const req = createMockReq();
      const res = createMockRes();

      await AdminController.getSettings(req, res);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('admin/settings');
      expect(res.render.firstCall.args[1]).to.deep.equal({
        title: 'App Settings',
        settings,
      });
    });
  });

  describe('postSettings', () => {
    it('should update settings and redirect with success', async () => {
      const req = createMockReq({
        body: {
          oauth_facebook_enabled: 'on',
          oauth_github_enabled: 'on',
        },
      });
      const res = createMockRes();

      await AdminController.postSettings(req, res);

      expect(mockAdminService.updateSettings.calledOnce).to.be.true;
      expect(req.flash.calledWith('success', 'Settings updated.')).to.be.true;
      expect(res.redirect.calledWith('/admin/settings')).to.be.true;
    });

    it('should set missing checkbox keys to false', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await AdminController.postSettings(req, res);

      const settingsArg = mockAdminService.updateSettings.firstCall.args[0];
      expect(settingsArg.oauth_facebook_enabled).to.equal('false');
      expect(settingsArg.oauth_microsoft_enabled).to.equal('false');
      expect(settingsArg.oauth_github_enabled).to.equal('false');
      expect(settingsArg.email_verification_enabled).to.equal('false');
    });

    it('should redirect with error on failure', async () => {
      mockAdminService.updateSettings.rejects(new Error('DB error'));
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await AdminController.postSettings(req, res);

      expect(req.flash.calledWith('error', 'DB error')).to.be.true;
      expect(res.redirect.calledWith('/admin/settings')).to.be.true;
    });
  });

  describe('getUserManagement', () => {
    it('should render user management page with all users', async () => {
      const users = [{ id: 1, email: 'a@b.com' }, { id: 2, email: 'c@d.com' }];
      mockUser.findAll.resolves(users);
      const req = createMockReq();
      const res = createMockRes();

      await AdminController.getUserManagement(req, res);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('admin/userManagement');
      expect(res.render.firstCall.args[1]).to.deep.equal({
        title: 'User Management',
        users,
      });
    });
  });

  describe('postResetPassword', () => {
    it('should reset password directly and show success', async () => {
      mockAdminService.resetUserPassword.resolves({ method: 'direct' });
      const req = createMockReq({
        params: { id: '5' },
        body: { password: 'newpass123' },
      });
      const res = createMockRes();

      await AdminController.postResetPassword(req, res);

      expect(mockAdminService.resetUserPassword.calledOnce).to.be.true;
      expect(req.flash.calledWith('success', 'Password reset successfully.')).to.be.true;
      expect(res.redirect.calledWith('/admin/users')).to.be.true;
    });

    it('should send reset link and show success with email', async () => {
      mockAdminService.resetUserPassword.resolves({ method: 'link', email: 'user@test.com' });
      const req = createMockReq({
        params: { id: '5' },
        body: { sendResetLink: 'on' },
      });
      const res = createMockRes();

      await AdminController.postResetPassword(req, res);

      expect(req.flash.calledWith('success', 'Password reset link sent to user@test.com.')).to.be.true;
      expect(res.redirect.calledWith('/admin/users')).to.be.true;
    });

    it('should redirect with error on failure', async () => {
      mockAdminService.resetUserPassword.rejects(new Error('User not found.'));
      const req = createMockReq({
        params: { id: '999' },
        body: { password: 'pw' },
      });
      const res = createMockRes();

      await AdminController.postResetPassword(req, res);

      expect(req.flash.calledWith('error', 'User not found.')).to.be.true;
      expect(res.redirect.calledWith('/admin/users')).to.be.true;
    });
  });

  describe('getBulkUpload', () => {
    it('should render bulk upload page with null results', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await AdminController.getBulkUpload(req, res);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('admin/bulkUpload');
      expect(res.render.firstCall.args[1]).to.deep.equal({
        title: 'Bulk Upload Questions',
        results: null,
      });
    });
  });

  describe('postBulkUpload', () => {
    it('should redirect with error when no file uploaded', async () => {
      const req = createMockReq({ file: undefined });
      const res = createMockRes();

      await AdminController.postBulkUpload(req, res);

      expect(req.flash.calledWith('error', 'Please select a file to upload.')).to.be.true;
      expect(res.redirect.calledWith('/admin/bulk-upload')).to.be.true;
    });

    it('should upload file and render results', async () => {
      const results = { imported: 3, errors: [] };
      mockAdminService.bulkUploadQuestions.resolves(results);
      const req = createMockReq({
        file: {
          buffer: Buffer.from('content'),
          originalname: 'questions.csv',
        },
      });
      const res = createMockRes();

      await AdminController.postBulkUpload(req, res);

      expect(mockAdminService.bulkUploadQuestions.calledOnce).to.be.true;
      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[1]).to.deep.equal({
        title: 'Bulk Upload Questions',
        results,
      });
    });

    it('should redirect with error on service failure', async () => {
      mockAdminService.bulkUploadQuestions.rejects(new Error('Parse error'));
      const req = createMockReq({
        file: {
          buffer: Buffer.from('bad'),
          originalname: 'test.csv',
        },
      });
      const res = createMockRes();

      await AdminController.postBulkUpload(req, res);

      expect(req.flash.calledWith('error', 'Parse error')).to.be.true;
      expect(res.redirect.calledWith('/admin/bulk-upload')).to.be.true;
    });
  });
});
