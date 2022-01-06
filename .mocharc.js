module.exports = {
  // TODO: Remove the `exit` setting, it can hide broken tests.
  exit: true,
  ignore: [
    './src/scripts/lib/**/*.test.js',
    './src/scripts/migrations/*.test.js',
    './src/scripts/platforms/*.test.js',
    './src/scripts/controllers/network/**/*.test.js',
    './src/scripts/controllers/permissions/*.test.js',
  ],
  recursive: true,
  require: ['./src/test/env.js', './src/test/setup.js'],
};
