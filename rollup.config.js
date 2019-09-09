const path = require('path');

const typescript = require('rollup-plugin-typescript2');

const packageJson = require('./package.json');

const FORMAT = {
  CJS: 'cjs',
  ES: 'es',
};

const dependencies = Object.keys(packageJson.dependencies);
const peerDependencies = Object.keys(packageJson.peerDependency);

const createEntry = format => ({
  external: dependencies.concat(peerDependencies),
  input: path.join(__dirname, 'src', 'index.ts'),
  output: {
    format,
    file: path.join(__dirname, 'dist', `passport-pythia.${format}.js`),
  },
  plugins: [
    typescript({
      exclude: '**/*.test.ts',
      useTsconfigDeclarationDir: true,
    }),
  ],
});

module.exports = Object.values(FORMAT).map(createEntry);
