/**
 * NOMRO - Easing Defaults & Shared Constants
 * Single source of truth for easing limits, defaults, and bezier templates.
 * @module easing/EasingDefaults
 */
var EasingDefaults = (function () {
    'use strict';

    var LIMITS = {
        MIN_PHASE: 0.05,
        MAX_PHASE: 0.90,
        MAX_PHASE_SUM: 0.95
    };

    var DEFAULT_DUAL = {
        inCurveId: 'easeIn',
        outCurveId: 'easeOut',
        inPct: 0.20,
        outPct: 0.20,
        middleMode: 'linear'
    };

    var DEFAULT_CONFIG = {
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

    var BEZIER_TEMPLATES = [
        // Sine
        ['easeInSine', 'easeInSine', [0.12, 0.00, 0.39, 0.00], 'sine'],
        ['easeOutSine', 'easeOutSine', [0.61, 1.00, 0.88, 1.00], 'sine'],
        ['easeInOutSine', 'easeInOutSine', [0.37, 0.00, 0.63, 1.00], 'sine'],

        // Power / Quad
        ['easeInQuad', 'easeInQuad', [0.11, 0.00, 0.50, 0.00], 'power'],
        ['easeOutQuad', 'easeOutQuad', [0.50, 1.00, 0.89, 1.00], 'power'],
        ['easeInOutQuad', 'easeInOutQuad', [0.45, 0.00, 0.55, 1.00], 'power'],

        // Power / Cubic
        ['easeInCubic', 'easeInCubic', [0.32, 0.00, 0.67, 0.00], 'power'],
        ['easeOutCubic', 'easeOutCubic', [0.33, 1.00, 0.68, 1.00], 'power'],
        ['easeInOutCubic', 'easeInOutCubic', [0.65, 0.00, 0.35, 1.00], 'power'],

        // Power / Quart
        ['easeInQuart', 'easeInQuart', [0.50, 0.00, 0.75, 0.00], 'power'],
        ['easeOutQuart', 'easeOutQuart', [0.25, 1.00, 0.50, 1.00], 'power'],
        ['easeInOutQuart', 'easeInOutQuart', [0.76, 0.00, 0.24, 1.00], 'power'],

        // Power / Quint
        ['easeInQuint', 'easeInQuint', [0.64, 0.00, 0.78, 0.00], 'power'],
        ['easeOutQuint', 'easeOutQuint', [0.22, 1.00, 0.36, 1.00], 'power'],
        ['easeInOutQuint', 'easeInOutQuint', [0.83, 0.00, 0.17, 1.00], 'power'],

        // Expo
        ['easeInExpo', 'easeInExpo', [0.70, 0.00, 0.84, 0.00], 'expo_circ'],
        ['easeOutExpo', 'easeOutExpo', [0.16, 1.00, 0.30, 1.00], 'expo_circ'],
        ['easeInOutExpo', 'easeInOutExpo', [0.87, 0.00, 0.13, 1.00], 'expo_circ'],

        // Circ
        ['easeInCirc', 'easeInCirc', [0.55, 0.00, 1.00, 0.45], 'expo_circ'],
        ['easeOutCirc', 'easeOutCirc', [0.00, 0.55, 0.45, 1.00], 'expo_circ'],
        ['easeInOutCirc', 'easeInOutCirc', [0.85, 0.00, 0.15, 1.00], 'expo_circ'],

        // Back Advanced
        ['easeInBack', 'easeInBack', [0.36, 0.00, 0.66, -0.56], 'back_adv'],
        ['easeOutBack', 'easeOutBack', [0.34, 1.56, 0.64, 1.00], 'back_adv'],
        ['easeInOutBack', 'easeInOutBack', [0.68, -0.60, 0.32, 1.60], 'back_adv']
    ];

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    return {
        LIMITS: Object.freeze ? Object.freeze(clone(LIMITS)) : LIMITS,
        DEFAULT_DUAL: Object.freeze ? Object.freeze(clone(DEFAULT_DUAL)) : DEFAULT_DUAL,
        DEFAULT_CONFIG: Object.freeze ? Object.freeze(clone(DEFAULT_CONFIG)) : DEFAULT_CONFIG,
        BEZIER_TEMPLATES: BEZIER_TEMPLATES,
        clone: clone
    };
})();
