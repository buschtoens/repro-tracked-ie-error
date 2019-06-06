'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    babel: {
      plugins: [
        [
          require.resolve('./lib/babel-plugin-force-eager-initialization'),
          {
            imports: { '@glimmer/tracking': ['tracked'] },
            globals: ['Ember._tracked']
          }
        ]
      ]
    },

    'ember-cli-babel': {
      // This ensures that we don't actually write any non-parallelizable
      // transforms.
      // @see https://github.com/babel/ember-cli-babel#parallel-builds
      throwUnlessParallelizable: true,

      // This includes the "broken" `Symbol` polyfill.
      // @see https://github.com/emberjs/ember.js/issues/18075#issuecomment-499549008
      includePolyfill: true
    }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
