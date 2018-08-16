declare module 'virgil-crypto/dist/virgil-crypto-pythia.cjs' {
  export * from 'virgil-crypto/dist/types/pythia';
}

declare module 'virgil-pythia' {
  import { VirgilCrypto, VirgilPythiaCrypto } from 'virgil-crypto/dist/types/pythia';
  import { IAccessTokenProvider } from 'virgil-sdk';

  function createPythia(params: {
    virgilCrypto: VirgilCrypto;
    virgilPythiaCrypto: VirgilPythiaCrypto;
    accessTokenProvider: IAccessTokenProvider;
    proofKeys: string | string[];
  }): Pythia;

  class Pythia {
    verifyBreachProofPassword(
      password: string,
      breachProofPassword: BreachProofPassword,
      includeProof?: boolean,
    ): Promise<boolean>;

    createBreachProofPassword(password: string): Promise<BreachProofPassword>;

    updateBreachProofPassword(
      updateToken: string,
      breachProofPassword: BreachProofPassword,
    ): BreachProofPassword;
  }

  class BreachProofPassword {
    public salt: Buffer;
    public deblindedPassword: Buffer;
    public version: number;

    constructor(salt: Buffer | string, deblindedPassword: Buffer | string, version: number);

    toJSON(): { salt: string; deblindedPassword: string; version: number };
  }
}
