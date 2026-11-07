/**
 * NOMRO - Easing Runtime
 * Unified and ultra-fast easing evaluation for client-side live preview.
 * @module easing/EasingRuntime
 */
var EasingRuntime = (function () {
    'use strict';

    function _clamp01(v) {
        if (v <= 0) return 0;
        if (v >= 1) return 1;
        return v;
    }

    function evaluateById(id, t) {
        t = _clamp01(t);

        if (typeof EasingRegistry !== 'undefined') {
            return EasingRegistry.getRuntime(id)(t);
        }

        // Direct fallback: Smooth Out
        return 1 - Math.pow(1 - t, 3);
    }

    function evaluateConfig(config, t) {
        t = _clamp01(t);

        if (!config || typeof config !== 'object') {
            return evaluateById('smoothOut', t);
        }

        // Legacy dual mode fallback: use outCurveId as dominant deceleration
        if (config.mode === 'dual' && config.dual && config.dual.outCurveId) {
            return evaluateById(config.dual.outCurveId, t);
        }

        var curveId = config.singleCurveId || config.easing || 'smoothOut';
        return evaluateById(curveId, t);
    }

    function evaluateSettings(settings, t) {
        settings = settings || {};
        var config = settings.easingConfig || {
            mode: 'single',
            singleCurveId: settings.easing || 'smoothOut'
        };
        return evaluateConfig(config, t);
    }

    return {
        evaluateById: evaluateById,
        evaluateConfig: evaluateConfig,
        evaluateSettings: evaluateSettings
    };
})();
