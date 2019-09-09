import { expect } from 'chai';

import { initPythia, VirgilPythiaCrypto } from '@virgilsecurity/pythia-crypto';
import { initCrypto, VirgilCrypto, VirgilAccessTokenSigner } from 'virgil-crypto';
import { createPythia, Pythia } from 'virgil-pythia';
import { JwtGenerator, GeneratorJwtProvider } from 'virgil-sdk';

import { AuthenticationParams, PythiaStrategy } from '../PythiaStrategy';
import { Request, BreachProofPassword } from '../types';

const PYTHIA_DELAY = 2000;
const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

describe('PythiaStrategy', () => {
  let pythia: Pythia;

  before(async () => {
    await Promise.all([initCrypto(), initPythia()]);
  });

  beforeEach(() => {
    const virgilCrypto = new VirgilCrypto();
    const virgilPythiaCrypto = new VirgilPythiaCrypto();
    const jwtGenerator = new JwtGenerator({
      apiKey: virgilCrypto.importPrivateKey(process.env.API_KEY!),
      apiKeyId: process.env.API_KEY_ID!,
      appId: process.env.APP_ID!,
      accessTokenSigner: new VirgilAccessTokenSigner(virgilCrypto),
    });
    pythia = createPythia({
      virgilCrypto,
      virgilPythiaCrypto,
      accessTokenProvider: new GeneratorJwtProvider(jwtGenerator, undefined, 'defaultIdentity'),
      proofKeys: process.env.PROOF_KEY!,
      apiUrl: process.env.API_URL,
    });
  });

  it("calls 'fail' if 'getAuthenticationParams' called with an Error", done => {
    const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
      getAuthenticationParams(new Error());
    });
    strategy.fail = () => done();
    strategy.authenticate({} as Request);
  });

  it("calls 'fail' if nothing was passed to 'getAuthenticationParams'", done => {
    const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
      getAuthenticationParams();
    });
    strategy.fail = () => done();
    strategy.authenticate({} as Request);
  });

  it("calls 'fail' if authentication parameters are invalid", done => {
    const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
      getAuthenticationParams(null, {} as AuthenticationParams);
    });
    strategy.fail = () => done();
    strategy.authenticate({} as Request);
  });

  it("calls 'fail' if password is invalid", done => {
    let breachProofPassword: BreachProofPassword;
    const user = {};
    const password1 = 'password1';
    const password2 = 'password2';
    pythia
      .createBreachProofPassword(password1)
      .then(newBreachProofPassword => {
        breachProofPassword = newBreachProofPassword;
        return sleep(PYTHIA_DELAY);
      })
      .then(() => {
        const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
          getAuthenticationParams(null, {
            user,
            salt: breachProofPassword.salt,
            deblindedPassword: breachProofPassword.deblindedPassword,
            version: breachProofPassword.version,
            password: password2,
          });
        });
        strategy.fail = () => done();
        strategy.authenticate({} as Request);
      });
  });

  it("calls 'success' if authentication was successful", done => {
    let breachProofPassword: BreachProofPassword;
    const user = {};
    const password = 'password';
    pythia
      .createBreachProofPassword(password)
      .then(newBreachProofPassword => {
        breachProofPassword = newBreachProofPassword;
        return sleep(PYTHIA_DELAY);
      })
      .then(() => {
        const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
          getAuthenticationParams(null, {
            user,
            password,
            salt: breachProofPassword.salt,
            deblindedPassword: breachProofPassword.deblindedPassword,
            version: breachProofPassword.version,
          });
        });
        strategy.success = authenticatedUser => {
          expect(authenticatedUser).to.eql(user);
          done();
        };
        strategy.authenticate({} as Request);
      });
  });

  it("calls 'error' if something went wrong during password verification", done => {
    const user = {};
    const password = 'password';
    pythia.createBreachProofPassword(password).then(breachProofPassword => {
      const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
        getAuthenticationParams(null, {
          user,
          password,
          salt: breachProofPassword.salt,
          deblindedPassword: breachProofPassword.deblindedPassword,
          version: breachProofPassword.version,
        });
      });
      strategy.error = () => done();
      strategy.authenticate({} as Request);
    });
  });
});
