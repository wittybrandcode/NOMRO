/**
 * NOMRO - Easing Library
 * @module easing/EasingLib
 */

NOMRO.easing = NOMRO.easing || {};

NOMRO.easing._defs = {
    'linear': 't',
    'easeIn': 't * t',
    'easeOut': 't * (2 - t)',
    'easeInOut': '(t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)',
    'bounce': '(function(t) { if (t < 1/2.75) return 7.5625 * t * t; if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75; if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375; return 7.5625 * (t -= 2.625/2.75) * t + 0.984375; })(t)',
    'elastic': '(function(t) { if (t === 0) return 0; if (t === 1) return 1; return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI); })(t)',
    'back': '(2.70158 * t * t * t - 1.70158 * t * t)'
};

NOMRO.easing._clamp = function (v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
};

NOMRO.easing._toNumber = function (value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
};

NOMRO.easing._replaceTVAR = function (expr, tVar) {
    return (expr || 't').replace(/\bt\b/g, tVar || 't');
};

NOMRO.easing._findCustomCurve = function (curveLibrary, id) {
    if (!curveLibrary || !curveLibrary.length) return null;

    for (var i = 0; i < curveLibrary.length; i++) {
        var curve = curveLibrary[i];
        if (curve && curve.id === id) {
            return curve;
        }
    }

    return null;
};

NOMRO.easing._bezierExpression = function (bezier, tVar) {
    if (!bezier || bezier.length !== 4) {
        return tVar || 't';
    }

    var x1 = NOMRO.easing._clamp(NOMRO.easing._toNumber(bezier[0], 0.25), 0, 1);
    var y1 = NOMRO.easing._toNumber(bezier[1], 0.25);
    var x2 = NOMRO.easing._clamp(NOMRO.easing._toNumber(bezier[2], 0.75), 0, 1);
    var y2 = NOMRO.easing._toNumber(bezier[3], 0.75);

    var expr = '';
    expr += '(function(T){';
    expr += 'function bezierAt(a1,a2,t){var omt=1-t;return 3*omt*omt*t*a1+3*omt*t*t*a2+t*t*t;}';
    expr += 'function bezierSlope(a1,a2,t){var omt=1-t;return 3*omt*omt*a1+6*omt*t*(a2-a1)+3*t*t*(1-a2);}';
    expr += 'function solveX(x1,x2,x){var t=x;var i;for(i=0;i<6;i++){var cx=bezierAt(x1,x2,t)-x;var s=bezierSlope(x1,x2,t);if(Math.abs(cx)<0.000001)return t;if(Math.abs(s)<0.000001)break;t-=cx/s;}var lo=0;var hi=1;t=x;for(i=0;i<20;i++){var ex=bezierAt(x1,x2,t);if(Math.abs(ex-x)<0.000001)break;if(ex<x)lo=t;else hi=t;t=(lo+hi)/2;}return t;}';
    expr += 'var x=T; if (x<0) x=0; if (x>1) x=1;';
    expr += 'var st=solveX(' + x1.toFixed(6) + ',' + x2.toFixed(6) + ',x);';
    expr += 'return bezierAt(' + y1.toFixed(6) + ',' + y2.toFixed(6) + ',st);';
    expr += '})(' + (tVar || 't') + ')';

    return expr;
};

(function () {
    var templates = [
        ['easeInSine', [0.12, 0.00, 0.39, 0.00]],
        ['easeOutSine', [0.61, 1.00, 0.88, 1.00]],
        ['easeInOutSine', [0.37, 0.00, 0.63, 1.00]],
        ['easeInQuad', [0.11, 0.00, 0.50, 0.00]],
        ['easeOutQuad', [0.50, 1.00, 0.89, 1.00]],
        ['easeInOutQuad', [0.45, 0.00, 0.55, 1.00]],
        ['easeInCubic', [0.32, 0.00, 0.67, 0.00]],
        ['easeOutCubic', [0.33, 1.00, 0.68, 1.00]],
        ['easeInOutCubic', [0.65, 0.00, 0.35, 1.00]],
        ['easeInQuart', [0.50, 0.00, 0.75, 0.00]],
        ['easeOutQuart', [0.25, 1.00, 0.50, 1.00]],
        ['easeInOutQuart', [0.76, 0.00, 0.24, 1.00]],
        ['easeInQuint', [0.64, 0.00, 0.78, 0.00]],
        ['easeOutQuint', [0.22, 1.00, 0.36, 1.00]],
        ['easeInOutQuint', [0.83, 0.00, 0.17, 1.00]],
        ['easeInExpo', [0.70, 0.00, 0.84, 0.00]],
        ['easeOutExpo', [0.16, 1.00, 0.30, 1.00]],
        ['easeInOutExpo', [0.87, 0.00, 0.13, 1.00]],
        ['easeInCirc', [0.55, 0.00, 1.00, 0.45]],
        ['easeOutCirc', [0.00, 0.55, 0.45, 1.00]],
        ['easeInOutCirc', [0.85, 0.00, 0.15, 1.00]],
        ['easeInBack', [0.36, 0.00, 0.66, -0.56]],
        ['easeOutBack', [0.34, 1.56, 0.64, 1.00]],
        ['easeInOutBack', [0.68, -0.60, 0.32, 1.60]]
    ];

    for (var i = 0; i < templates.length; i++) {
        var id = templates[i][0];
        var expr = NOMRO.easing._bezierExpression(templates[i][1], 't');
        NOMRO.easing._defs[id] = expr;
    }
})();

NOMRO.easing._curveExpression = function (curveId, curveLibrary, tVar) {
    if (NOMRO.easing._defs[curveId]) {
        return NOMRO.easing._replaceTVAR(NOMRO.easing._defs[curveId], tVar || 't');
    }

    var custom = NOMRO.easing._findCustomCurve(curveLibrary, curveId);
    if (custom && custom.type === 'bezier') {
        return NOMRO.easing._bezierExpression(custom.bezier, tVar || 't');
    }

    return NOMRO.easing._replaceTVAR(NOMRO.easing._defs.linear, tVar || 't');
};

/**
 * Get easing expression code by name
 * @param {string} name - Easing function name
 * @returns {string} Expression code for easing
 */
NOMRO.easing.get = function (name) {
    return NOMRO.easing._defs[name] || NOMRO.easing._defs.linear;
};

NOMRO.easing.has = function (name) {
    return !!NOMRO.easing._defs[name];
};

NOMRO.easing.getDualExpression = function (dualConfig, curveLibrary) {
    dualConfig = dualConfig || {};

    var inCurveId = dualConfig.inCurveId || 'easeIn';
    var outCurveId = dualConfig.outCurveId || 'easeOut';
    var middleMode = dualConfig.middleMode === 'easeInOut' ? 'easeInOut' : 'linear';

    var i = NOMRO.easing._clamp(NOMRO.easing._toNumber(dualConfig.inPct, 0.2), 0.05, 0.90);
    var o = NOMRO.easing._clamp(NOMRO.easing._toNumber(dualConfig.outPct, 0.2), 0.05, 0.90);

    if (i + o > 0.95) {
        var scale = 0.95 / (i + o);
        i *= scale;
        o *= scale;
    }

    var inExpr = NOMRO.easing._curveExpression(inCurveId, curveLibrary, 'pIn');
    var outExpr = NOMRO.easing._curveExpression(outCurveId, curveLibrary, 'pOut');
    var midExpr = middleMode === 'easeInOut'
        ? '(pMid < 0.5 ? 2 * pMid * pMid : 1 - Math.pow(-2 * pMid + 2, 2) / 2)'
        : 'pMid';

    var expr = '';
    expr += '(function(t) {';
    expr += 'var i=' + i.toFixed(6) + ';';
    expr += 'var o=' + o.toFixed(6) + ';';
    expr += 'var m=1-i-o;';
    expr += 'if (t < i) { var pIn = i > 0 ? (t / i) : 0; return (' + inExpr + ') * i; }';
    expr += 'if (t <= 1 - o) { var pMid = m > 0 ? ((t - i) / m) : 0; return i + (' + midExpr + ') * m; }';
    expr += 'var pOut = o > 0 ? ((t - (1 - o)) / o) : 1;';
    expr += 'return (1 - o) + (' + outExpr + ') * o;';
    expr += '})(t)';

    return expr;
};

NOMRO.easing.getFromConfig = function (easingConfig, legacyEasing, curveLibrary) {
    var fallbackId = legacyEasing || 'linear';

    if (!easingConfig || typeof easingConfig !== 'object') {
        return NOMRO.easing._curveExpression(fallbackId, curveLibrary, 't');
    }

    var mode = easingConfig.mode === 'dual' ? 'dual' : 'single';
    if (mode === 'single') {
        return NOMRO.easing._curveExpression(easingConfig.singleCurveId || fallbackId, curveLibrary, 't');
    }

    return NOMRO.easing.getDualExpression(easingConfig.dual || {}, curveLibrary);
};

