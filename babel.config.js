module.exports = function (api) {
  api.cache(false);
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['chrome >= 66', 'firefox >= 68'],
          },
          loose: true,
          shippedProposals: true,
        },
      ],
      '@babel/preset-react',
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      ['@babel/plugin-proposal-class-properties',{loose: true}],
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
    ],
  };
};
