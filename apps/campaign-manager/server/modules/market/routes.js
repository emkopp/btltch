'use strict';

const express = require('express');
const {
  SYSTEM_TAGS,
  balance,
  basicItemPrice,
  ensureMarketplace,
  generateSystemMarket,
  marketId,
  rareChanceForTags,
  shopState,
  slugify,
  systemTagSummary,
} = require('./service');

const TAG_IDS = new Set(SYSTEM_TAGS.map(tag => tag.id));
const MODIFIER_KEYS = new Set(['heat', 'range', 'damage', 'tonnage']);

function systemId(value) {
  const id = String(value || '');
  return id.startsWith('system:') ? id : `system:${id}`;
}

function requiredText(value, label, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength) {
    throw new Error(`${label} is required and must be at most ${maxLength} characters`);
  }
  return text;
}

function normalizeModifiers(value) {
  const modifiers = {};
  for (const [key, raw] of Object.entries(value && typeof value === 'object' ? value : {})) {
    if (!MODIFIER_KEYS.has(key)) throw new Error(`Unknown rare-item modifier: ${key}`);
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < -10 || amount > 10 || amount === 0) {
      throw new Error(`${key} modifier must be a non-zero whole number from -10 to 10`);
    }
    modifiers[key] = amount;
  }
  if (!Object.keys(modifiers).length) throw new Error('Select at least one rare-item modifier');
  return modifiers;
}

function createTemplate(store, body) {
  const name = requiredText(body && body.name, 'Template name', 100);
  const id = slugify(body && body.id ? body.id : name);
  if (!id) throw new Error('Template ID must contain letters or numbers');
  if (store.get(`rareItemTemplate:${id}`)) throw new Error(`Template ID already exists: ${id}`);
  const itemType = String(body && body.itemType || '');
  if (!['weapon', 'equipment'].includes(itemType)) throw new Error('Item type must be weapon or equipment');
  const basePrice = Number(body && body.basePrice);
  if (!Number.isInteger(basePrice) || basePrice < 1000 || basePrice > 100000000) {
    throw new Error('Base price must be a whole number from 1,000 to 100,000,000');
  }
  const baseItemName = typeof body.baseItemName === 'string' ? body.baseItemName.trim() : '';
  if (baseItemName) {
    const exists = store.list(itemType).some(item => (
      String(item.name).toLowerCase() === baseItemName.toLowerCase()
    ));
    if (!exists) throw new Error(`Unknown base ${itemType}: ${baseItemName}`);
  }
  return {
    _id: `rareItemTemplate:${id}`,
    _type: 'rareItemTemplate',
    id,
    name,
    itemType,
    namePrefix: requiredText(body && body.namePrefix, 'Generated item prefix', 40),
    baseItemName: baseItemName || null,
    basePrice,
    description: requiredText(body && body.description, 'Description', 500),
    modifiers: normalizeModifiers(body && body.modifiers),
  };
}

function transactionId(crypto) {
  return `txn:${crypto.randomUUID()}`;
}

function standardSalePrice(store, item) {
  const catalog = (item.catalogId && store.get(item.catalogId))
    || store.list(item.itemType).find(entry => (
      String(entry.name).toLowerCase() === String(item.name).toLowerCase()
    ));
  const pricedItem = catalog || {
    ...item,
    _id: `${item.itemType}:${slugify(item.name) || 'legacy-item'}`,
  };
  return Math.floor(basicItemPrice(pricedItem, item.itemType) / 2);
}

module.exports = function createMarketRouter({ store, crypto }) {
  const router = express.Router();
  ensureMarketplace(store);

  router.get('/api/shop', (req, res) => {
    try {
      return res.json(shopState(store));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post('/api/shop/purchase', (req, res) => {
    const company = store.get('company:main') || {};
    const system = store.list('system').find(item => (
      String(item.name).toLowerCase() === String(company.currentSystem || '').toLowerCase()
    ));
    if (!system) return res.status(400).json({ error: 'Set a valid current system before shopping' });
    const kind = String(req.body && req.body.kind || '');
    let purchase;
    let market = null;
    if (kind === 'basic') {
      const itemType = String(req.body && req.body.itemType || '');
      if (!['weapon', 'equipment'].includes(itemType)) {
        return res.status(400).json({ error: 'Basic item type must be weapon or equipment' });
      }
      const item = store.get(String(req.body && req.body.catalogId || ''));
      if (!item || item._type !== itemType) {
        return res.status(400).json({ error: 'Basic catalog item does not exist' });
      }
      purchase = {
        itemType,
        name: item.name,
        catalogId: item._id,
        price: basicItemPrice(item, itemType),
        rarity: 'Standard',
      };
    } else if (kind === 'rare') {
      market = store.get(marketId(system));
      const stockId = String(req.body && req.body.stockId || '');
      purchase = market && (market.rareItems || []).find(item => item.stockId === stockId);
      if (!purchase) return res.status(400).json({ error: 'Rare item is no longer available' });
    } else {
      return res.status(400).json({ error: 'Purchase kind must be basic or rare' });
    }
    if (balance(store) < purchase.price) {
      return res.status(400).json({ error: 'Insufficient C-Bills for this purchase' });
    }

    const savePurchase = store.db.transaction(() => {
      if (market) {
        store.put({
          ...market,
          rareItems: market.rareItems.filter(item => item.stockId !== purchase.stockId),
        });
      }
      const owned = store.put({
        _id: `item:${crypto.randomUUID()}`,
        _type: 'item',
        itemType: purchase.itemType,
        name: purchase.name,
        condition: 'functional',
        rarity: purchase.rarity,
        catalogId: purchase.catalogId || purchase.baseItemId || null,
        baseItemName: purchase.baseItemName || null,
        rareTemplateId: purchase.templateId || null,
        modifiers: purchase.modifiers || {},
        sourceSystem: system.name,
        purchasePrice: purchase.price,
        purchasedAt: new Date().toISOString(),
      });
      store.put({
        _id: transactionId(crypto),
        _type: 'txn',
        date: new Date().toISOString().slice(0, 10),
        category: 'purchase',
        description: `${purchase.name} purchased at ${system.name}`,
        amount: -purchase.price,
        itemId: owned._id,
      });
      return owned;
    });
    const owned = savePurchase();
    return res.status(201).json({ item: owned, shop: shopState(store) });
  });

  router.post('/api/shop/sell', (req, res) => {
    const itemId = String(req.body && req.body.itemId || '');
    const item = store.get(itemId.startsWith('item:') ? itemId : `item:${itemId}`);
    if (!item || item._type !== 'item') {
      return res.status(404).json({ error: 'Owned item not found' });
    }
    if (!['weapon', 'equipment'].includes(item.itemType)) {
      return res.status(400).json({ error: 'Only weapons and equipment can be sold' });
    }
    const company = store.get('company:main') || {};
    if (!company.currentSystem) {
      return res.status(400).json({ error: 'Set a current system before selling items' });
    }
    const isRare = item.rarity && item.rarity !== 'Standard';
    if (isRare) {
      const existing = store.list('rareSaleOffer').find(offer => (
        offer.itemId === item._id && offer.status === 'pending'
      ));
      if (existing) {
        return res.status(400).json({ error: 'This item already has a pending sale negotiation' });
      }
      const suggestedValue = Math.max(1, Math.floor((Number(item.purchasePrice) || 0) / 2));
      const offer = store.put({
        _id: `rareSaleOffer:${crypto.randomUUID()}`,
        _type: 'rareSaleOffer',
        itemId: item._id,
        itemName: item.name,
        itemType: item.itemType,
        rarity: item.rarity,
        modifiers: item.modifiers || {},
        systemName: company.currentSystem,
        suggestedValue,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
      return res.status(202).json({ kind: 'negotiation', offer });
    }

    const salePrice = standardSalePrice(store, item);
    const completeSale = store.db.transaction(() => {
      if (!store.remove(item._id)) throw new Error('Owned item is no longer available');
      store.put({
        _id: transactionId(crypto),
        _type: 'txn',
        date: new Date().toISOString().slice(0, 10),
        category: 'sale',
        description: `${item.name} sold at ${company.currentSystem}`,
        amount: salePrice,
        itemId: item._id,
      });
    });
    completeSale();
    return res.json({
      kind: 'standard',
      itemId: item._id,
      itemName: item.name,
      salePrice,
      balance: balance(store),
    });
  });

  router.get('/api/shop/sale-quotes', (req, res) => {
    const pending = new Set(store.list('rareSaleOffer')
      .filter(offer => offer.status === 'pending')
      .map(offer => offer.itemId));
    res.json(store.list('item')
      .filter(item => ['weapon', 'equipment'].includes(item.itemType))
      .map(item => {
        const rare = item.rarity && item.rarity !== 'Standard';
        return {
          itemId: item._id,
          kind: rare ? 'negotiation' : 'standard',
          salePrice: rare ? null : standardSalePrice(store, item),
          suggestedValue: rare
            ? Math.max(1, Math.floor((Number(item.purchasePrice) || 0) / 2))
            : null,
          pending: pending.has(item._id),
        };
      }));
  });

  router.get('/api/rare-sale-offers', (req, res) => {
    res.json(store.list('rareSaleOffer')
      .sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt))));
  });

  router.post('/api/rare-sale-offers/:id/resolve', (req, res) => {
    const offerId = `rareSaleOffer:${req.params.id}`;
    const offer = store.get(offerId);
    if (!offer) return res.status(404).json({ error: 'Rare sale offer not found' });
    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Rare sale offer has already been resolved' });
    }
    const action = String(req.body && req.body.action || '');
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Resolution must approve or reject the offer' });
    }
    if (action === 'reject') {
      return res.json(store.put({
        ...offer,
        status: 'rejected',
        resolvedAt: new Date().toISOString(),
      }));
    }
    const amount = Number(req.body && req.body.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000000000) {
      return res.status(400).json({ error: 'Negotiated price must be a whole number from 1 to 1,000,000,000' });
    }
    const item = store.get(offer.itemId);
    if (!item) return res.status(400).json({ error: 'The negotiated item is no longer in inventory' });
    const approveSale = store.db.transaction(() => {
      if (!store.remove(item._id)) throw new Error('The negotiated item is no longer in inventory');
      store.put({
        _id: transactionId(crypto),
        _type: 'txn',
        date: new Date().toISOString().slice(0, 10),
        category: 'rare sale',
        description: `${item.name} sold by negotiation at ${offer.systemName}`,
        amount,
        itemId: item._id,
        offerId: offer._id,
      });
      return store.put({
        ...offer,
        status: 'approved',
        negotiatedPrice: amount,
        resolvedAt: new Date().toISOString(),
      });
    });
    return res.json(approveSale());
  });

  router.get('/api/system-tags/summary', (req, res) => {
    res.json(systemTagSummary(store));
  });

  router.put('/api/systems/:id/tags', (req, res) => {
    const system = store.get(systemId(req.params.id));
    if (!system) return res.status(404).json({ error: 'System not found' });
    const tags = [...new Set(Array.isArray(req.body && req.body.tags)
      ? req.body.tags.map(tag => String(tag).toLowerCase())
      : [])];
    if (tags.some(tag => !TAG_IDS.has(tag))) {
      return res.status(400).json({ error: 'One or more system tags are unknown' });
    }
    const saved = store.put({ ...system, tags });
    const market = store.get(marketId(saved));
    if (market) store.put({ ...market, rareChance: rareChanceForTags(tags) });
    return res.json(saved);
  });

  router.get('/api/gm/system-map', (req, res) => {
    const markets = new Map(store.list('systemMarket').map(market => [market.systemId, market]));
    res.json({
      tags: SYSTEM_TAGS,
      systems: store.list('system').map(system => {
        const market = markets.get(system._id);
        return {
          id: system._id,
          name: system.name,
          x: system.x,
          y: system.y,
          affiliation: system.affiliation,
          tags: system.tags || [],
          rareChance: market ? market.rareChance : rareChanceForTags(system.tags),
          rareItemCount: market && Array.isArray(market.rareItems) ? market.rareItems.length : 0,
        };
      }),
    });
  });

  router.post('/api/gm/markets/:systemId/regenerate', (req, res) => {
    const system = store.get(systemId(req.params.systemId));
    if (!system) return res.status(404).json({ error: 'System not found' });
    const existing = store.get(marketId(system));
    const generation = (Number(existing && existing.generation) || 0) + 1;
    return res.json(generateSystemMarket(store, system, generation));
  });

  router.get('/api/rare-item-templates', (req, res) => {
    res.json(store.list('rareItemTemplate').sort((a, b) => a.name.localeCompare(b.name)));
  });

  router.post('/api/rare-item-templates', (req, res) => {
    try {
      return res.status(201).json(store.put(createTemplate(store, req.body)));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.delete('/api/rare-item-templates/:id', (req, res) => {
    const id = `rareItemTemplate:${req.params.id}`;
    if (!store.remove(id)) return res.status(404).json({ error: 'Rare-item template not found' });
    return res.status(204).end();
  });

  return router;
};
