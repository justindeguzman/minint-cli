import fs from 'fs'
import Koa from 'koa'
import KoaRouter from 'koa-router'
import bodyParser from 'koa-bodyparser'
import {isEmpty} from 'validator'
import fsExtra from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import chokidar from 'chokidar'
import cors from 'koa-cors'
import convert from 'koa-convert'
import http from 'http'
import enableDestroy from 'server-destroy'
import dotenv from 'dotenv'
import Table from 'cli-table2'

main()

function main () {
  const functionDir = process.cwd()

  // Apply environment variables
  dotenv.config(functionDir)

  // Copy the functions to a temporary directory so we can run them
  const dirs = functionDir.split('/')
  const repoDir = dirs[dirs.length - 1]
  const tmp = path.resolve(__dirname, '../tmp/' + repoDir)
  fsExtra.removeSync(tmp)
  fsExtra.copySync(functionDir, tmp)

  // Get service info
  const service = getService(tmp)
  if (!service) {
    console.log(`No 'service.json' found. You may need to run 'minint init'.`)
    return
  }
  const basePath = service.path

  // Get functions info
  const functions = getAllFunctions(tmp)

  // Get authorizers
  const authorizers = getAllAuthorizers(tmp)

  // Register the route handlers
  const router = createRouter(basePath, functions, authorizers)

  // Start the server
  const port = process.env.PORT || 3000
  const server = createServer(router, port)
  enableDestroy(server)
  console.log('\nStarted server at', port)

  // Listen for file changes and restart the server if one occurs
  addWatcher(server)
}

/**
 * Adds a watcher that will restart the server on file changes.
 */
function addWatcher (server) {
  // Add a watcher to that will restart the server on file changes
  const watcher = chokidar.watch(process.cwd(),
    {ignored: [/^\./, '**/test/**', '**/coverage/**', '**/*.log'],
    persistent: true})

  watcher.on('change', async function (event, path) {
    Object.keys(require.cache).forEach(function (key) {
      delete require.cache[key]
    })

    watcher.close()
    console.log('A file was changed. Restarting server...\n')

    server.destroy(function () {
      main()
    })
  })
}

/**
 * Creates a server that will allow local development of FaaS functions.
 */
function createServer (router, port) {
  const app = new Koa()
  app.use(convert(cors({origin: '*'})))
  app.use(bodyParser())
  app.use(router.routes())
  app.use(router.allowedMethods())
  return http.createServer(app.callback()).listen(port)
}

/**
 * Creates the router used by the server.
 * @returns {Object} The service configuration.
 */
function createRouter (basePath, functions, authorizers) {
  const router = new KoaRouter()

  const parameterizedRoutes = []
  const staticRoutes = []

  _.each(functions, (func) => {
    // Make sure the endpoint method exists and is properly formatted
    if (isEmpty(func.method)) {
      throw new Error(`Function method must be defined for ${func.name}`)
    }
    const method = formatMethod(func.method)

    // Make sure the path exists and is properly formatted
    if (isEmpty(func.path)) {
      throw new Error(`Function path must be defined for ${func.path}`)
    }
    const path = formatPath(basePath, func.path)

    const route = {name: func.name, method, path, src: func.codePath, authorizer: func.authorizer}

    if (path.includes(':')) {
      parameterizedRoutes.push(route)
    } else {
      staticRoutes.push(route)
    }
  })

  // We wrap the authorizer to mimic AWS Lambda's authorizers, but allow it
  // to function like a Koa handler
  function wrapAuthorizer (authorizer) {
    return async function (ctx, next) {
      await authorizer(ctx)
      const firstDigit = String(ctx.status).charAt(0)
      if (firstDigit === '2') {
        // Change it back to 200 because it's the default response.
        // We basically disregard the status code of the authorizer if it succeeded.
        ctx.status = 200
        await next()
      }
    }
  }

  // The table containing the routes to print
  const table = new Table({})
  table.push(['Method', 'Path'])

  function mountPath (opts) {
    table.push([opts.method.toUpperCase(), opts.path])
    const fn = require(opts.src).default

    let authorizer =
      determineAuthorizer({selectedAuthorizer: opts.authorizer, authorizers})
    if (authorizer) {
      router[opts.method](opts.path, wrapAuthorizer(authorizer), fn)
    } else {
      router[opts.method](opts.path, fn)
    }
  }

  staticRoutes.forEach(mountPath)
  parameterizedRoutes.forEach(mountPath)

  console.log(table.toString())

  return router
}

function determineAuthorizer ({selectedAuthorizer, authorizers}) {
  if (!selectedAuthorizer || selectedAuthorizer === 'API_KEY') {
    return apiAuthorizer
  } else if (selectedAuthorizer === 'NONE') {
    return null
  } else {
    return require(authorizers[selectedAuthorizer]).default
  }
}

async function apiAuthorizer (ctx) {
  if (ctx.headers['x-api-key']) {
    ctx.status = 200
    return
  }

  ctx.status = 403
  ctx.body = {message: 'Forbidden'}
}

/**
 * Removes trailing slashes from a string.
 * @param {string} str - The string to edit.
 * @returns The input string without a trailing slash.
 */
function removeTrailingSlashes (str) {
  return str.replace(/\/+$/, '')
}

/**
 * Formats the method so that it can be recognized by koa-router.
 * @param {String} method - The name of the method.
 * @returns {String} The properly formatted method.
 */
function formatMethod (method) {
  const parseMethod = method.trim().toLowerCase()
  return parseMethod === 'delete' ? 'del' : parseMethod
}

/**
 * Formats the path so that it is properly handled by koa-router.
 */
function formatPath (basePath, path) {
  const formattedPath = removeTrailingSlashes(path.trim())
  return `${removeTrailingSlashes(basePath)}${formattedPath}`
}

/**
 * Returns the service.json file in the current directory.
 * @param {String} dir - The directory of the service.
 * @returns {Object} The service configuration.
 */
function getService (dir) {
  try {
    const file = path.resolve(dir, 'service.json')
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    return null
  }
}

/**
 * Returns an array of functions.
 * @param {String} dir - The directory of the service.
 * @param {Object} service - The configuration object of the service.
 * @returns {Object[]} An array of functions.
 */
function getAllFunctions (dir, service) {
  // Determine our functions
  const baseDir = path.resolve(dir, 'functions')
  const functionDirs = {}
  _.each(fs.readdirSync(baseDir), (file) => {
    const currentPath = path.join(baseDir, file)
    if (fs.statSync(currentPath).isDirectory()) {
      functionDirs[file] = currentPath
    }
  })

  // Return all the functions after we've read their configurations
  return _.map(Object.keys(functionDirs), (name) => {
    const currentPath = functionDirs[name]

    // Determine the code path
    const codePath = path.join(currentPath, 'index.js')

    // Read in the function config
    const functionJSONPath = path.join(currentPath, 'function.json')
    const functionJSON = JSON.parse(fs.readFileSync(functionJSONPath, 'utf8'))

    // Return an individual function
    return {name, ...functionJSON, codePath}
  })
}

/**
 * Returns an array of authorizers.
 * @param {String} dir - The directory of the service.
 * @returns {Object[]} An array of authorizers.
 */
function getAllAuthorizers (dir) {
  // Determine our authorizers
  const baseDir = path.resolve(dir, 'authorizers')

  if (!fs.existsSync(baseDir)) {
    return
  }

  const functionDirs = {}
  _.each(fs.readdirSync(baseDir), (file) => {
    const currentPath = path.join(baseDir, file)
    if (fs.statSync(currentPath).isDirectory()) {
      functionDirs[file] = currentPath
    }
  })

  const authorizers = {}

  Object.keys(functionDirs).forEach((name) => {
    const currentPath = functionDirs[name]

    // Determine the code path
    const codePath = path.join(currentPath, 'index.js')

    authorizers[name] = codePath
  })

  return authorizers
}
