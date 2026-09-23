/* Mercenary Manager integration: pins the team's current location and the available
   missions onto the Inner Sphere map. Loaded after the map's own scripts, it reuses
   the map's `userData` highlight mechanism plus custom classes for distinct colors. */
(function () {
  'use strict';

  function start() {
    if (!window.require) { setTimeout(start, 100); return; }
    window.require(['js/btplanets', 'js/btplanets_routes'], function (btplanets, routes) {
      function findPlanet(name) {
        var n = String(name || '').toLowerCase();
        for (var i = 0; i < btplanets.planets.length; i++) {
          if (btplanets.planets[i].name.toLowerCase() === n) return btplanets.planets[i];
        }
        return null;
      }

      // Custom classes are re-applied on every repaint since the map rebinds data on zoom/pan.
      function applyPinClasses() {
        if (!btplanets.svg) return;
        btplanets.svg.selectAll('g.planet-circles circle')
          .classed('merc-home', function (d) { return d && d.mercPin === 'home'; })
          .classed('merc-mission', function (d) { return d && d.mercPin === 'mission'; });
        btplanets.svg.selectAll('g.planet-names text')
          .classed('merc-home', function (d) { return d && d.mercPin === 'home'; })
          .classed('merc-mission', function (d) { return d && d.mercPin === 'mission'; });
      }

      function loadPins() {
        Promise.all([
          fetch('/api/location').then(function (r) { return r.json(); }),
          fetch('/api/missions/available').then(function (r) { return r.json(); })
        ]).then(function (res) {
          var loc = res[0] || {};
          var missions = res[1] || [];
          var byName = {};

          if (loc.currentSystem) {
            byName[loc.currentSystem] = { kind: 'home', labels: ['\u2605 Team HQ'] };
          }
          missions.forEach(function (m) {
            if (!m.location) return;
            var tv = m.travel && m.travel.known
              ? (m.travel.local ? 'local' : m.travel.jumps + ' jump' + (m.travel.jumps === 1 ? '' : 's') + ' \u00b7 ' + m.travel.distanceLy + ' LY')
              : '';
            var label = m.missionType + ' \u2014 ' + m.employer + (tv ? ' (' + tv + ')' : '');
            if (!byName[m.location]) byName[m.location] = { kind: 'mission', labels: [] };
            byName[m.location].labels.push(label);
          });

          for (var i = 0; i < btplanets.planets.length; i++) {
            if (btplanets.planets[i].mercPin) btplanets.planets[i].mercPin = null;
          }

          var homeCoords = null;
          Object.keys(byName).forEach(function (name) {
            var p = findPlanet(name);
            if (!p) return;
            p.userData = byName[name].labels.join('<br>');
            p.mercPin = byName[name].kind;
            if (byName[name].kind === 'home') homeCoords = [p.x, p.y];
          });

          btplanets.updateAllUserDataHighlights();
          applyPinClasses();

          // Optional deep-link: /map/?focus=<system>&route=1 centers on the system and
          // (with route=1) plots the jump route to it from the team's location.
          var params = new URLSearchParams(window.location.search);
          var focusName = params.get('focus');
          var wantRoute = params.get('route') === '1';
          var homePlanet = loc.currentSystem ? findPlanet(loc.currentSystem) : null;
          var focusPlanet = focusName ? findPlanet(focusName) : null;

          if (focusPlanet && wantRoute && homePlanet && homePlanet !== focusPlanet) {
            plotRouteBetween(homePlanet, focusPlanet);
            btplanets.centerOnCoordinates((homePlanet.x + focusPlanet.x) / 2, (homePlanet.y + focusPlanet.y) / 2, 1.5);
          } else if (focusPlanet) {
            btplanets.centerOnCoordinates(focusPlanet.x, focusPlanet.y, 3);
          } else if (homeCoords) {
            btplanets.centerOnCoordinates(homeCoords[0], homeCoords[1], 3);
          }
        }).catch(function (e) { if (window.console) console.warn('Merc pins failed:', e); });
      }

      function plotRouteBetween(a, b) {
        if (!routes) return;
        if (routes.stops === null && typeof routes.init === 'function') routes.init();
        routes.clear();
        routes.addStop(a);
        routes.addStop(b);
        routes.plotRoute({
          excludeAffiliations: { cc: false, dc: false, fs: false, fwl: false, lc: false, p: false, o: false },
          includeUninhabited: true
        });
      }

      btplanets.on('repaint', null, applyPinClasses);
      if (new URLSearchParams(window.location.search).get('pick') === '1') setupPickMode(btplanets);
      if (btplanets.planets) loadPins();
      else btplanets.on('initialized', null, loadPins);

      // Pick mode (opened from the GM mission builder): selecting a system and clicking
      // "Use system" writes to localStorage, which the GM tab picks up via a storage event.
      function setupPickMode(bt) {
        var bar = document.createElement('div');
        bar.className = 'merc-pick-bar';
        var label = document.createElement('span');
        label.textContent = 'Pick a system for the mission \u2014 click one, then:';
        var name = document.createElement('span');
        name.className = 'merc-pick-name';
        var use = document.createElement('button');
        use.className = 'merc-pick-use';
        use.textContent = 'Use system';
        use.disabled = true;
        bar.append(label, name, use);
        document.body.appendChild(bar);
        var picked = null;
        bt.on('selectionadded', null, function (planet) {
          picked = planet.name;
          name.textContent = planet.name;
          use.disabled = false;
        });
        use.addEventListener('click', function () {
          if (!picked) return;
          localStorage.setItem('missionPickSystem', picked + '|' + Date.now());
          use.textContent = 'Sent \u201c' + picked + '\u201d \u2014 back to Missions';
        });
      }
    });
  }

  start();
})();
