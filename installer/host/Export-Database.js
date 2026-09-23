'use strict';

const path = require('path');

const [, , appRoot, sourcePath, destinationPath] = process.argv;
if (!appRoot || !sourcePath || !destinationPath) {
  console.error('Usage: node Export-Database.js <app-root> <source-db> <destination-db>');
  process.exit(2);
}

const Database = require(path.join(appRoot, 'node_modules', 'better-sqlite3'));
const source = new Database(sourcePath, { readonly: true, fileMustExist: true });

source.backup(destinationPath)
  .then(() => {
    source.close();
    console.log(`Exported campaign database to ${destinationPath}`);
  })
  .catch(error => {
    source.close();
    console.error(error.stack || error);
    process.exitCode = 1;
  });
