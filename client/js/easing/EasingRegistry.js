/**
 * NOMRO - Easing Registry
 * Canonical registry for the 5 Golden Curves with instant mathematical runtime evaluation
 * and clean native After Effects expression generation.
 * @module easing/EasingRegistry
 */
var EasingRegistry = (function () {
    'use strict';

    var _defs = {};

    function _cloneDef(def) {
        return {
            id: def.id,
            name: def.name,
            shortName: def.shortName || def.name,
            description: def.description || '',
            category: def.category || 'golden',
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

    function _resolveId(id) {
        if (!id || typeof id !== 'string') return 'smoothOut';
        if (_defs[id]) return id;
        if (typeof EasingDefaults !== 'undefined' && EasingDefaults.resolveCurveId) {
            var resolved = EasingDefaults.resolveCurveId(id);
            if (_defs[resolved]) return resolved;
        }
        return 'smoothOut';
    }

    function has(id) {
        if (!id) return false;
        if (_defs[id]) return true;
        if (typeof EasingDefaults !== 'undefined' && EasingDefaults.LEGACY_ALIASES && EasingDefaults.LEGACY_ALIASES[id]) {
            return true;
        }
        return false;
    }

    function get(id) {
        var key = _resolveId(id);
        var def = _defs[key] || _defs.smoothOut || _defs.linear;
        return _cloneDef(def);
    }

    function getRuntime(id) {
        return get(id).runtimeFn;
    }

    function getExpression(id) {
        return get(id).expressionCode;
    }

    function list() {
        var out = [];
        var golden = ['smoothOut', 'snappyOut', 'easeInOut', 'linear', 'overshoot'];
        for (var i = 0; i < golden.length; i++) {
            var key = golden[i];
            if (_defs[key]) {
                out.push(_cloneDef(_defs[key]));
            }
        }
        return out;
    }

    // 1. Smooth Out (Golden Default - Graceful Deceleration)
    register({
        id: 'smoothOut',
        name: 'Smooth Out',
        shortName: 'Smooth',
        description: 'Graceful deceleration to landing (تباطؤ تدريجي ناعم - الموصى به)',
        category: 'golden',
        runtimeFn: function (t) {
            return 1 - Math.pow(1 - t, 3);
        },
        expressionCode: '(1 - Math.pow(1 - t, 3))'
    });

    // 2. Snappy Out (High-Energy Tech Style)
    register({
        id: 'snappyOut',
        name: 'Snappy Out',
        shortName: 'Snappy',
        description: 'Fast explosive burst & quick settle (تسارع قوي وهبوط سريع)',
        category: 'golden',
        runtimeFn: function (t) {
            return 1 - Math.pow(1 - t, 5);
        },
        expressionCode: '(1 - Math.pow(1 - t, 5))'
    });

    // 3. Ease In-Out (Balanced S-Curve)
    register({
        id: 'easeInOut',
        name: 'Ease In-Out',
        shortName: 'In-Out',
        description: 'Balanced acceleration & deceleration (انسيابي متوازن)',
        category: 'golden',
        runtimeFn: function (t) {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
        expressionCode: '(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)'
    });

    // 4. Linear (Constant Speed)
    register({
        id: 'linear',
        name: 'Linear',
        shortName: 'Linear',
        description: 'Constant uniform speed (سرعة ثابتة منتظمة)',
        category: 'golden',
        runtimeFn: function (t) {
            return t;
        },
        expressionCode: 't'
    });

    // 5. Spring / Overshoot (Dynamic Snap)
    register({
        id: 'overshoot',
        name: 'Spring',
        shortName: 'Spring',
        description: 'Dynamic overshoot & elastic settle (ارتداد وتجاوز مرن)',
        category: 'golden',
        runtimeFn: function (t) {
            var p = t - 1;
            return 1 + (2.70158 * p + 1.70158) * p * p;
        },
        expressionCode: '(function(t){ var p = t - 1; return 1 + (2.70158 * p + 1.70158) * p * p; })(t)'
    });

    // Legacy Fallback: EaseIn
    register({
        id: 'easeIn',
        name: 'Ease In',
        shortName: 'Ease In',
        description: 'Progressive acceleration (تسارع تصاعدي)',
        category: 'legacy',
        runtimeFn: function (t) {
            return t * t * t;
        },
        expressionCode: '(t * t * t)'
    });

    // Register common aliases directly for fast lookup
    var aliases = (typeof EasingDefaults !== 'undefined' && EasingDefaults.LEGACY_ALIASES)
        ? EasingDefaults.LEGACY_ALIASES
        : {};

    for (var alias in aliases) {
        if (aliases.hasOwnProperty(alias) && !_defs[alias]) {
            (function (a, targetId) {
                if (_defs[targetId]) {
                    var targetDef = _defs[targetId];
                    _defs[a] = {
                        id: a,
                        name: targetDef.name,
                        shortName: targetDef.shortName,
                        description: targetDef.description,
                        category: 'alias',
                        runtimeFn: targetDef.runtimeFn,
                        expressionCode: targetDef.expressionCode
                    };
                }
            })(alias, aliases[alias]);
        }
    }

    return {
        register: register,
        has: has,
        get: get,
        getRuntime: getRuntime,
        getExpression: getExpression,
        list: list
    };
})();
