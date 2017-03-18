import fs from 'fs'
import path from 'path'
import prompt from 'prompt'

const cwd = process.cwd()

const validHTTPMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const defaultSrc = `
/**
 * Enter a description.
 */
export default async (ctx) => {
  // Function code goes here
}
`
export default (name) => {
  Promise.resolve(new Promise(async (resolve, reject) => {
    try {
      const opts = await getOpts()

      // Make sure the method is valid
      const method = opts.method.toUpperCase()
      if (!validHTTPMethods.includes(method)) {
        console.log('\nInvalid HTTP method. Must be one of', validHTTPMethods)
        return
      }
      opts.method = method

      const dir = path.join(cwd, 'functions', name)
      fs.mkdirSync(dir)
      fs.writeFileSync(path.join(dir, 'index.js'), defaultSrc)
      fs.writeFileSync(path.join(dir, 'function.json'),
        JSON.stringify(opts, null, 2))

      console.log(`\n'${name}' created.\n`)
    } catch (e) {
      console.log(e)
    }
  }))
}

async function getOpts () {
  prompt.message = ''
  prompt.colors = false

  // TODO: validate method
  const args = [
    {
      name: 'method',
      description: 'Enter the function\'s method',
      type: 'string',
      required: true
    },
    {
      name: 'path',
      description: 'Enter the function\'s path',
      type: 'string',
      required: true
    }
  ]

  prompt.start()

  console.log() // Print an empty new line

  const p = new Promise((resolve, reject) => {
    prompt.get(args, function (err, result) {
      if (err) reject(err)
      else resolve(result)
    })
  })

  return await p
}
