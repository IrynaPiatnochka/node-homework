# Node.js Fundamentals

## What is Node.js?
Node.js is a JavaScript runtime environment that allows JavaScript to run outside the browser, such as on a server or local machine. It is built on Google’s V8 engine and provides access to system-level features like file system operations, networking, and environment variables.

## How does Node.js differ from running JavaScript in the browser?
Browser JavaScript runs in a sandbox and mainly interacts with the DOM (window, document, web pages). Node.js runs outside the browser and does not have a DOM. Instead, it provides system-level APIs such as file system access and networking. Browser JavaScript is used for frontend development, while Node.js is used for backend and server-side development.

## What is the V8 engine, and how does Node use it?
The V8 engine is Google’s high-performance JavaScript engine that compiles JavaScript into machine code. Node.js uses V8 to execute JavaScript efficiently outside the browser and extends it with additional APIs for server-side functionality.

## What are some key use cases for Node.js?
Node.js is commonly used for building web servers and APIs, real-time applications like chat apps, command-line tools, backend services, and file system automation scripts.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
CommonJS is the traditional module system used in Node.js. It loads modules using require() and exports them using module.exports. It is synchronous and commonly used in Node.js projects.

**CommonJS (default in Node.js):**
```js
// math.js
// Export a function so other files can use it
function add(a, b) {
  return a + b;
}

module.exports = { add };

// app.js (this is an example file showing how CommonJS imports work)

// Import the function from math.js
const { add } = require('./math');

// Use the imported function
console.log(add(2, 3));
```

**ES Modules (supported in modern Node.js):**
```js
// math.js (ES Module version)

// Export a function so other files can use it
export function add(a, b) {
  return a + b;
}

// app.js (ES Module usage example)

// Import the function from math.js
import { add } from './math.js';

// Use the imported function
console.log(add(2, 3));
``` 