var webpack = require("webpack");
var path = require('path');
var babelPolyfill = require('babel-polyfill');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var IS_PROD = process.argv.indexOf('--production') >= 0;
var IS_TEST = process.argv.indexOf('--test') >= 0;

/**
 * Utility Functions
 */
Date.prototype.timeNow = function() {
  var hours = this.getHours();
  var ampm = (hours >= 12 ? 'PM' : 'AM');
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return ((hours < 10) ? "0" : "") + hours + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds() + " " + ampm;
};

/**
 * Variables
 */
var definePluginConstants = {
  __DEV__: !IS_PROD,
  __TEST__: IS_TEST,
  __VERSION__: JSON.stringify(require("./package.json").sdkVersion),
};

if (IS_PROD) {
  definePluginConstants['process.env.NODE_ENV'] = JSON.stringify('production');
}

var recompileFunction = function() {
  this.plugin('watch-run', function(watching, callback) {
    console.log();
    console.log('Recompiling assets starting ' + new Date()
            .timeNow() + "...");
    callback();
  })
};

const ONESIGNAL_WEB_SDK = {
  name: 'OneSignalSDK',
  target: 'web',
  entry: './src/entry.ts',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'OneSignalSDK.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"]
  },
  module: {
    loaders: [{
      test: /\.(t|j)sx?$/,
      include: [path.resolve(__dirname, "./src")],
      exclude: /(node_modules|bower_components|test)/,
      loader: 'awesome-typescript-loader'
    },
      {
        test: /\.scss$/,
        loaders: IS_PROD ? ["style", "css", "autoprefixer-loader", "sass"] : ["style", "css", "autoprefixer-loader", "sass"]
      }]
  },
  sassLoader: {
    includePaths: [path.resolve(__dirname, "./src")]
  },
  debug: !IS_PROD,
  plugins: [
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        sequences: false,
        dead_code: false,
        conditionals: false,
        booleans: false,
        unused: false,
        if_return: false,
        join_vars: false,
        drop_console: false,
        drop_debugger: false,
        warnings: false,
      },
      mangle: IS_PROD,
      output: {
        comments: false
      }
    }),
    new webpack.DefinePlugin(definePluginConstants),
    recompileFunction
  ]
};

const ONESIGNAL_WEB_SDK_UNIT_TESTS = {
  name: 'OneSignalSDKTests',
  target: 'node',
  entry: ['./test/unit/entry.ts'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'unit-tests.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"]
  },
  module: {
    loaders: [{
      test: /\.(t|j)sx?$/,
      loader: 'awesome-typescript-loader',
      include: [
          path.resolve(__dirname, "./src"),
          path.resolve(__dirname, "./test/unit"),
      ],
      exclude: /(node_modules|bower_components|test\/server)/
    }, {
      test: /(\.html$)|(LICENSE)/,
      loader: 'ignore-loader'
    }]
  },
  debug: true,
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin(definePluginConstants),
    recompileFunction
  ]
};

const ONESIGNAL_WEB_SDK_INTEGRATION_TESTS = {
    name: 'OneSignalSDKTests',
    target: 'node',
    entry: ['./test/integration/entry.ts'],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'integration-tests.js'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ["", ".ts", ".tsx", ".js"]
    },
    module: {
        loaders: [{
            test: /\.(t|j)sx?$/,
            loader: 'awesome-typescript-loader',
            include: [
                path.resolve(__dirname, "./src"),
                path.resolve(__dirname, "./test/integration"),
            ],
            exclude: /(node_modules|bower_components|test\/server)/
        }, {
            test: /(\.html$)|(LICENSE)/,
            loader: 'ignore-loader'
        }]
    },
    debug: true,
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin(definePluginConstants),
        recompileFunction
    ]
};

const ONESIGNAL_WEB_SDK_INTEGRATION_TEST_SERVER = {
    name: 'OneSignalSDKTestServer',
    target: 'node',
    entry: './test/integration-server/entry.ts',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'integration-test-server.js'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ["", ".ts", ".tsx", ".js"]
    },
    module: {
        loaders: [{
            test: /\.(t|j)sx?$/,
            loader: 'awesome-typescript-loader',
            include: [
                path.resolve(__dirname, "./src"),
                path.resolve(__dirname, "./test/integration-server"),
            ]
        }, {
            test: /(\.html$)|(LICENSE)|(coffee)|(\.woff)|(\.css)|(\.md)/,
            loader: 'ignore-loader'
        },
        {
            test: /\.json$/,
            loader: "json-loader"
        }]
    },
    debug: !IS_PROD,
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin(definePluginConstants),
        recompileFunction
    ]
};

var exports = [ONESIGNAL_WEB_SDK];

if (IS_TEST) {
  exports.push(ONESIGNAL_WEB_SDK_UNIT_TESTS);
  //exports.push(ONESIGNAL_WEB_SDK_INTEGRATION_TESTS);
  exports.push(ONESIGNAL_WEB_SDK_INTEGRATION_TEST_SERVER);
}

module.exports = exports;