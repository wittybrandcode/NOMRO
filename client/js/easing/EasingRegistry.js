/**
 * NOMRO - Easing Registry
 * Canonical registry for built-in easing curves.
 * @module easing/EasingRegistry
 */
var EasingRegistry = (function () {
    'use strict';

    var _defs = {};

    function _cloneDef(def) {
        return {
            id: def.id,
            name: def.name,
            category: def.category,
            subcategory: def.subcategory || 'core',
            runtimeFn: def.runtimeFn,
            expressionCode: def.expressionCode
        };
    }

    function register(def) {
        if (!def || !def.id || typeof def.runtimeFn !== 'function' || !def.expressionCode) {
            throw new Error('Invalid easing definition');
        }
        _defs[def.id] = _cloneDef(def);
    }

    function has(id) {
        return !!_defs[id];
    }

    function get(id) {
        var def = _defs[id] || _defs.linear;
        return _cloneDef(def);
    }

    function getRuntime(id) {
        return get(id).runtimeFn;
    }

    function getExpression(id) {
        return get(id).expressionCode;
    }

    function list(category) {
        var out = [];
        for (var key in _defs) {
            if (_defs.hasOwnProperty(key)) {
                if (!category || _defs[key].category === category) {
                    out.push(_cloneDef(_defs[key]));
                }
            }
        }
        return out;
    }

    register({
        id: 'linear',
        name: 'Linear',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) { return t; },
        expressionCode: 't'
    });

    register({
        id: 'easeIn',
        name: 'Ease In',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) { return t * t; },
        expressionCode: 't * t'
    });

    register({
        id: 'easeOut',
        name: 'Ease Out',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) { return 1 - (1 - t) * (1 - t); },
        expressionCode: 't * (2 - t)'
    });

    register({
        id: 'easeInOut',
        name: 'Ease In Out',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) {
            return t < 0.5
                ? 2 * t * t
                : 1 - Math.pow(-2 * t + 2, 2) / 2;
        },
        expressionCode: '(t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)'
    });

    register({
        id: 'bounce',
        name: 'Bounce',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) {
            var n1 = 7.5625;
            var d1 = 2.75;
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        },
        expressionCode: '(function(t) { if (t < 1/2.75) return 7.5625 * t * t; if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75; if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375; return 7.5625 * (t -= 2.625/2.75) * t + 0.984375; })(t)'
    });

    register({
        id: 'elastic',
        name: 'Elastic',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        },
        expressionCode: '(function(t) { if (t === 0) return 0; if (t === 1) return 1; return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI); })(t)'
    });

    register({
        id: 'back',
        name: 'Back',
        category: 'builtIn',
        subcategory: 'core',
        runtimeFn: function (t) {
            return (2.70158 * t * t * t - 1.70158 * t * t);
        },
        expressionCode: '(2.70158 * t * t * t - 1.70158 * t * t)'
    });

    function _bezierAt(a1, a2, t) {
        var omt = 1 - t;
        return 3 * omt * omt * t * a1 + 3 * omt * t * t * a2 + t * t * t;
    }

    function _bezierSlope(a1, a2, t) {
        var omt = 1 - t;
        return 3 * omt * omt * a1 + 6 * omt * t * (a2 - a1) + 3 * t * t * (1 - a2);
    }

    function _solveBezierX(x1, x2, x) {
        var t = x;
        var i;

        for (i = 0; i < 6; i++) {
            var currentX = _bezierAt(x1, x2, t) - x;
            var slope = _bezierSlope(x1, x2, t);
            if (Math.abs(currentX) < 1e-6) return t;
            if (Math.abs(slope) < 1e-6) break;
            t -= currentX / slope;
        }

        var low = 0;
        var high = 1;
        t = x;
        for (i = 0; i < 20; i++) {
            var estimate = _bezierAt(x1, x2, t);
            if (Math.abs(estimate - x) < 1e-6) break;
            if (estimate < x) low = t;
            else high = t;
            t = (low + high) / 2;
        }

        return t;
    }

    function _createBezierRuntime(bezier) {
        return function (t) {
            var x1 = bezier[0];
            var y1 = bezier[1];
            var x2 = bezier[2];
            var y2 = bezier[3];
            if (t < 0) t = 0;
            if (t > 1) t = 1;
            var solvedT = _solveBezierX(x1, x2, t);
            return _bezierAt(y1, y2, solvedT);
        };
    }

    function _generateBezierExpressionCode(bezier) {
        var x1 = Math.max(0, Math.min(1, parseFloat(bezier[0]) || 0.25));
        var y1 = parseFloat(bezier[1]) || 0.25;
        var x2 = Math.max(0, Math.min(1, parseFloat(bezier[2]) || 0.75));
        var y2 = parseFloat(bezier[3]) || 0.75;

        var expr = '';
        expr += '(function(T){';
        expr += 'function bezierAt(a1,a2,t){var omt=1-t;return 3*omt*omt*t*a1+3*omt*t*t*a2+t*t*t;}';
        expr += 'function bezierSlope(a1,a2,t){var omt=1-t;return 3*omt*omt*a1+6*omt*t*(a2-a1)+3*t*t*(1-a2);}';
        expr += 'function solveX(x1,x2,x){var t=x;var i;for(i=0;i<6;i++){var cx=bezierAt(x1,x2,t)-x;var s=bezierSlope(x1,x2,t);if(Math.abs(cx)<0.000001)return t;if(Math.abs(s)<0.000001)break;t-=cx/s;}var lo=0;var hi=1;t=x;for(i=0;i<20;i++){var ex=bezierAt(x1,x2,t);if(Math.abs(ex-x)<0.000001)break;if(ex<x)lo=t;else hi=t;t=(lo+hi)/2;}return t;}';
        expr += 'var x=T; if (x<0) x=0; if (x>1) x=1;';
        expr += 'var st=solveX(' + x1.toFixed(6) + ',' + x2.toFixed(6) + ',x);';
        expr += 'return bezierAt(' + y1.toFixed(6) + ',' + y2.toFixed(6) + ',st);';
        expr += '})(t)';

        return expr;
    }

    function _registerBezierTemplate(id, name, bezier, subcategory) {
        register({
            id: id,
            name: name,
            category: 'builtIn',
            subcategory: subcategory || 'bezier',
            runtimeFn: _createBezierRuntime(bezier),
            expressionCode: _generateBezierExpressionCode(bezier)
        });
    }

    var templates = (typeof EasingDefaults !== 'undefined' && EasingDefaults.BEZIER_TEMPLATES)
        ? EasingDefaults.BEZIER_TEMPLATES
        : [
            ['easeInSine', 'easeInSine', [0.12, 0.00, 0.39, 0.00], 'sine'],
            ['easeOutSine', 'easeOutSine', [0.61, 1.00, 0.88, 1.00], 'sine'],
            ['easeInOutSine', 'easeInOutSine', [0.37, 0.00, 0.63, 1.00], 'sine'],
            ['easeInQuad', 'easeInQuad', [0.11, 0.00, 0.50, 0.00], 'power'],
            ['easeOutQuad', 'easeOutQuad', [0.50, 1.00, 0.89, 1.00], 'power'],
            ['easeInOutQuad', 'easeInOutQuad', [0.45, 0.00, 0.55, 1.00], 'power'],
            ['easeInCubic', 'easeInCubic', [0.32, 0.00, 0.67, 0.00], 'power'],
            ['easeOutCubic', 'easeOutCubic', [0.33, 1.00, 0.68, 1.00], 'power'],
            ['easeInOutCubic', 'easeInOutCubic', [0.65, 0.00, 0.35, 1.00], 'power'],
            ['easeInQuart', 'easeInQuart', [0.50, 0.00, 0.75, 0.00], 'power'],
            ['easeOutQuart', 'easeOutQuart', [0.25, 1.00, 0.50, 1.00], 'power'],
            ['easeInOutQuart', 'easeInOutQuart', [0.76, 0.00, 0.24, 1.00], 'power'],
            ['easeInQuint', 'easeInQuint', [0.64, 0.00, 0.78, 0.00], 'power'],
            ['easeOutQuint', 'easeOutQuint', [0.22, 1.00, 0.36, 1.00], 'power'],
            ['easeInOutQuint', 'easeInOutQuint', [0.83, 0.00, 0.17, 1.00], 'power'],
            ['easeInExpo', 'easeInExpo', [0.70, 0.00, 0.84, 0.00], 'expo_circ'],
            ['easeOutExpo', 'easeOutExpo', [0.16, 1.00, 0.30, 1.00], 'expo_circ'],
            ['easeInOutExpo', 'easeInOutExpo', [0.87, 0.00, 0.13, 1.00], 'expo_circ'],
            ['easeInCirc', 'easeInCirc', [0.55, 0.00, 1.00, 0.45], 'expo_circ'],
            ['easeOutCirc', 'easeOutCirc', [0.00, 0.55, 0.45, 1.00], 'expo_circ'],
            ['easeInOutCirc', 'easeInOutCirc', [0.85, 0.00, 0.15, 1.00], 'expo_circ'],
            ['easeInBack', 'easeInBack', [0.36, 0.00, 0.66, -0.56], 'back_adv'],
            ['easeOutBack', 'easeOutBack', [0.34, 1.56, 0.64, 1.00], 'back_adv'],
            ['easeInOutBack', 'easeInOutBack', [0.68, -0.60, 0.32, 1.60], 'back_adv']
        ];

    templates.forEach(function (item) {
        _registerBezierTemplate(item[0], item[1], item[2], item[3]);
    });

    return {
        register: register,
        has: has,
        get: get,
        getRuntime: getRuntime,
        getExpression: getExpression,
        list: list,
        createBezierRuntime: _createBezierRuntime,
        generateBezierExpressionCode: _generateBezierExpressionCode
    };
})();
