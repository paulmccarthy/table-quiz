const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const EmailService = {
  async sendVerificationEmail(email, token) {
    const url = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'noreply@tablequiz.com',
      to: email,
      subject: 'Verify your Table Quiz account',
      html: `<p>Click <a href="${url}">here</a> to verify your email address.</p>`,
    });
  },

  async sendPasswordResetEmail(email, token) {
    const url = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'noreply@tablequiz.com',
      to: email,
      subject: 'Reset your Table Quiz password',
      html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  },

  async sendQuizInvitation(email, quizTitle, inviteUrl) {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'noreply@tablequiz.com',
      to: email,
      subject: `You're invited to: ${quizTitle}`,
      html: `<p>You've been invited to join the quiz "<strong>${quizTitle}</strong>".</p>
             <p>Click <a href="${inviteUrl}">here</a> to join.</p>`,
    });
  },

  setTransporter(t) {
    transporter = t;
  },
};

module.exports = EmailService;
