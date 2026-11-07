/**
 * NOMRO - Easing Runtime
 * Unified and ultra-fast parametric easing evaluation for client-side live preview.
 * Supports dynamic strength/influence scaling (20% - 95%).
 * @module easing/EasingRuntime
 */
var EasingRuntime = (function () {
    'use strict';

    function _clamp01(v) {
        if (v <= 0) return 0;
        if (v >= 1) return 1;
        return v;
    }

    function _normalizeStrength(s) {
        var num = parseFloat(s);
        if (isNaN(num)) num = 75;
        if (num < 10) num = 10;
        if (num > 100) num = 100;
        return num / 75; // Normalized relative to 75% baseline (1.0 at default 75%)
    }

    function evaluateById(id, t, strength) {
        t = _clamp01(t);
        var ratio = _normalizeStrength(strength !== undefined ? strength : 75);

        // Resolve curve ID through defaults if needed
        var resolved = id;
        if (typeof EasingDefaults !== 'undefined' && EasingDefaults.resolveCurveId) {
            resolved = EasingDefaults.resolveCurveId(id);
        }

        switch (resolved) {
            case 'linear':
                return t;

            case 'snappyOut':
                var pSnappy = 1 + ratio * 4; // Power = 5.0 at 75%
                return 1 - Math.pow(1 - t, pSnappy);

            case 'easeInOut':
                var pInOut = 1 + ratio * 2; // Power = 3.0 at 75%
                return t < 0.5
                    ? 0.5 * Math.pow(2 * t, pInOut)
                    : 1 - 0.5 * Math.pow(2 * (1 - t), pInOut);

            case 'overshoot':
                var sFactor = ratio * 1.70158; // Standard 1.70158 back ease at 75%
                var p = t - 1;
                return 1 + ((1 + sFactor) * p + sFactor) * p * p;

            case 'easeIn':
                var pIn = 1 + ratio * 2; // Power = 3.0 at 75%
                return Math.pow(t, pIn);

            case 'smoothOut':
            default:
                var pSmooth = 1 + ratio * 2; // Power = 3.0 at 75% (exact cubic deceleration)
                return 1 - Math.pow(1 - t, pSmooth);
        }
    }

    function evaluateConfig(config, t) {
        t = _clamp01(t);

        if (!config || typeof config !== 'object') {
            return evaluateById('smoothOut', t, 75);
        }

        var strength = config.easeStrength !== undefined ? config.easeStrength : 75;

        // Legacy dual mode fallback: use outCurveId as dominant deceleration
        if (config.mode === 'dual' && config.dual && config.dual.outCurveId) {
            return evaluateById(config.dual.outCurveId, t, strength);
        }

        var curveId = config.singleCurveId || config.easing || 'smoothOut';
        return evaluateById(curveId, t, strength);
    }

    function evaluateSettings(settings, t) {
        settings = settings || {};
        var strength = settings.easeStrength !== undefined
            ? settings.easeStrength
            : (settings.easingConfig && settings.easingConfig.easeStrength !== undefined ? settings.easingConfig.easeStrength : 75);

        var config = settings.easingConfig || {
            mode: 'single',
            singleCurveId: settings.easing || 'smoothOut',
            easeStrength: strength
        };

        if (config.easeStrength === undefined) {
            config.easeStrength = strength;
        }

        return evaluateConfig(config, t);
    }

    function evaluateCounterState(counterState, t) {
        counterState = counterState || {};
        var strength = counterState.easeStrength !== undefined
            ? counterState.easeStrength
            : (counterState.easingConfig && counterState.easingConfig.easeStrength !== undefined ? counterState.easingConfig.easeStrength : 75);

        var settingsLike = {
            schemaVersion: 2,
            easing: counterState.easing || 'smoothOut',
            easeStrength: strength,
            easingConfig: counterState.easingConfig || {
                mode: 'single',
                singleCurveId: counterState.easing || 'smoothOut',
                easeStrength: strength
            },
            curveLibrary: []
        };

        return evaluateSettings(settingsLike, t);
    }

    return {
        evaluateById: evaluateById,
        evaluateConfig: evaluateConfig,
        evaluateSettings: evaluateSettings,
        evaluateCounterState: evaluateCounterState
    };
})();
