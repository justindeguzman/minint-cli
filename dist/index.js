'use strict';

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var opts = (0, _minimist2.default)(process.argv.slice(2));
var tokens = opts._;

var executedCommand = false;

if (opts.version) {
  executedCommand = true;
  console.log('v' + _package2.default.version);
} else if (opts.help) {
  executedCommand = true;
  printHelp();
} else if (tokens[0] && tokens.length === 1) {
  var cmd = tokens[0];
  if (cmd === 'start') {
    executedCommand = true;
    require('./start');
  }
} else if (tokens[0] && tokens[1]) {
  var _cmd = tokens[0] + '-' + tokens[1];
  var name = tokens[2];
  if (_cmd === 'create-function' || _cmd === 'create-authorizer') {
    executedCommand = true;
    if (!name) {
      console.log('\nError: Name required.\n');
      printHelp();
    } else {
      require('./' + _cmd).default(name);
    }
  }
}

if (!executedCommand) {
  console.log('\nCommand not found.\n');
  printHelp();
}

function printHelp() {
  console.log('minint-cli v' + _package2.default.version);
  console.log('\nUsage: minint [options] [command]');
  console.log('\nOptions:');
  console.log('  --version\t\t\tprints the current version');
  console.log('  --help\t\t\tprints the help message');
  console.log('\nCommands:');
  console.log('  start\t\t\t\tstarts the local server');
  console.log('  init\t\t\t\tinitializes a microservice');
  console.log('  create function [name]\tcreates a new function');
  console.log('  create authorizer [name]\tcreates a new authorizer');
  console.log();
}