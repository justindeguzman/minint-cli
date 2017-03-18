# minint-cli

minint-cli allows you to easily test microservices built on top of AWS Lambda and API Gateway. See [minint.com](http://minint.com).

## Installation

`$ npm install -g minint`

## Usage

```
Usage: minint [command]

Commands:
  start                     starts the local server
  create function [name]    creates a new function
  create authorizer [name]  creates a new authorizer
````

## Commands

### start

Starts a local server to simulate AWS Lambda + API Gateway.

```
$ PORT=1234 minint start

┌────────┬────────────────────────────────┐
│ Method │ Path                           │
├────────┼────────────────────────────────┤
│ POST   │ /todos                         │
├────────┼────────────────────────────────┤
│ GET    │ /todos/:id                     │
├────────┼────────────────────────────────┤
│ DELETE │ /todos/:id			  │
└────────┴────────────────────────────────┘

Started server at 1234
```

### create function [name]

Creates a Lambda function mapped to an HTTP method and route.

```
$ minint create function create-todo

Enter the function's method: POST
Enter the function's path: /todos

'create-todo' created.
```

### create authorizer [name]

Creates an authorizer used to authorize access to an HTTP method and route.

```
$ minint create authorizer protect-todos

'protect-todos' created.
```

## Microservices

### Directory Structure

```
service-name/		Root level folder for the microservice
  package.json 

  service.json		Default settings for the microservice
 
  functions/		Contains all of the functions
    func-name/		A Lambda function with the name `func-name`
      index.js		Code for this Lambda function
      abc...xyz.js	Other code specific for `func-name`
      function.json	Specific settings for this Lambda function
  	
  authorizers/		Contains all of the authorizers
    my-authorizer/	An authorizer named `my-authorizer`
    index.js
  
  lib/			Contains code accessible by all of the Lambda functions and authorizers.
    index.js
    abc...xyz.js
  	
```

### Lambda Functions

Functions are modeled after Koa handlers and automatically support `async / await`. They are mapped to an HTTP method and route.

```js
import db from '../../lib'

/**
 * Creates a todo.
 *
 * @param {String} body.text - The todo text. 
 */
export default async function () {
  // Get the todo text from the request body
  const {text} = ctx.request.body

  // Save the todo in the database
  await db.todos.create({text})

  ctx.status = 200
  ctx.body = {message: 'Created todo'}
}
```

### service.json

Contains default settings for each Lambda function.

```
{
  "name": "todos",				The name of the microservice.
  "description": "Todos microservice.",		The description of the microservice.
  "runtime": "nodejs4.3",			Runtime for the microservice. Currently NodeJS only.
  "memory": 512,				Default memory for each Lambda function.
  "timeout": 10,				Default timeout for each Lambda function.
  "path": "/"					Base path for each route.
}
```

### function.json

Each Lambda is associated with its own `function.json`. Settings specified in `function.json` override `service.json`.

```
{
  "method": "GET",				The HTTP method for the Lambda function.
  "path": "/todos/:id",				The route for the Lambda function.
  "timeout": 3					The timeout in seconds for the function.
  "memory": 1024				The memory size of the function.  
  "authorizer": 'my-auth'			The authorizer for the Lambda function. It can be NONE,	
}  						API_KEY, or the name of an authorizer. If this field is
  						not specified, the default value is API_KEY.
```

### Authorizers

Authorizers control access to your Lambda functions. They look similar to the Lambda functions in the `functions/` folder but are located in the `authorizers/` folder. The status code returned by the authorizer determines if authorization is successful. Returning an error (4XX or 5XX status codes) will result in a failed authorization.

```js
import db from '../../lib'

/**
 * My very own authorizer.
 */
export default async function () {
  // The consumer of your microservice will pass a token in the Authorization HTTP header
  const {authorization} = ctx.headers
  
  if (authorization ==== 'mysecretapikey') {
    ctx.status = 200 // Authorization successful
  } else {
    ctx.status = 403 // Failed to authorize
  }
}

```

## Simulating AWS Lambda + API Gateway

First, start the server.

```
$ minint start

┌────────┬────────────────────────────────┐
│ Method │ Path                           │
├────────┼────────────────────────────────┤
│ POST   │ /todos                         │
├────────┼────────────────────────────────┤
│ GET    │ /todos/:id                     │
├────────┼────────────────────────────────┤
│ DELETE │ /todos/:id			  │
└────────┴────────────────────────────────┘

Started server at 3000
```

Once the server has started, we send an HTTP request to create a todo. 
```js
import request from 'request'

// Construct the options object that we'll be using for our HTTP request
const options = {
  method: 'POST',
  url: 'http://localhost:3000/todos',
	
  json: true,
  body: {text: 'My first todo'}

  // We must specify `x-api-key` when sending the request.
  // Because we are testing locally, `x-api-key` can be any value as long as it is defined.
  // You can change this by specifying an authorizer in function.json or setting it to 'NONE'.
  headers: {
    'x-api-key': 'myapikey'
  }
}
	
// Send the HTTP request
request(options, (err, response, body) => {
  const {message} = JSON.parse(body)
  console.log(message)
})
```
