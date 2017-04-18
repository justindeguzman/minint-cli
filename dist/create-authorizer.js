'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var cwd = process.cwd();

var defaultSrc = '\n/**\n * Enter a description.\n */\nexport default async (ctx) => {\n  // Authorizer code goes here\n}\n';

exports.default = function (name) {
  Promise.resolve(new Promise(function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(resolve, reject) {
      var rootDir, dir;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              try {
                rootDir = _path2.default.join(cwd, 'authorizers');

                if (!_fs2.default.existsSync(rootDir)) {
                  _fs2.default.mkdirSync(rootDir);
                }

                dir = _path2.default.join(rootDir, name);

                _fs2.default.mkdirSync(dir);
                _fs2.default.writeFileSync(_path2.default.join(dir, 'index.js'), defaultSrc);

                console.log('\n\'' + name + '\' created.\n');
              } catch (e) {
                console.log(e);
              }

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }()));
};