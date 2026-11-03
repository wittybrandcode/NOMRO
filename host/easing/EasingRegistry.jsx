/**
 * NOMRO - Host Easing Registry
 * Lightweight registry facade around NOMRO.easing._defs.
 * @module easing/EasingRegistry
 */

NOMRO.easingRegistry = NOMRO.easingRegistry || {};

NOMRO.easingRegistry._getDefs = function () {
    NOMRO.easing = NOMRO.easing || {};
    NOMRO.easing._defs = NOMRO.easing._defs || {};
    return NOMRO.easing._defs;
};

NOMRO.easingRegistry.register = function (id, expressionCode) {
    if (!id || !expressionCode) return false;
    var defs = NOMRO.easingRegistry._getDefs();
    defs[id] = expressionCode;
    return true;
};

NOMRO.easingRegistry.has = function (id) {
    var defs = NOMRO.easingRegistry._getDefs();
    return defs[id] !== undefined;
};

NOMRO.easingRegistry.get = function (id) {
    var defs = NOMRO.easingRegistry._getDefs();
    return defs[id] || defs.linear || 't';
};

NOMRO.easingRegistry.list = function () {
    var defs = NOMRO.easingRegistry._getDefs();
    var out = [];

    for (var key in defs) {
        if (defs.hasOwnProperty(key)) {
            out.push({ id: key, expressionCode: defs[key] });
        }
    }

    return out;
};
