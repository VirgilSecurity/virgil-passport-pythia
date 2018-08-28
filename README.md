# @virgilsecurity/passport-pythia

[Passport](http://www.passportjs.org/) strategy for authenticating with the Virgil [Pythia PRF](https://eprint.iacr.org/2015/644.pdf) service.

This module lets you aithenticate using a username and password while protecting the passwords cryptographically using the Pythia PRF service. We'll refer to passwords protected with the Pythia PRF service as [Breach-Proof Password](https://developer.virgilsecurity.com/docs/go/use-cases/v1/breach-proof-password).

By plugging into Passport, Breach-Proof Password support can be easily and unobtrusively
integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Pre-requisites

* Create a free [Virgil Security](https://dashboard.virgilsecurity.com/) account.
* Create a **Breach-Proof Password Storage** app in the Virgil Security [Dashboard](https://dashboard.virgilsecurity.com/apps/new).
* Create an **API Key** in the Virgil Security [Dashboard](https://dashboard.virgilsecurity.com/api-keys).

## Install

```sh
npm install @virgilsecurity/passport-pythia
```

This module depends on `virgil-pythia` (which itself depends on `virgil-crypto`) module to be installed to be able to communicate with the Virgil Pythia PRF service and perform the cryptographic operations necessary to verify the passwords. Make sure you have both `virgil-pythia` and `virgil-crypto` installed.

```sh
npm install virgil-crypto virgil-pythia
```

## Usage

### Configure strategy

The strategy requires two parameters. The first is an instance of `Pythia` class from the `virgil-pythia` module. The second is a `getAuthenticationParams` callback, which is responsible for retrieving the breach-proof password parameters of the user making the request. It accepts the `request` object and a callback to be called with an error as a first argument, if any, and the breach-proof password parameters as the second argument.

```javascript
passport.use(new PythiaStrategy(
    virgilPythia, 
    (request, cb) => {
        User.findOne({ username: request.body.username }, (err, user) => {
            if (err) return cb(err);
            if (!user) return cb(new Error('Invalid username'));
            cb(null, {
                user,
                password: request.body.password,
                salt: user.bppSalt,
                deblindedPassword: user.bppDeblindedPassword,
                version: user.bppVersion
            });
        });
    }
));
```

### Authenticate Requests

Use `passport.authenticate()`, specifying the `'pythia'` strategy, to authenticate requests.
For example, as route middleware in an Express application:

```javascript
app.post(
  '/sign-in',
  passport.authenticate('pythia', {
    successRedirect: '/profile',
    failureRedirect: '/sign-in',
  }),
);
```

## Examples

Developers using the [Express](http://expressjs.com/) web framework can refer to an [example](./example) as a starting point for their own web applications.

## Tests

To run this example on your computer, clone this repository and install dependencies.

```sh
git clone https://github.com/VirgilSecurity/passport-pythia.git
cd passport-pythia
npm install
```

Create a new file named `.env` with the contents of `.env.example`

```sh
cp .env.example .env
```

Open the `.env` file in a text editor and replace the values starting with `[YOUR_VIRGIL_...` with the corresponding values from your Virgil Dashboard.

Run the tests.

```
npm test
```

## License

[The 3-Clause BSD License](https://opensource.org/licenses/BSD-3-Clause)