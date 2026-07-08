const fs = require('fs');
const path = require('path');


const filePath = path.join(__dirname, 'sample-files', 'sample.txt');


// Write a sample file for demonstration
fs.writeFileSync(filePath, 'Hello, async world!');

/*
Callback hell example:

fs.readFile(filePath, 'utf8', (err, data) => {
  if (!err) {
    fs.readFile(filePath, 'utf8', (err2, data2) => {
      if (!err2) {
        fs.readFile(filePath, 'utf8', (err3, data3) => {
          console.log("Deep nesting:", data3);
        });
      }
    });
  }
});
*/

// 1. Callback style
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) return console.error(err);
  console.log('Callback read:', data);
});

// 2. Promise style
const fsPromises = fs.promises;

fsPromises.readFile(filePath, 'utf8')
  .then((data) => {
    console.log('Promise read:', data);
  })
  .catch(console.error);


// 3. Async/Await style
async function readFileAsync() {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    console.log('Async/Await read:', data);
  } catch (err) {
    console.error(err);
  }
}

readFileAsync();