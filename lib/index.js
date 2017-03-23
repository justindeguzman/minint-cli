import minimist from 'minimist'
import packageJSON from '../package.json'

const opts = minimist(process.argv.slice(2))
const tokens = opts._

let executedCommand = false

if (opts.version) {
  executedCommand = true
  console.log(`v${packageJSON.version}`)
} else if (opts.help) {
  executedCommand = true
  printHelp()
} else if (tokens[0] && tokens.length === 1) {
  const cmd = tokens[0]
  if (cmd === 'start') {
    executedCommand = true
    require('./start')
  }
} else if (tokens[0] && tokens[1]) {
  const cmd = `${tokens[0]}-${tokens[1]}`
  const name = tokens[2]
  if (cmd === 'create-function' || cmd === 'create-authorizer') {
    executedCommand = true
    if (!name) {
      console.log('\nError: Name required.\n')
      printHelp()
    } else {
      require(`./${cmd}`).default(name)
    }
  }
}

if (!executedCommand) {
  console.log('\nCommand not found.')
  printHelp()
}

function printHelp () {
  console.log(`minint-cli v${packageJSON.version}`)
  console.log('\nUsage: minint [options] [command]')
  console.log('\nOptions:')
  console.log('  --version\t\t\tprints the current version')
  console.log('  --help\t\t\tprints the help message')
  console.log('\nCommands:')
  console.log('  start\t\t\t\tstarts the local server')
  console.log('  init\t\t\t\tinitializes a microservice')
  console.log('  create function [name]\tcreates a new function')
  console.log('  create authorizer [name]\tcreates a new authorizer')
  console.log()
}
