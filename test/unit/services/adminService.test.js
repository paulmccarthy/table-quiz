const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('AdminService', () => {
  let AdminService;
  let mockAppSettings;
  let mockQuestion;
  let mockTag;
  let mockUser;
  let mockAuthService;
  let mockParse;

  beforeEach(() => {
    mockAppSettings = {
      getAll: sinon.stub(),
      set: sinon.stub().resolves(),
    };
    mockQuestion = {
      create: sinon.stub(),
    };
    mockTag = {
      findOrCreate: sinon.stub(),
      addToQuestion: sinon.stub().resolves(),
    };
    mockUser = {
      findById: sinon.stub(),
      updatePassword: sinon.stub().resolves(),
    };
    mockAuthService = {
      requestPasswordReset: sinon.stub().resolves(),
    };
    mockParse = sinon.stub();

    AdminService = proxyquire('../../../src/services/adminService', {
      '../models/AppSettings': mockAppSettings,
      '../models/Question': mockQuestion,
      '../models/Tag': mockTag,
      '../models/User': mockUser,
      './emailService': {},
      './authService': mockAuthService,
      'csv-parse/sync': { parse: mockParse },
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getSettings', () => {
    it('should return all settings', async () => {
      const settings = { key1: 'val1' };
      mockAppSettings.getAll.resolves(settings);
      const result = await AdminService.getSettings();
      expect(result).to.deep.equal(settings);
    });
  });

  describe('updateSettings', () => {
    it('should update allowed settings with "on" as true', async () => {
      await AdminService.updateSettings({
        oauth_facebook_enabled: 'on',
        oauth_github_enabled: 'false',
      }, 1);

      expect(mockAppSettings.set.calledWith('oauth_facebook_enabled', 'true', 1)).to.be.true;
      expect(mockAppSettings.set.calledWith('oauth_github_enabled', 'false', 1)).to.be.true;
    });

    it('should update allowed settings with "true" string as true', async () => {
      await AdminService.updateSettings({
        email_verification_enabled: 'true',
      }, 2);

      expect(mockAppSettings.set.calledWith('email_verification_enabled', 'true', 2)).to.be.true;
    });

    it('should ignore non-allowed keys', async () => {
      await AdminService.updateSettings({
        evil_key: 'hacked',
      }, 1);

      expect(mockAppSettings.set.called).to.be.false;
    });
  });

  describe('resetUserPassword', () => {
    it('should set password directly when password is provided', async () => {
      mockUser.findById.resolves({ id: 1, email: 'user@test.com' });
      const result = await AdminService.resetUserPassword(1, { password: 'newpass123' });
      expect(result).to.deep.equal({ method: 'direct' });
      expect(mockUser.updatePassword.calledWith(1, 'newpass123')).to.be.true;
    });

    it('should send reset link when sendResetLink is true', async () => {
      mockUser.findById.resolves({ id: 1, email: 'user@test.com' });
      const result = await AdminService.resetUserPassword(1, { sendResetLink: true });
      expect(result).to.deep.equal({ method: 'link', email: 'user@test.com' });
      expect(mockAuthService.requestPasswordReset.calledWith('user@test.com')).to.be.true;
    });

    it('should throw when user not found', async () => {
      mockUser.findById.resolves(null);
      try {
        await AdminService.resetUserPassword(999, { password: 'pw' });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('User not found.');
      }
    });

    it('should throw when neither password nor sendResetLink provided', async () => {
      mockUser.findById.resolves({ id: 1, email: 'user@test.com' });
      try {
        await AdminService.resetUserPassword(1, {});
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Either password or sendResetLink must be provided.');
      }
    });
  });

  describe('bulkUploadQuestions', () => {
    it('should parse CSV and import questions', async () => {
      mockParse.returns([
        { text: 'Q1', correct_answer: 'A', options: 'A|B|C', tags: '' },
      ]);
      mockQuestion.create.resolves({ id: 1 });

      const buffer = Buffer.from('text,correct_answer,options\nQ1,A,A|B|C');
      const result = await AdminService.bulkUploadQuestions(buffer, 'questions.csv', 1);

      expect(result.imported).to.equal(1);
      expect(result.errors).to.have.length(0);
      expect(mockQuestion.create.calledOnce).to.be.true;
    });

    it('should parse JSON and import questions', async () => {
      const buffer = Buffer.from(JSON.stringify([
        { text: 'Q1', correct_answer: 'A', options: ['A', 'B', 'C'] },
      ]));
      mockQuestion.create.resolves({ id: 1 });

      const result = await AdminService.bulkUploadQuestions(buffer, 'questions.json', 1);

      expect(result.imported).to.equal(1);
      expect(result.errors).to.have.length(0);
    });

    it('should throw for unsupported file type', async () => {
      try {
        await AdminService.bulkUploadQuestions(Buffer.from(''), 'file.xml', 1);
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('Unsupported file type. Use CSV or JSON.');
      }
    });

    it('should collect errors for invalid questions', async () => {
      const buffer = Buffer.from(JSON.stringify([
        { text: '', correct_answer: 'A' },
        { text: 'Valid Q', correct_answer: 'B' },
      ]));
      mockQuestion.create.resolves({ id: 1 });

      const result = await AdminService.bulkUploadQuestions(buffer, 'test.json', 1);
      expect(result.imported).to.equal(1);
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].line).to.equal(1);
    });

    it('should create tags for imported questions', async () => {
      const buffer = Buffer.from(JSON.stringify([
        { text: 'Q1', correct_answer: 'A', tags: ['Science', 'Math'] },
      ]));
      mockQuestion.create.resolves({ id: 10 });
      mockTag.findOrCreate
        .onFirstCall().resolves({ id: 1, name: 'Science' })
        .onSecondCall().resolves({ id: 2, name: 'Math' });

      const result = await AdminService.bulkUploadQuestions(buffer, 'test.json', 1);
      expect(result.imported).to.equal(1);
      expect(mockTag.findOrCreate.calledTwice).to.be.true;
      expect(mockTag.addToQuestion.calledTwice).to.be.true;
    });
  });

  describe('parseCSV', () => {
    it('should parse CSV content into question objects', () => {
      mockParse.returns([
        { text: 'Q1', content_type: 'text', answer_type: 'multiple_choice', difficulty: 'easy', correct_answer: 'A', options: 'A|B|C', tags: 'science|math', time_limit: '30' },
      ]);

      const result = AdminService.parseCSV('csv content');
      expect(result).to.have.length(1);
      expect(result[0].text).to.equal('Q1');
      expect(result[0].options).to.deep.equal(['A', 'B', 'C']);
      expect(result[0].tags).to.deep.equal(['science', 'math']);
    });

    it('should handle missing optional fields', () => {
      mockParse.returns([
        { text: 'Q1', correct_answer: 'A' },
      ]);

      const result = AdminService.parseCSV('csv content');
      expect(result[0].content_type).to.equal('text');
      expect(result[0].answer_type).to.equal('multiple_choice');
      expect(result[0].difficulty).to.equal('medium');
      expect(result[0].options).to.be.null;
      expect(result[0].tags).to.deep.equal([]);
    });
  });

  describe('parseJSON', () => {
    it('should parse JSON array into question objects', () => {
      const json = JSON.stringify([
        { text: 'Q1', correct_answer: 'A', options: ['A', 'B'], tags: ['science'] },
      ]);
      const result = AdminService.parseJSON(json);
      expect(result).to.have.length(1);
      expect(result[0].text).to.equal('Q1');
      expect(result[0].options).to.deep.equal(['A', 'B']);
      expect(result[0].tags).to.deep.equal(['science']);
    });

    it('should throw for non-array JSON', () => {
      try {
        AdminService.parseJSON('{"text": "Q1"}');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.message).to.equal('JSON file must contain an array of question objects.');
      }
    });

    it('should handle missing optional fields', () => {
      const json = JSON.stringify([{ text: 'Q1', correct_answer: 'A' }]);
      const result = AdminService.parseJSON(json);
      expect(result[0].content_type).to.equal('text');
      expect(result[0].options).to.be.null;
      expect(result[0].tags).to.deep.equal([]);
    });
  });

  describe('validateQuestion', () => {
    it('should pass for a valid question', () => {
      expect(() => AdminService.validateQuestion({ text: 'What is 2+2?' }, 1)).to.not.throw();
    });

    it('should throw for empty text', () => {
      expect(() => AdminService.validateQuestion({ text: '' }, 1))
        .to.throw('Line 1: Question text is required.');
    });

    it('should throw for missing text', () => {
      expect(() => AdminService.validateQuestion({}, 1))
        .to.throw('Line 1: Question text is required.');
    });

    it('should throw for invalid content_type', () => {
      expect(() => AdminService.validateQuestion({ text: 'Q', content_type: 'xml' }, 2))
        .to.throw("Line 2: Invalid content type 'xml'.");
    });

    it('should throw for invalid answer_type', () => {
      expect(() => AdminService.validateQuestion({ text: 'Q', answer_type: 'essay' }, 3))
        .to.throw("Line 3: Invalid answer type 'essay'.");
    });

    it('should throw for invalid difficulty', () => {
      expect(() => AdminService.validateQuestion({ text: 'Q', difficulty: 'insane' }, 4))
        .to.throw("Line 4: Invalid difficulty 'insane'.");
    });

    it('should allow valid content_type, answer_type, and difficulty', () => {
      expect(() => AdminService.validateQuestion({
        text: 'Q',
        content_type: 'image',
        answer_type: 'freeform_text',
        difficulty: 'hard',
      }, 1)).to.not.throw();
    });
  });
});
