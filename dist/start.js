'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var apiAuthorizer = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(ctx) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!ctx.headers['x-api-key']) {
              _context3.next = 3;
              break;
            }

            ctx.status = 200;
            return _context3.abrupt('return');

          case 3:

            ctx.status = 403;
            ctx.body = { message: 'Forbidden' };

          case 5:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function apiAuthorizer(_x5) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Removes trailing slashes from a string.
 * @param {string} str - The string to edit.
 * @returns The input string without a trailing slash.
 */


var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _koaBodyparser = require('koa-bodyparser');

var _koaBodyparser2 = _interopRequireDefault(_koaBodyparser);

var _validator = require('validator');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _koaCors = require('koa-cors');

var _koaCors2 = _interopRequireDefault(_koaCors);

var _koaConvert = require('koa-convert');

var _koaConvert2 = _interopRequireDefault(_koaConvert);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _serverDestroy = require('server-destroy');

var _serverDestroy2 = _interopRequireDefault(_serverDestroy);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _cliTable = require('cli-table2');

var _cliTable2 = _interopRequireDefault(_cliTable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

main();

function main() {
  var functionDir = process.cwd();

  // Apply environment variables
  _dotenv2.default.config(functionDir);

  // Copy the functions to a temporary directory so we can run them
  var dirs = functionDir.split('/');
  var repoDir = dirs[dirs.length - 1];
  var tmp = _path2.default.resolve(__dirname, '../tmp/' + repoDir);
  _fsExtra2.default.removeSync(tmp);
  _fsExtra2.default.copySync(functionDir, tmp);

  var babel = _path2.default.resolve(__dirname, '../node_modules/babel-cli/bin/babel.js').replace(/ /g, '\\ ');
  var flags = '--ignore /node_modules/,/test/ --out-dir ';
  (0, _child_process.execSync)(babel + ' ' + functionDir.replace(/ /g, '\\ ') + ' ' + flags + ' ' + tmp.replace(/ /g, '\\ '));

  // Get service info
  var service = getService(tmp);
  if (!service) {
    console.log('No \'service.json\' found. You may need to run \'minint init\'.');
    return;
  }
  var basePath = service.path;

  // Get functions info
  var functions = getAllFunctions(tmp);

  // Get authorizers
  var authorizers = getAllAuthorizers(tmp);

  // Register the route handlers
  var router = createRouter(basePath, functions, authorizers);

  // Start the server
  var port = process.env.PORT || 3000;
  var server = createServer(router, port);
  (0, _serverDestroy2.default)(server);
  console.log('\nStarted server at', port);

  // Listen for file changes and restart the server if one occurs
  addWatcher(server);
}

/**
 * Adds a watcher that will restart the server on file changes.
 */
function addWatcher(server) {
  // Add a watcher to that will restart the server on file changes
  var watcher = _chokidar2.default.watch(process.cwd(), { ignored: [/^\./, '**/test/**', '**/coverage/**', '**/*.log'],
    persistent: true });

  watcher.on('change', function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(event, path) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              Object.keys(require.cache).forEach(function (key) {
                delete require.cache[key];
              });

              watcher.close();
              console.log('A file was changed. Restarting server...\n');

              server.destroy(function () {
                main();
              });

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
}

/**
 * Creates a server that will allow local development of FaaS functions.
 */
function createServer(router, port) {
  var app = new _koa2.default();
  app.use((0, _koaConvert2.default)((0, _koaCors2.default)({ origin: '*' })));
  app.use((0, _koaBodyparser2.default)());
  app.use(router.routes());
  app.use(router.allowedMethods());
  return _http2.default.createServer(app.callback()).listen(port);
}

/**
 * Creates the router used by the server.
 * @returns {Object} The service configuration.
 */
function createRouter(basePath, functions, authorizers) {
  var router = new _koaRouter2.default();

  var parameterizedRoutes = [];
  var staticRoutes = [];

  _lodash2.default.each(functions, function (func) {
    // Make sure the endpoint method exists and is properly formatted
    if ((0, _validator.isEmpty)(func.method)) {
      throw new Error('Function method must be defined for ' + func.name);
    }
    var method = formatMethod(func.method);

    // Make sure the path exists and is properly formatted
    if ((0, _validator.isEmpty)(func.path)) {
      throw new Error('Function path must be defined for ' + func.path);
    }
    var path = formatPath(basePath, func.path);

    var route = { name: func.name, method: method, path: path, src: func.codePath, authorizer: func.authorizer };

    if (path.includes(':')) {
      parameterizedRoutes.push(route);
    } else {
      staticRoutes.push(route);
    }
  });

  // We wrap the authorizer to mimic AWS Lambda's authorizers, but allow it
  // to function like a Koa handler
  function wrapAuthorizer(authorizer) {
    return function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(ctx, next) {
        var firstDigit;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return authorizer(ctx);

              case 2:
                firstDigit = String(ctx.status).charAt(0);

                if (!(firstDigit === '2')) {
                  _context2.next = 7;
                  break;
                }

                // Change it back to 200 because it's the default response.
                // We basically disregard the status code of the authorizer if it succeeded.
                ctx.status = 200;
                _context2.next = 7;
                return next();

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function (_x3, _x4) {
        return _ref2.apply(this, arguments);
      };
    }();
  }

  // The table containing the routes to print
  var table = new _cliTable2.default({});
  table.push(['Method', 'Path']);

  function mountPath(opts) {
    table.push([opts.method.toUpperCase(), opts.path]);
    var fn = require(opts.src).default;

    var authorizer = determineAuthorizer({ selectedAuthorizer: opts.authorizer, authorizers: authorizers });
    if (authorizer) {
      router[opts.method](opts.path, wrapAuthorizer(authorizer), fn);
    } else {
      router[opts.method](opts.path, fn);
    }
  }

  staticRoutes.forEach(mountPath);
  parameterizedRoutes.forEach(mountPath);

  console.log(table.toString());

  return router;
}

function determineAuthorizer(_ref3) {
  var selectedAuthorizer = _ref3.selectedAuthorizer,
      authorizers = _ref3.authorizers;

  if (!selectedAuthorizer || selectedAuthorizer === 'API_KEY') {
    return apiAuthorizer;
  } else if (selectedAuthorizer === 'NONE') {
    return null;
  } else {
    return require(authorizers[selectedAuthorizer]).default;
  }
}

function removeTrailingSlashes(str) {
  return str.replace(/\/+$/, '');
}

/**
 * Formats the method so that it can be recognized by koa-router.
 * @param {String} method - The name of the method.
 * @returns {String} The properly formatted method.
 */
function formatMethod(method) {
  var parseMethod = method.trim().toLowerCase();
  return parseMethod === 'delete' ? 'del' : parseMethod;
}

/**
 * Formats the path so that it is properly handled by koa-router.
 */
function formatPath(basePath, path) {
  var formattedPath = removeTrailingSlashes(path.trim());
  return '' + removeTrailingSlashes(basePath) + formattedPath;
}

/**
 * Returns the service.json file in the current directory.
 * @param {String} dir - The directory of the service.
 * @returns {Object} The service configuration.
 */
function getService(dir) {
  try {
    var file = _path2.default.resolve(dir, 'service.json');
    return JSON.parse(_fs2.default.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * Returns an array of functions.
 * @param {String} dir - The directory of the service.
 * @param {Object} service - The configuration object of the service.
 * @returns {Object[]} An array of functions.
 */
function getAllFunctions(dir, service) {
  // Determine our functions
  var baseDir = _path2.default.resolve(dir, 'functions');
  var functionDirs = {};
  _lodash2.default.each(_fs2.default.readdirSync(baseDir), function (file) {
    var currentPath = _path2.default.join(baseDir, file);
    if (_fs2.default.statSync(currentPath).isDirectory()) {
      functionDirs[file] = currentPath;
    }
  });

  // Return all the functions after we've read their configurations
  return _lodash2.default.map(Object.keys(functionDirs), function (name) {
    var currentPath = functionDirs[name];

    // Determine the code path
    var codePath = _path2.default.join(currentPath, 'index.js');

    // Read in the function config
    var functionJSONPath = _path2.default.join(currentPath, 'function.json');
    var functionJSON = JSON.parse(_fs2.default.readFileSync(functionJSONPath, 'utf8'));

    // Return an individual function
    return _extends({ name: name }, functionJSON, { codePath: codePath });
  });
}

/**
 * Returns an array of authorizers.
 * @param {String} dir - The directory of the service.
 * @returns {Object[]} An array of authorizers.
 */
function getAllAuthorizers(dir) {
  // Determine our authorizers
  var baseDir = _path2.default.resolve(dir, 'authorizers');

  if (!_fs2.default.existsSync(baseDir)) {
    return;
  }

  var functionDirs = {};
  _lodash2.default.each(_fs2.default.readdirSync(baseDir), function (file) {
    var currentPath = _path2.default.join(baseDir, file);
    if (_fs2.default.statSync(currentPath).isDirectory()) {
      functionDirs[file] = currentPath;
    }
  });

  var authorizers = {};

  Object.keys(functionDirs).forEach(function (name) {
    var currentPath = functionDirs[name];

    // Determine the code path
    var codePath = _path2.default.join(currentPath, 'index.js');

    authorizers[name] = codePath;
  });

  return authorizers;
}