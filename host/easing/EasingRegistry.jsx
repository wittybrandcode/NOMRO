/**
 * NOMRO - Host Easing Registry
 * Clean registry facade for After Effects ExtendScript environment.
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
    if (NOMRO.easing && NOMRO.easing.has) {
        return NOMRO.easing.has(id);
    }
    var defs = NOMRO.easingRegistry._getDefs();
    return defs[id] !== undefined;
};

NOMRO.easingRegistry.get = function (id) {
    if (NOMRO.easing && NOMRO.easing.get) {
        return NOMRO.easing.get(id);
    }
    var defs = NOMRO.easingRegistry._getDefs();
    return defs[id] || 't';
};

NOMRO.easingRegistry.list = function () {
    var golden = ['smoothOut', 'snappyOut', 'easeInOut', 'linear', 'overshoot'];
    var out = [];

    for (var i = 0; i < golden.length; i++) {
        var key = golden[i];
        out.push({ id: key, expressionCode: NOMRO.easingRegistry.get(key) });
    }

    return out;
};
