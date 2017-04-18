'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var getOpts = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var args, p;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _prompt2.default.message = '';
            _prompt2.default.colors = false;

            // TODO: validate method
            args = [{
              name: 'method',
              description: 'Enter the function\'s method',
              type: 'string',
              required: true
            }, {
              name: 'path',
              description: 'Enter the function\'s path',
              type: 'string',
              required: true
            }];


            _prompt2.default.start();

            console.log(); // Print an empty new line

            p = new Promise(function (resolve, reject) {
              _prompt2.default.get(args, function (err, result) {
                if (err) reject(err);else resolve(result);
              });
            });
            _context2.next = 8;
            return p;

          case 8:
            return _context2.abrupt('return', _context2.sent);

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getOpts() {
    return _ref2.apply(this, arguments);
  };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var cwd = process.cwd();

var validHTTPMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

var defaultSrc = '\n/**\n * Enter a description.\n */\nexport default async (ctx) => {\n  // Function code goes here\n}\n';

exports.default = function (name) {
  Promise.resolve(new Promise(function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(resolve, reject) {
      var opts, method, dir;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return getOpts();

            case 3:
              opts = _context.sent;


              // Make sure the method is valid
              method = opts.method.toUpperCase();

              if (validHTTPMethods.includes(method)) {
                _context.next = 8;
                break;
              }

              console.log('\nInvalid HTTP method. Must be one of', validHTTPMethods);
              return _context.abrupt('return');

            case 8:
              opts.method = method;

              dir = _path2.default.join(cwd, 'functions', name);

              _fs2.default.mkdirSync(dir);
              _fs2.default.writeFileSync(_path2.default.join(dir, 'index.js'), defaultSrc);
              _fs2.default.writeFileSync(_path2.default.join(dir, 'function.json'), JSON.stringify(opts, null, 2));

              console.log('\n\'' + name + '\' created.\n');
              _context.next = 19;
              break;

            case 16:
              _context.prev = 16;
              _context.t0 = _context['catch'](0);

              console.log(_context.t0);

            case 19:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined, [[0, 16]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }()));
};