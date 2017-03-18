import fs from 'fs'
import path from 'path'

const cwd = process.cwd()

const defaultSrc = `
/**
 * Enter a description.
 */
export default async (ctx) => {
  // Authorizer code goes here
}
`
export default (name) => {
  Promise.resolve(new Promise(async (resolve, reject) => {
    try {
      const rootDir = path.join(cwd, 'authorizers')
      if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir)
      }

      const dir = path.join(rootDir, name)
      fs.mkdirSync(dir)
      fs.writeFileSync(path.join(dir, 'index.js'), defaultSrc)

      console.log(`\n'${name}' created.\n`)
    } catch (e) {
      console.log(e)
    }
  }))
}
