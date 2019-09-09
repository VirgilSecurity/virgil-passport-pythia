const path = require('path');

const { initPythia, VirgilPythiaCrypto } = require('@virgilsecurity/pythia-crypto');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { initCrypto, VirgilCrypto, VirgilAccessTokenSigner } = require('virgil-crypto');
const { JwtGenerator, GeneratorJwtProvider } = require('virgil-sdk');
const { createPythia } = require('virgil-pythia');

const PythiaStrategy = require('../../dist/passport-pythia.cjs');

dotenv.config();

const users = {};

(async () => {
  await Promise.all([initCrypto(), initPythia()]);

  const virgilCrypto = new VirgilCrypto();
  const virgilPythiaCrypto = new VirgilPythiaCrypto();
  const jwtGenerator = new JwtGenerator({
    apiKey: virgilCrypto.importPrivateKey(process.env.API_KEY),
    apiKeyId: process.env.API_KEY_ID,
    appId: process.env.APP_ID,
    accessTokenSigner: new VirgilAccessTokenSigner(virgilCrypto),
  });
  const pythia = createPythia({
    virgilCrypto,
    virgilPythiaCrypto,
    accessTokenProvider: new GeneratorJwtProvider(jwtGenerator, undefined, 'defaultIdentity'),
    proofKeys: process.env.PROOF_KEY,
    // apiUrl property is optional. feel free to ignore it :)
    apiUrl: process.env.API_URL,
  });

  passport.use(
    new PythiaStrategy(pythia, (request, getAuthenticationParams) => {
      const user = users[request.body.username];
      if (!user) {
        return getAuthenticationParams(new Error('User not found'));
      }
      return getAuthenticationParams(null, {
        user,
        salt: user.salt,
        deblindedPassword: user.deblindedPassword,
        version: user.version,
        password: request.body.password,
      });
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.username);
  });

  passport.deserializeUser((username, done) => {
    const user = users[username];
    if (!user) {
      return done(new Error('User not found'));
    }
    return done(null, user);
  });

  const application = express();
  application.set('view engine', 'ejs');
  application.set('views', path.join(__dirname, 'views'));
  application.use(bodyParser.urlencoded({ extended: false }));
  application.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET,
    }),
  );
  application.use(passport.initialize());
  application.use(passport.session());

  application.get('/', (request, response) => {
    response.render('home', { user: request.user });
  });

  application.get('/sign-up', (request, response) => {
    response.render('sign-up', { user: request.user });
  });

  application.post('/sign-up', (request, response) => {
    pythia.createBreachProofPassword(request.body.password).then(breachProofPassword => {
      users[request.body.username] = {
        username: request.body.username,
        salt: breachProofPassword.salt.toString('base64'),
        deblindedPassword: breachProofPassword.deblindedPassword.toString('base64'),
        version: breachProofPassword.version,
      };
      response.redirect('/sign-in');
    });
  });

  application.get('/sign-in', (request, response) => {
    response.render('sign-in', { user: request.user });
  });

  application.post(
    '/sign-in',
    passport.authenticate('pythia', {
      successRedirect: '/profile',
      failureRedirect: '/sign-in',
    }),
  );

  application.get('/log-out', (request, response) => {
    if (!request.user) {
      return response.redirect('/sign-in');
    }
    return request.session.destroy(() => {
      response.redirect('/sign-in');
    });
  });

  application.get('/profile', (request, response) => {
    if (!request.user) {
      return response.redirect('/sign-in');
    }
    return response.render('profile', { user: request.user });
  });

  const PORT = 3000;
  application.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}.`);
  });
})();
