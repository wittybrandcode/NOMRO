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

    function validate(config) {
        if (!config || typeof config !== 'object') {
            return { valid: false, errors: ['Easing configuration must be an object'] };
        }
        return { valid: true, errors: [] };
    }

    return {
        normalizeCurveId: normalizeCurveId,
        sanitizeConfig: sanitizeConfig,
        sanitizeSettings: sanitizeSettings,
        validate: validate
    };
})();
