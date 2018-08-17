import { Request } from 'express';
import {
  VirgilCrypto,
  VirgilPythiaCrypto,
  VirgilAccessTokenSigner,
} from 'virgil-crypto/dist/virgil-crypto-pythia.cjs';
import { JwtGenerator, GeneratorJwtProvider } from 'virgil-sdk';
import { createPythia, Pythia } from 'virgil-pythia';

import PythiaStrategy, { AuthenticationParams } from '../PythiaStrategy';

const PYTHIA_DELAY = 2000;
const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

describe('PythiaStrategy', () => {
  let pythia: Pythia;

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
      accessTokenProvider: new GeneratorJwtProvider(jwtGenerator),
      proofKeys: process.env.PROOF_KEY!,
    });
  });

  it("should call 'fail' if 'getAuthenticationParams' called with an Error", done => {
    const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
      getAuthenticationParams(new Error());
    });
    strategy.fail = () => done();
    strategy.authenticate({} as Request);
  });

  it("should call 'fail' if nothing was passed to 'getAuthenticationParams'", done => {
    const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
      getAuthenticationParams();
    });
    strategy.fail = () => done();
    strategy.authenticate({} as Request);
  });

  it("should call 'fail' if authentication parameters are invalid", done => {
    const strategy = new PythiaStrategy(pythia, (_, getAuthenticationParams) => {
      getAuthenticationParams(null, {} as AuthenticationParams);
    });
    strategy.fail = () => done();
    strategy.authenticate({} as Request);
  });

  it("should call 'fail' if password is invalid", async done => {
    const user = {};
    const password1 = 'password1';
    const password2 = 'password2';
    const breachProofPassword = await pythia.createBreachProofPassword(password1);
    await sleep(PYTHIA_DELAY);
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

  it("should call 'success' if authentication was successful", async done => {
    const user = {};
    const password = 'password';
    const breachProofPassword = await pythia.createBreachProofPassword(password);
    await sleep(PYTHIA_DELAY);
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
      expect(authenticatedUser).toEqual(user);
      done();
    };
    strategy.authenticate({} as Request);
  });

  it("should call 'error' if something went wrong during password verification", async done => {
    const user = {};
    const password = 'password';
    const breachProofPassword = await pythia.createBreachProofPassword(password);
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
