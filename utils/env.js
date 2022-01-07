// tiny wrapper with default env vars
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  ASSET_PATH: process.env.ASSET_PATH || 'src/assets',
  IN_TEST: process.env.IN_TEST || false,
};
