'use strict';

const path = require('path');
const os = require('os');
const crypto = require('crypto');
const express = require('express');
const store = require('./database/db');
const paths = require('./config/paths');
const createCatalogRouter = require('./modules/catalog/routes');
const createDocumentRouter = require('./modules/documents/routes');
const createFinanceRouter = require('./modules/finance/routes');
const createMechRouter = require('./modules/mechs/routes');
const createMissionRouter = require('./modules/missions/routes');
const createPilotRouter = require('./modules/pilots/routes');
const createStaffRouter = require('./modules/staff/routes');
const createTimeRouter = require('./modules/time/routes');
const createTravelRouter = require('./modules/travel/routes');

const app = express();
app.use(express.json());
app.use(express.static(paths.webRoot));
app.use('/reference', express.static(paths.referenceRoot));

const sseClients = new Set();
function broadcast(event, data) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const response of sseClients) {
    try {
      response.write(frame);
    } catch {
      sseClients.delete(response);
    }
  }
}

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (res.flushHeaders) res.flushHeaders();
  res.write(': connected\n\n');
  sseClients.add(res);
  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(ping);
      sseClients.delete(res);
    }
  }, 25000);
  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
  });
});

for (const page of ['merc', 'gm', 'lexicon', 'perks', 'staff-skills']) {
  app.get(`/${page}`, (req, res) => (
    res.sendFile(path.join(paths.webRoot, `${page}.html`))
  ));
}

app.use(createMechRouter({ store, broadcast }));
app.use(createFinanceRouter({ store }));
app.use(createTimeRouter({ store, crypto }));
app.use(createTravelRouter({ store }));
app.use(createMissionRouter({ store, crypto }));
app.use(createPilotRouter({ store }));
app.use(createStaffRouter({ store, crypto }));
app.use(createCatalogRouter({ store }));
app.use(createDocumentRouter({ store, crypto }));

function lanAddress() {
  for (const networkInterface of Object.values(os.networkInterfaces())) {
    for (const network of networkInterface || []) {
      if (network.family === 'IPv4' && !network.internal) return network.address;
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

function start() {
  return app.listen(PORT, HOST, () => {
    console.log(`Mercenary manager API on http://${lanAddress()}:${PORT}`);
  });
}

if (require.main === module) start();

module.exports = { app, start };
