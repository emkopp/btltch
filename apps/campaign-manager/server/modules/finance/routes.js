'use strict';

const express = require('express');

module.exports = function createFinanceRouter({ store }) {
  const router = express.Router();

  router.get('/api/finances/summary', (req, res) => {
    const txns = store.list('txn');
    const income = txns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = txns.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
    const monthlyPayroll = store.list('pilot').reduce((sum, person) => sum + (person.salary || 0), 0)
      + store.list('staff').reduce((sum, person) => sum + (person.monthlyCost || 0), 0);
    res.json({ balance: income + expenses, income, expenses, entries: txns.length, monthlyPayroll });
  });

  return router;
};
