'use strict';

const path = require('path');

const appRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(appRoot, '..', '..');

module.exports = {
  appRoot,
  projectRoot,
  webRoot: path.join(appRoot, 'web'),
  storageRoot: path.join(appRoot, 'storage'),
  catalogDataRoot: path.join(projectRoot, 'data', 'catalog'),
  referenceRoot: path.join(projectRoot, 'reference'),
  systemsDataFile: path.join(appRoot, 'web', 'map', 'data', 'systems.json'),
};
