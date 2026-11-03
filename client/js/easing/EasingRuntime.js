/**
 * NOMRO - Easing Runtime
 * Unified easing evaluation for preview/runtime.
 * @module easing/EasingRuntime
 */
var EasingRuntime = (function () {
    'use strict';

    function _clamp01(v) {
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }

    function _findCustomCurve(curveLibrary, id) {
        if (!curveLibrary || Object.prototype.toString.call(curveLibrary) !== '[object Array]') {
            return null;
        }

        for (var i = 0; i < curveLibrary.length; i++) {
            if (curveLibrary[i] && curveLibrary[i].id === id) {
                return curveLibrary[i];
            }
        }

        return null;
    }

    function _evaluateBezier(bezier, t) {
        if (!bezier || bezier.length !== 4) {
            return t;
        }

        var x1 = parseFloat(bezier[0]);
        var y1 = parseFloat(bezier[1]);
        var x2 = parseFloat(bezier[2]);
        var y2 = parseFloat(bezier[3]);

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
            return t;
        }

        if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
            return t;
        }

        if (typeof EasingRegistry !== 'undefined' && typeof EasingRegistry.createBezierRuntime === 'function') {
            return EasingRegistry.createBezierRuntime(bezier)(_clamp01(t));
        }

        return t;
    }

    function evaluateById(id, t, curveLibrary) {
        t = _clamp01(t);

        if (typeof EasingRegistry !== 'undefined' && EasingRegistry.has(id)) {
            return EasingRegistry.getRuntime(id)(t);
        }

        var custom = _findCustomCurve(curveLibrary, id);
        if (custom && custom.type === 'bezier') {
            return _evaluateBezier(custom.bezier, t);
        }

        if (typeof EasingRegistry !== 'undefined' && EasingRegistry.has('linear')) {
            return EasingRegistry.getRuntime('linear')(t);
        }

        return t;
    }

    function _middleEval(p, middleMode) {
        if (middleMode === 'easeInOut') {
            return p < 0.5
                ? 2 * p * p
                : 1 - Math.pow(-2 * p + 2, 2) / 2;
        }
        return p;
    }

    function _evaluateDual(config, t, curveLibrary) {
        var dual = config.dual;
        var i = dual.inPct;
        var o = dual.outPct;
        var m = 1 - i - o;

        if (t < i) {
            var pIn = (i > 0) ? (t / i) : 0;
            return evaluateById(dual.inCurveId, pIn, curveLibrary) * i;
        }

        if (t <= 1 - o) {
            var pMid = m > 0 ? (t - i) / m : 0;
            return i + _middleEval(pMid, dual.middleMode) * m;
        }

        var pOut = o > 0 ? ((t - (1 - o)) / o) : 1;
        return (1 - o) + evaluateById(dual.outCurveId, pOut, curveLibrary) * o;
    }

    function evaluateConfig(config, t, curveLibrary) {
        if (typeof EasingValidator !== 'undefined' && typeof EasingValidator.sanitizeConfig === 'function') {
            config = EasingValidator.sanitizeConfig(config);
        }
        t = _clamp01(t);

        if (config.mode === 'dual') {
            return _evaluateDual(config, t, curveLibrary);
        }

        return evaluateById(config.singleCurveId, t, curveLibrary);
    }

    function evaluateSettings(settings, t) {
        var migrated = (typeof EasingValidator !== 'undefined' && typeof EasingValidator.sanitizeSettings === 'function')
            ? EasingValidator.sanitizeSettings(settings || {})
            : (settings || {});
        return evaluateConfig(migrated.easingConfig, t, migrated.curveLibrary || []);
    }

    function evaluateCounterState(counterState, t) {
        counterState = counterState || {};
        var settingsLike = {
            schemaVersion: 2,
            easing: counterState.easing || 'linear',
            easingConfig: counterState.easingConfig || {
                mode: 'single',
                singleCurveId: counterState.easing || 'linear'
            },
            curveLibrary: counterState.curveLibrary || []
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
