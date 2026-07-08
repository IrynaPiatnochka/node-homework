const os = require('os');
const path = require('path');
const fs = require('fs');

// OS module
console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());


// Path module
const joinedPath = path.join(__dirname, 'sample-files', 'file.txt');
console.log('Joined path:', joinedPath);

// fs.promises API
const fsPromises = fs.promises;

async function runFsPromises() {
  await fsPromises.writeFile(
    path.join(__dirname, 'sample-files', 'demo.txt'),
    'Hello from fs.promises!'
  );

  const data = await fsPromises.readFile(
    path.join(__dirname, 'sample-files', 'demo.txt'),
    'utf8'
  );

  console.log('fs.promises read:', data);
}

runFsPromises();

// Create large file
const largeFilePath = path.join(__dirname, 'sample-files', 'largefile.txt');

let content = '';
for (let i = 1; i <= 100; i++) {
  content += `Line ${i}: This is a line in a large file.\n`;
}

fs.writeFileSync(largeFilePath, content);

// Streams for large files- log first 40 chars of each chunk
const stream = fs.createReadStream(largeFilePath, {
  encoding: 'utf8',
  highWaterMark: 1024
});

stream.on('data', (chunk) => {
  console.log('Read chunk:', chunk.slice(0, 40));
});

stream.on('end', () => {
  console.log('Finished reading large file with streams.');
});