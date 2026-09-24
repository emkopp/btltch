'use strict';

window.PerkUi = (() => {
  const EFFECT_LABELS = {
    gunneryModifier: 'Gunnery target',
    pilotingModifier: 'Piloting target',
    laserAttackModifier: 'Laser attack target',
    missileAttackModifier: 'Missile attack target',
    ppcAttackModifier: 'PPC attack target',
    autocannonAttackModifier: 'Autocannon attack target',
    meleeAttackModifier: 'Melee attack target',
    longRangeModifier: 'Long-range penalty',
    recoilModifier: 'Recoil penalty',
    terrainPilotingModifier: 'Terrain/fall penalty',
    jumpDistanceModifier: 'Jump distance',
    defensiveMovementModifier: 'Defensive movement',
    heatGeneratedModifier: 'Heat generated',
    heatPenaltyModifier: 'Heat penalty',
    initiativeModifier: 'Initiative',
    lightWoodsFreeRollMax: 'Light woods free movement',
    heavyWoodsFreeRollMax: 'Heavy woods free movement',
    lightRubbleFreeRollMax: 'Light rubble free movement',
    heavyRubbleFreeRollMax: 'Heavy rubble free movement',
    oneLevelFreeRollMax: 'Climb 1 level free',
    twoLevelsFreeRollMax: 'Climb 2 levels free',
    threeLevelsFreeRollMax: 'Climb 3 levels free',
    separateElevationRollPerLevel: 'Elevation rolls',
  };

  const rollThresholdEffects = new Set([
    'lightWoodsFreeRollMax',
    'heavyWoodsFreeRollMax',
    'lightRubbleFreeRollMax',
    'heavyRubbleFreeRollMax',
    'oneLevelFreeRollMax',
    'twoLevelsFreeRollMax',
    'threeLevelsFreeRollMax',
  ]);

  function effectValueText(name, value) {
    if (name === 'separateElevationRollPerLevel') return 'separate for each level';
    if (rollThresholdEffects.has(name)) return `on ≤${value}`;
    return value > 0 ? `+${value}` : String(value);
  }

  function effectText(effect) {
    return Object.entries(effect || {})
      .map(([name, value]) => `${EFFECT_LABELS[name] || name} ${effectValueText(name, value)}`)
      .join(' · ');
  }

  return { EFFECT_LABELS, effectText, effectValueText };
})();
