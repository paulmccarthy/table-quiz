const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findByEmail(email);
      if (!user || !user.password_hash) {
        return done(null, false, { message: 'Invalid email or password.' });
      }
      const isValid = await User.comparePassword(password, user.password_hash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  },
));

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'displayName'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findByOAuth('facebook', profile.id);
        if (!user) {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `fb_${profile.id}@placeholder.com`;
          user = await User.createOAuth({
            email,
            displayName: profile.displayName,
            provider: 'facebook',
            oauthId: profile.id,
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ));
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findByOAuth('github', profile.id);
        if (!user) {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `gh_${profile.id}@placeholder.com`;
          user = await User.createOAuth({
            email,
            displayName: profile.displayName || profile.username,
            provider: 'github',
            oauthId: profile.id,
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ));
}

module.exports = passport;
