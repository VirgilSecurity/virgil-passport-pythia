import { Request } from 'express';
import { Strategy } from 'passport-strategy';
import { BreachProofPassword, Pythia } from 'virgil-pythia';

export interface AuthenticationParams {
  user: any;
  salt: Buffer | string;
  deblindedPassword: Buffer | string;
  version: number;
  password: string;
}

type GetAuthenticationParamsFunction = (
  request: Request,
  getAuthenticationParams: (
    error?: Error | null,
    authenticationParams?: AuthenticationParams,
  ) => void,
) => void;

export default class PythiaStrategy extends Strategy {
  public name = 'pythia';

  private pythia: Pythia;
  private getAuthenticationParams: GetAuthenticationParamsFunction;

  constructor(pythia: Pythia, getAuthenticationParams: GetAuthenticationParamsFunction) {
    super();
    this.pythia = pythia;
    this.getAuthenticationParams = getAuthenticationParams;
  }

  authenticate(request: Request, options?: { includeProof?: boolean }) {
    this.getAuthenticationParams(request, (error, authenticationParams) => {
      if (error) {
        return this.fail(error, 400);
      }
      if (!PythiaStrategy.isAuthenticationParamsValid(authenticationParams)) {
        return this.fail('Invalid authentication parameters.', 400);
      }
      const { user, salt, deblindedPassword, version, password } = authenticationParams!;
      const myOptions = options || {};
      const { includeProof } = myOptions;
      const breachProofPassword = new BreachProofPassword(salt, deblindedPassword, version);
      this.pythia
        .verifyBreachProofPassword(password, breachProofPassword, includeProof || false)
        .then(verified => {
          if (verified) {
            return this.success(user);
          }
          this.fail('Invalid password.', 400);
        })
        .catch(error => {
          this.error(error);
        });
    });
  }

  private static isBufferOrString(value: any): boolean {
    return typeof value === 'string' || Buffer.isBuffer(value);
  }

  private static isAuthenticationParamsValid(authenticationParams: any): boolean {
    if (
      authenticationParams &&
      authenticationParams.user &&
      PythiaStrategy.isBufferOrString(authenticationParams.salt) &&
      PythiaStrategy.isBufferOrString(authenticationParams.deblindedPassword) &&
      typeof authenticationParams.version === 'number' &&
      typeof authenticationParams.password === 'string'
    ) {
      return true;
    }
    return false;
  }
}
