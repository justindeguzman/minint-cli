import minimist from 'minimist'

const opts = minimist(process.argv.slice(2))
const tokens = opts._

let executedCommand = false
if (tokens[0] && tokens.length === 1) {
  const cmd = tokens[0]
  if (cmd === 'start') {
    executedCommand = true
    require('./start')
  } else if (cmd === '--help') {
    executedCommand = true
    printHelp()
  }
} else if (tokens[0] && tokens[1]) {
  const cmd = `${tokens[0]}-${tokens[1]}`
  const name = tokens[2]
  if (cmd === 'create-function' || cmd === 'create-authorizer') {
    executedCommand = true
    if (!name) {
      console.log('\nError: Name required.')
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
  console.log('minint-cli v1.0')
  console.log('\nUsage: minint [command]')
  console.log('\nCommands:')
  console.log('  start\t\t\t\tstarts the local server')
  console.log('  init\t\t\t\tinitializes a microservice')
  console.log('  create function [name]\tcreates a new function')
  console.log('  create authorizer [name]\tcreates a new authorizer')
  console.log()
}
