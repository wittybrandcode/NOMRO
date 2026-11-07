/**
 * NOMRO - Host Easing Library
 * Pure, high-performance mathematical easing expressions for After Effects.
 * Curated for the 5 Golden Curves with dynamic NOMRO_Ease slider integration.
 * @module easing/EasingLib
 */

NOMRO.easing = NOMRO.easing || {};

// The 5 Golden Curve Expression Definitions (Base static shapes)
NOMRO.easing._defs = {
    'smoothOut': '(1 - Math.pow(1 - t, 3))',
    'snappyOut': '(1 - Math.pow(1 - t, 5))',
    'easeInOut': '(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)',
    'linear': 't',
    'overshoot': '(function(t){ var p = t - 1; return 1 + (2.70158 * p + 1.70158) * p * p; })(t)',
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
 * Get dynamic parametric easing expression code with NOMRO_Ease slider binding
 * @param {string} name - Easing function name or alias
 * @param {number} [strength=75] - Fallback influence strength (20-95)
 * @returns {string} Expression code for easing
 */
NOMRO.easing.get = function (name, strength) {
    var resolved = NOMRO.easing.resolveId(name);
    var defStr = parseFloat(strength);
    if (isNaN(defStr)) defStr = 75;

    if (resolved === 'linear') {
        return 't';
    }

    var code = '(function(t) {\n';
    code += '  var str = ' + defStr + ';\n';
    code += '  try { str = Math.max(10, Math.min(100, parseFloat(thisLayer.effect("NOMRO_Ease")("Slider")))); } catch(e){}\n';
    code += '  var ratio = str / 75;\n';

    if (resolved === 'snappyOut') {
        code += '  var p = 1 + ratio * 4;\n';
        code += '  return 1 - Math.pow(1 - t, p);\n';
    } else if (resolved === 'easeInOut') {
        code += '  var p = 1 + ratio * 2;\n';
        code += '  return t < 0.5 ? 0.5 * Math.pow(2 * t, p) : 1 - 0.5 * Math.pow(2 * (1 - t), p);\n';
    } else if (resolved === 'overshoot') {
        code += '  var sFactor = ratio * 1.70158;\n';
        code += '  var p = t - 1;\n';
        code += '  return 1 + ((1 + sFactor) * p + sFactor) * p * p;\n';
    } else if (resolved === 'easeIn') {
        code += '  var p = 1 + ratio * 2;\n';
        code += '  return Math.pow(t, p);\n';
    } else {
        // smoothOut (default)
        code += '  var p = 1 + ratio * 2;\n';
        code += '  return 1 - Math.pow(1 - t, p);\n';
    }
    code += '})(t)';

    return code;
};

NOMRO.easing.has = function (name) {
    if (!name) return false;
    return !!(NOMRO.easing._defs[name] || NOMRO.easing._aliases[name]);
};

NOMRO.easing._curveExpression = function (curveId, curveLibrary, tVar, strength) {
    var expr = NOMRO.easing.get(curveId, strength);
    return NOMRO.easing._replaceTVAR(expr, tVar || 't');
};

/**
 * Backward compatibility handler for legacy dual configurations
 */
NOMRO.easing.getDualExpression = function (dualConfig, curveLibrary, strength) {
    dualConfig = dualConfig || {};
    var dominantCurve = dualConfig.outCurveId || dualConfig.inCurveId || 'smoothOut';
    return NOMRO.easing._curveExpression(dominantCurve, curveLibrary, 't', strength);
};

/**
 * Main expression resolver from config object
 */
NOMRO.easing.getFromConfig = function (easingConfig, legacyEasing, curveLibrary, strength) {
    var fallbackStr = strength !== undefined ? strength : 75;

    if (!easingConfig || typeof easingConfig !== 'object') {
        return NOMRO.easing._curveExpression(legacyEasing || 'smoothOut', curveLibrary, 't', fallbackStr);
    }

    var str = easingConfig.easeStrength !== undefined ? easingConfig.easeStrength : fallbackStr;

    if (easingConfig.mode === 'dual' && easingConfig.dual) {
        return NOMRO.easing.getDualExpression(easingConfig.dual, curveLibrary, str);
    }

    var curveId = easingConfig.singleCurveId || legacyEasing || 'smoothOut';
    return NOMRO.easing._curveExpression(curveId, curveLibrary, 't', str);
};
