/**
 * NOMRO - Easing Migrator
 * Handles backward-compatible migration of easing settings into schema v2.
 * @module easing/EasingMigrator
 */
var EasingMigrator = (function () {
    'use strict';

    var TARGET_SCHEMA_VERSION = 2;

    var DEFAULT_DUAL = (typeof EasingDefaults !== 'undefined' && EasingDefaults.DEFAULT_DUAL)
        ? EasingDefaults.DEFAULT_DUAL
        : {
            inCurveId: 'easeIn',
            outCurveId: 'easeOut',
            inPct: 0.20,
            outPct: 0.20,
            middleMode: 'linear'
        };

    var DEFAULT_CONFIG = (typeof EasingDefaults !== 'undefined' && EasingDefaults.DEFAULT_CONFIG)
        ? EasingDefaults.DEFAULT_CONFIG
        : {
            mode: 'single',
            singleCurveId: 'linear',
            dual: {
                inCurveId: DEFAULT_DUAL.inCurveId,
                outCurveId: DEFAULT_DUAL.outCurveId,
                inPct: DEFAULT_DUAL.inPct,
                outPct: DEFAULT_DUAL.outPct,
                middleMode: DEFAULT_DUAL.middleMode
            }
        };

    function _clone(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    function _toNumber(v, fallback) {
        var n = parseFloat(v);
        return isNaN(n) ? fallback : n;
    }

    function _normalizeCurveId(id, fallback) {
        if (typeof id === 'string' && id) return id;
        return fallback || 'linear';
    }

    function _normalizeMode(mode) {
        return mode === 'dual' ? 'dual' : 'single';
    }

    function _normalizeMiddleMode(mode) {
        return mode === 'easeInOut' ? 'easeInOut' : 'linear';
    }

    function _normalizeDual(dual) {
        dual = dual || {};

        return {
            inCurveId: _normalizeCurveId(dual.inCurveId, DEFAULT_DUAL.inCurveId),
            outCurveId: _normalizeCurveId(dual.outCurveId, DEFAULT_DUAL.outCurveId),
            inPct: _toNumber(dual.inPct, DEFAULT_DUAL.inPct),
            outPct: _toNumber(dual.outPct, DEFAULT_DUAL.outPct),
            middleMode: _normalizeMiddleMode(dual.middleMode)
        };
    }

    /**
     * Migrate incoming settings to schema v2 shape.
     * This function preserves unknown fields and normalizes easing fields only.
     * @param {Object} settings
     * @returns {Object} migrated settings
     */
    function migrateSettings(settings) {
        var clone = _clone(settings);
        var config = clone.easingConfig && typeof clone.easingConfig === 'object'
            ? clone.easingConfig
            : null;

        if (!config) {
            config = {
                mode: 'single',
                singleCurveId: _normalizeCurveId(clone.easing, DEFAULT_CONFIG.singleCurveId),
                dual: _clone(DEFAULT_DUAL)
            };
        } else {
            config = {
                mode: _normalizeMode(config.mode),
                singleCurveId: _normalizeCurveId(config.singleCurveId || clone.easing, DEFAULT_CONFIG.singleCurveId),
                dual: _normalizeDual(config.dual)
            };
        }

        if (!clone.curveLibrary || Object.prototype.toString.call(clone.curveLibrary) !== '[object Array]') {
            clone.curveLibrary = [];
        }

        clone.easingConfig = config;
        clone.schemaVersion = TARGET_SCHEMA_VERSION;
        clone.easing = (config.mode === 'single')
            ? config.singleCurveId
            : config.dual.outCurveId;

        return clone;
    }

    return {
        TARGET_SCHEMA_VERSION: TARGET_SCHEMA_VERSION,
        DEFAULT_CONFIG: _clone(DEFAULT_CONFIG),
        migrateSettings: migrateSettings
    };
})();
