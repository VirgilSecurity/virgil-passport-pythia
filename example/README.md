This example demonstrates how to use [Express](http://expressjs.com/) and [Passport](http://www.passportjs.org/) to authenticate users using a username and password while storing the passwords in a cryptographically protected breach-proof way. Use this example as a starting point for your own web applications.

## Pre-requisites

* Create a free [Virgil Security](https://dashboard.virgilsecurity.com/) account.
* Create a **Breach-Proof Password Storage** app in the Virgil Security [Dashboard](https://dashboard.virgilsecurity.com/apps/new).
* Create an **API Key** in the Virgil Security [Dashboard](https://dashboard.virgilsecurity.com/api-keys).

## Instructions

To run this example on your computer, clone this repository and install dependencies.

```sh
git clone https://github.com/VirgilSecurity/virgil-passport-pythia.git
cd passport-pythia
npm install
```

This will also transpile TypeScript in `/src` into JavaScript that can be used by the example.

Next, `cd` into the `example` folder and install dependencies there.

```sh
cd example
npm install
```

Create a new file named `.env` with the contents of `.env.example`

```sh
cp .env.example .env
```

Open the `.env` file in a text editor and replace the values starting with `[YOUR_VIRGIL_...` with the corresponding values from your Virgil Dashboard.

Start the server.

```sh
npm start
```

Open a web browser and navigate to http://localhost:3000/ to see the example in action. Sign up with any username and password to create a user record. And then Sign in with that username and password.
