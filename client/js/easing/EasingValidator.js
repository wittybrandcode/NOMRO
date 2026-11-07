/**
 * NOMRO - Easing Validator and Sanitizer
 * Streamlined validator ensuring clean single-curve configurations.
 * @module easing/EasingValidator
 */
var EasingValidator = (function () {
    'use strict';

    var DEFAULT_CURVE_ID = (typeof EasingDefaults !== 'undefined' && EasingDefaults.DEFAULT_CURVE_ID)
        ? EasingDefaults.DEFAULT_CURVE_ID
        : 'smoothOut';

    var LIMITS = (typeof EasingDefaults !== 'undefined' && EasingDefaults.LIMITS)
        ? EasingDefaults.LIMITS
        : {
            MIN_PHASE: 0.05,
            MAX_PHASE: 0.90,
            MAX_PHASE_SUM: 0.95
        };

    var DEFAULT_CONFIG = (typeof EasingDefaults !== 'undefined' && EasingDefaults.DEFAULT_CONFIG)
        ? EasingDefaults.DEFAULT_CONFIG
        : {
            mode: 'single',
            singleCurveId: DEFAULT_CURVE_ID
        };

    function _clone(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    function normalizeCurveId(id) {
        if (typeof EasingDefaults !== 'undefined' && typeof EasingDefaults.resolveCurveId === 'function') {
            return EasingDefaults.resolveCurveId(id);
        }
        if (typeof id !== 'string' || !id) return DEFAULT_CURVE_ID;
        return id;
    }

    function sanitizeConfig(config) {
        if (!config || typeof config !== 'object') {
            return {
                mode: 'single',
                singleCurveId: DEFAULT_CURVE_ID
            };
        }

        var candidate = config.singleCurveId;

        // If legacy dual mode was passed, resolve from outCurveId
        if (config.mode === 'dual' && config.dual && config.dual.outCurveId) {
            candidate = config.dual.outCurveId;
        }

        var resolvedId = normalizeCurveId(candidate || config.easing);

        return {
            mode: 'single',
            singleCurveId: resolvedId
        };
    }

    function sanitizeSettings(settings) {
        settings = settings ? _clone(settings) : {};

        var config = sanitizeConfig(settings.easingConfig || {
            mode: 'single',
            singleCurveId: settings.easing || DEFAULT_CURVE_ID
        });

        settings.schemaVersion = 2;
        settings.easingConfig = config;
        settings.easing = config.singleCurveId;
        settings.curveLibrary = [];

        return settings;
    }

    function validateStrict(settings) {
        var errors = [];
        settings = settings || {};

        if (!settings.easingConfig || typeof settings.easingConfig !== 'object') {
            errors.push('easingConfig is required');
            return { valid: false, errors: errors };
        }

        var config = settings.easingConfig;
        var curveId = config.singleCurveId || settings.easing;
        if (!curveId) {
            errors.push('singleCurveId is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    return {
        LIMITS: LIMITS,
        DEFAULT_CONFIG: _clone(DEFAULT_CONFIG),
        normalizeCurveId: normalizeCurveId,
        sanitizeConfig: sanitizeConfig,
        sanitizeSettings: sanitizeSettings,
        validate: validateStrict,
        validateStrict: validateStrict
    };
})();
