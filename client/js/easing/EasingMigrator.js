/**
 * NOMRO - Easing Migrator
 * Handles backward-compatible migration of legacy easing settings into the 5 Golden Curves.
 * @module easing/EasingMigrator
 */
var EasingMigrator = (function () {
    'use strict';

    var TARGET_SCHEMA_VERSION = 2;

    var DEFAULT_CURVE_ID = (typeof EasingDefaults !== 'undefined' && EasingDefaults.DEFAULT_CURVE_ID)
        ? EasingDefaults.DEFAULT_CURVE_ID
        : 'smoothOut';

    function _clone(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    function _normalizeCurveId(id) {
        if (typeof EasingDefaults !== 'undefined' && typeof EasingDefaults.resolveCurveId === 'function') {
            return EasingDefaults.resolveCurveId(id);
        }
        return id || DEFAULT_CURVE_ID;
    }

    function migrateSettings(settings) {
        var clone = _clone(settings);
        var config = clone.easingConfig && typeof clone.easingConfig === 'object'
            ? clone.easingConfig
            : null;

        var candidate = clone.easing;
        if (config) {
            if (config.mode === 'dual' && config.dual && config.dual.outCurveId) {
                candidate = config.dual.outCurveId;
            } else if (config.singleCurveId) {
                candidate = config.singleCurveId;
            }
        }

        var resolvedId = _normalizeCurveId(candidate);

        clone.easing = resolvedId;
        clone.easingConfig = {
            mode: 'single',
            singleCurveId: resolvedId
        };
        clone.curveLibrary = [];
        clone.schemaVersion = TARGET_SCHEMA_VERSION;

        return clone;
    }

    return {
        TARGET_SCHEMA_VERSION: TARGET_SCHEMA_VERSION,
        migrateSettings: migrateSettings
    };
})();
