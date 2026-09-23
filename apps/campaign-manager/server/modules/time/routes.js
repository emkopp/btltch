'use strict';

const express = require('express');

module.exports = function createTimeRouter({ store, crypto }) {
  const router = express.Router();

  router.get('/api/time', (req, res) => {
    res.json(store.get('clock:main') || { month: 1, year: 3025, turn: 0 });
  });

  router.post('/api/time/advance', (req, res) => {
    const clock = store.get('clock:main')
      || { _id: 'clock:main', type: 'clock', month: 1, year: 3025, turn: 0 };
    let month = (clock.month || 1) + 1;
    let year = clock.year || 3025;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const turn = (clock.turn || 0) + 1;
    const date = `${year}-${String(month).padStart(2, '0')}-01`;
    store.put({ ...clock, _id: 'clock:main', type: 'clock', month, year, turn });

    const posted = [];
    const payroll = store.list('pilot').reduce((sum, person) => sum + (person.salary || 0), 0)
      + store.list('staff').reduce((sum, person) => sum + (person.monthlyCost || 0), 0);
    if (payroll > 0) {
      const txn = {
        _id: `txn:${crypto.randomUUID()}`,
        type: 'txn',
        date,
        category: 'payroll',
        description: `Monthly support & payroll (turn ${turn})`,
        amount: -payroll,
      };
      store.put(txn);
      posted.push(txn);
    }
    for (const contract of store.list('contract')) {
      if (String(contract.status || '').toLowerCase() === 'active' && contract.basePay) {
        const txn = {
          _id: `txn:${crypto.randomUUID()}`,
          type: 'txn',
          date,
          category: 'contract',
          description: `${contract.missionType} pay from ${contract.employer} (turn ${turn})`,
          amount: contract.basePay,
        };
        store.put(txn);
        posted.push(txn);
      }
    }
    const balance = store.list('txn').reduce((sum, txn) => sum + (txn.amount || 0), 0);
    res.json({ turn, month, year, date, posted, balance });
  });

  return router;
};
