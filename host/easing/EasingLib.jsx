/**
 * NOMRO - Host Easing Library
 * Pure, high-performance mathematical easing expressions for After Effects.
 * Curated for the 5 Golden Curves with zero runtime iterative overhead.
 * @module easing/EasingLib
 */

NOMRO.easing = NOMRO.easing || {};

// The 5 Golden Curve Expression Definitions
NOMRO.easing._defs = {
    // 1. Smooth Out: Graceful cubic deceleration to landing (Default for counters)
    'smoothOut': '(1 - Math.pow(1 - t, 3))',

    // 2. Snappy Out: High-energy quintic burst and rapid settle
    'snappyOut': '(1 - Math.pow(1 - t, 5))',

    // 3. Ease In-Out: Symmetric cubic S-curve
    'easeInOut': '(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)',

    // 4. Linear: Constant uniform velocity
    'linear': 't',

    // 5. Spring / Overshoot: Elastic overshoot & settle (Back Out s = 1.70158)
    'overshoot': '(function(t){ var p = t - 1; return 1 + (2.70158 * p + 1.70158) * p * p; })(t)',

    // Legacy fallback: Progressive acceleration
    'easeIn': '(t * t * t)'
};

// Backward-compatible alias map for existing AE projects & presets
NOMRO.easing._aliases = {
    'easeOut': 'smoothOut',
    'easeOutQuad': 'smoothOut',
    'easeOutCubic': 'smoothOut',
    'easeOutSine': 'smoothOut',
    'easeOutQuart': 'snappyOut',
    'easeOutQuint': 'snappyOut',
    'easeOutExpo': 'snappyOut',
    'easeOutCirc': 'snappyOut',
    'easeInOutQuad': 'easeInOut',
    'easeInOutCubic': 'easeInOut',
    'easeInOutSine': 'easeInOut',
    'easeInOutQuart': 'easeInOut',
    'easeInOutQuint': 'easeInOut',
    'easeInOutExpo': 'easeInOut',
    'easeInOutCirc': 'easeInOut',
    'back': 'overshoot',
    'easeOutBack': 'overshoot',
    'easeInOutBack': 'overshoot',
    'bounce': 'overshoot',
    'elastic': 'overshoot',
    'easeInQuad': 'easeIn',
    'easeInCubic': 'easeIn',
    'easeInSine': 'easeIn',
    'easeInQuart': 'easeIn',
    'easeInQuint': 'easeIn',
    'easeInExpo': 'easeIn',
    'easeInCirc': 'easeIn',
    'easeInBack': 'overshoot'
};

NOMRO.easing._replaceTVAR = function (expr, tVar) {
    if (!tVar || tVar === 't') return expr;
    return (expr || 't').replace(/\bt\b/g, tVar);
};

NOMRO.easing.resolveId = function (id) {
    if (!id || typeof id !== 'string') return 'smoothOut';
    if (NOMRO.easing._defs[id]) return id;
    if (NOMRO.easing._aliases[id]) return NOMRO.easing._aliases[id];
    return 'smoothOut';
};

/**
 * Get easing expression code by name
 * @param {string} name - Easing function name or alias
 * @returns {string} Expression code for easing
 */
NOMRO.easing.get = function (name) {
    var resolved = NOMRO.easing.resolveId(name);
    return NOMRO.easing._defs[resolved] || NOMRO.easing._defs.smoothOut;
};

NOMRO.easing.has = function (name) {
    if (!name) return false;
    return !!(NOMRO.easing._defs[name] || NOMRO.easing._aliases[name]);
};

NOMRO.easing._curveExpression = function (curveId, curveLibrary, tVar) {
    var expr = NOMRO.easing.get(curveId);
    return NOMRO.easing._replaceTVAR(expr, tVar || 't');
};

/**
 * Backward compatibility handler for legacy dual configurations
 */
NOMRO.easing.getDualExpression = function (dualConfig, curveLibrary) {
    dualConfig = dualConfig || {};
    var dominantCurve = dualConfig.outCurveId || dualConfig.inCurveId || 'smoothOut';
    return NOMRO.easing._curveExpression(dominantCurve, curveLibrary, 't');
};

/**
 * Main expression resolver from config object
 */
NOMRO.easing.getFromConfig = function (easingConfig, legacyEasing, curveLibrary) {
    if (!easingConfig || typeof easingConfig !== 'object') {
        return NOMRO.easing._curveExpression(legacyEasing || 'smoothOut', curveLibrary, 't');
    }

    if (easingConfig.mode === 'dual' && easingConfig.dual) {
        return NOMRO.easing.getDualExpression(easingConfig.dual, curveLibrary);
    }

    var curveId = easingConfig.singleCurveId || legacyEasing || 'smoothOut';
    return NOMRO.easing._curveExpression(curveId, curveLibrary, 't');
};
