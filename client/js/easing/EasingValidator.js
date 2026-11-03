/**
 * NOMRO - Easing Validator and Migration
 * @module easing/EasingValidator
 */
var EasingValidator = (function () {
    'use strict';

    var LIMITS = (typeof EasingDefaults !== 'undefined' && EasingDefaults.LIMITS)
        ? EasingDefaults.LIMITS
        : {
            MIN_PHASE: 0.05,
            MAX_PHASE: 0.90,
            MAX_PHASE_SUM: 0.95
        };

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

    function _clamp(v, min, max) {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    function _normalizeMiddleMode(mode) {
        return mode === 'easeInOut' ? 'easeInOut' : 'linear';
    }

    function _normalizeCurveId(id) {
        if (typeof id !== 'string' || !id) return 'linear';
        return id;
    }

    function _curveExists(id, curveLibrary) {
        if (typeof id !== 'string' || !id) return false;

        if (typeof EasingRegistry !== 'undefined' && EasingRegistry.has(id)) {
            return true;
        }

        if (curveLibrary && Object.prototype.toString.call(curveLibrary) === '[object Array]') {
            for (var i = 0; i < curveLibrary.length; i++) {
                if (curveLibrary[i] && curveLibrary[i].id === id) {
                    return true;
                }
            }
        }

        return false;
    }

    function _normalizeDual(dual) {
        dual = dual || {};

        var inPct = _clamp(_toNumber(dual.inPct, DEFAULT_DUAL.inPct), LIMITS.MIN_PHASE, LIMITS.MAX_PHASE);
        var outPct = _clamp(_toNumber(dual.outPct, DEFAULT_DUAL.outPct), LIMITS.MIN_PHASE, LIMITS.MAX_PHASE);

        if (inPct + outPct > LIMITS.MAX_PHASE_SUM) {
            var scale = LIMITS.MAX_PHASE_SUM / (inPct + outPct);
            inPct *= scale;
            outPct *= scale;
        }

        return {
            inCurveId: _normalizeCurveId(dual.inCurveId || DEFAULT_DUAL.inCurveId),
            outCurveId: _normalizeCurveId(dual.outCurveId || DEFAULT_DUAL.outCurveId),
            inPct: inPct,
            outPct: outPct,
            middleMode: _normalizeMiddleMode(dual.middleMode)
        };
    }

    function sanitizeConfig(config) {
        config = config || {};
        var mode = config.mode === 'dual' ? 'dual' : 'single';

        return {
            mode: mode,
            singleCurveId: _normalizeCurveId(config.singleCurveId || 'linear'),
            dual: _normalizeDual(config.dual)
        };
    }

    function sanitizeSettings(settings) {
        settings = settings || {};
        var clone = _clone(settings);

        if (typeof EasingMigrator !== 'undefined' && typeof EasingMigrator.migrateSettings === 'function') {
            clone = EasingMigrator.migrateSettings(clone);
        }

        if (!clone.easingConfig) {
            clone.easingConfig = {
                mode: 'single',
                singleCurveId: _normalizeCurveId(clone.easing || 'linear'),
                dual: _clone(DEFAULT_DUAL)
            };
        }

        clone.easingConfig = sanitizeConfig(clone.easingConfig);
        clone.schemaVersion = 2;

        if (!clone.curveLibrary || Object.prototype.toString.call(clone.curveLibrary) !== '[object Array]') {
            clone.curveLibrary = [];
        }

        clone.easing = (clone.easingConfig.mode === 'single')
            ? clone.easingConfig.singleCurveId
            : clone.easingConfig.dual.outCurveId;

        return clone;
    }

    function validateStrict(settings) {
        var errors = [];
        settings = settings || {};

        if (settings.schemaVersion !== 2) {
            errors.push('schemaVersion must be 2');
        }

        if (!settings.easingConfig || typeof settings.easingConfig !== 'object') {
            errors.push('easingConfig is required');
            return { valid: false, errors: errors };
        }

        var config = settings.easingConfig;
        if (config.mode !== 'single' && config.mode !== 'dual') {
            errors.push('easingConfig.mode must be single or dual');
        }

        if (config.mode === 'single') {
            if (!config.singleCurveId || typeof config.singleCurveId !== 'string') {
                errors.push('singleCurveId is required in single mode');
            } else if (!_curveExists(config.singleCurveId, settings.curveLibrary)) {
                errors.push('singleCurveId is unknown: ' + config.singleCurveId);
            }
        }

        if (config.mode === 'dual') {
            if (!config.dual || typeof config.dual !== 'object') {
                errors.push('dual config is required in dual mode');
            } else {
                var d = config.dual;
                var inPct = _toNumber(d.inPct, NaN);
                var outPct = _toNumber(d.outPct, NaN);

                if (isNaN(inPct) || inPct < LIMITS.MIN_PHASE || inPct > LIMITS.MAX_PHASE) {
                    errors.push('dual.inPct out of range [' + LIMITS.MIN_PHASE + ', ' + LIMITS.MAX_PHASE + ']');
                }
                if (isNaN(outPct) || outPct < LIMITS.MIN_PHASE || outPct > LIMITS.MAX_PHASE) {
                    errors.push('dual.outPct out of range [' + LIMITS.MIN_PHASE + ', ' + LIMITS.MAX_PHASE + ']');
                }
                if (!isNaN(inPct) && !isNaN(outPct) && (inPct + outPct > LIMITS.MAX_PHASE_SUM)) {
                    errors.push('dual.inPct + dual.outPct must be <= ' + LIMITS.MAX_PHASE_SUM);
                }
                if (d.middleMode !== 'linear' && d.middleMode !== 'easeInOut') {
                    errors.push('dual.middleMode must be linear or easeInOut');
                }
                if (!_curveExists(d.inCurveId, settings.curveLibrary)) {
                    errors.push('dual.inCurveId is unknown: ' + d.inCurveId);
                }
                if (!_curveExists(d.outCurveId, settings.curveLibrary)) {
                    errors.push('dual.outCurveId is unknown: ' + d.outCurveId);
                }
            }
        }

        if (settings.curveLibrary && Object.prototype.toString.call(settings.curveLibrary) === '[object Array]') {
            var curveIds = {};

            for (var i = 0; i < settings.curveLibrary.length; i++) {
                var curve = settings.curveLibrary[i] || {};

                if (!curve.id || typeof curve.id !== 'string') {
                    errors.push('curveLibrary[' + i + '].id is required');
                } else if (curveIds[curve.id]) {
                    errors.push('curveLibrary has duplicate id: ' + curve.id);
                } else {
                    curveIds[curve.id] = true;
                }

                if (curve.type === 'bezier') {
                    var bezier = curve.bezier || [];
                    if (bezier.length !== 4) {
                        errors.push('curveLibrary[' + i + '].bezier must contain 4 values');
                    } else {
                        var x1 = _toNumber(bezier[0], NaN);
                        var x2 = _toNumber(bezier[2], NaN);
                        if (isNaN(x1) || x1 < 0 || x1 > 1) {
                            errors.push('curveLibrary[' + i + '].bezier x1 must be in [0,1]');
                        }
                        if (isNaN(x2) || x2 < 0 || x2 > 1) {
                            errors.push('curveLibrary[' + i + '].bezier x2 must be in [0,1]');
                        }
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    return {
        LIMITS: LIMITS,
        DEFAULT_CONFIG: _clone(DEFAULT_CONFIG),
        sanitizeConfig: sanitizeConfig,
        sanitizeSettings: sanitizeSettings,
        validateStrict: validateStrict
    };
})();
