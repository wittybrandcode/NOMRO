/**
 * NOMRO - Easing Defaults & Shared Constants
 * Single source of truth for the 5 Golden Easing Curves and legacy aliases.
 * @module easing/EasingDefaults
 */
var EasingDefaults = (function () {
    'use strict';

    // The 5 Golden Curves curated specifically for numbers & typography animation
    var GOLDEN_CURVES = [
        {
            id: 'smoothOut',
            name: 'Smooth Out',
            shortName: 'Smooth',
            description: 'Graceful deceleration to landing (تباطؤ تدريجي ناعم - الموصى به)',
            formula: '1 - (1 - t)^3',
            isDefault: true
        },
        {
            id: 'snappyOut',
            name: 'Snappy Out',
            shortName: 'Snappy',
            description: 'Fast explosive burst & quick settle (تسارع قوي وهبوط سريع)',
            formula: '1 - (1 - t)^5'
        },
        {
            id: 'easeInOut',
            name: 'Ease In-Out',
            shortName: 'In-Out',
            description: 'Balanced acceleration & deceleration (انسيابي متوازن)',
            formula: 'Symmetric S-Curve'
        },
        {
            id: 'linear',
            name: 'Linear',
            shortName: 'Linear',
            description: 'Constant uniform speed (سرعة ثابتة منتظمة)',
            formula: 't'
        },
        {
            id: 'overshoot',
            name: 'Spring',
            shortName: 'Spring',
            description: 'Dynamic overshoot & elastic settle (ارتداد وتجاوز مرن)',
            formula: 'Back Out (s = 1.70158)'
        }
    ];

    // Canonical map for legacy presets and After Effects project backwards compatibility
    var LEGACY_ALIASES = {
        // Standard easeOut aliases -> smoothOut
        'easeOut': 'smoothOut',
        'easeOutQuad': 'smoothOut',
        'easeOutCubic': 'smoothOut',
        'easeOutSine': 'smoothOut',

        // High energy / snappy aliases -> snappyOut
        'easeOutQuart': 'snappyOut',
        'easeOutQuint': 'snappyOut',
        'easeOutExpo': 'snappyOut',
        'easeOutCirc': 'snappyOut',

        // Ease In-Out aliases -> easeInOut
        'easeInOutQuad': 'easeInOut',
        'easeInOutCubic': 'easeInOut',
        'easeInOutSine': 'easeInOut',
        'easeInOutQuart': 'easeInOut',
        'easeInOutQuint': 'easeInOut',
        'easeInOutExpo': 'easeInOut',
        'easeInOutCirc': 'easeInOut',

        // Overshoot / Spring aliases -> overshoot
        'back': 'overshoot',
        'easeOutBack': 'overshoot',
        'easeInOutBack': 'overshoot',
        'bounce': 'overshoot',
        'elastic': 'overshoot',

        // EaseIn aliases
        'easeIn': 'easeIn',
        'easeInQuad': 'easeIn',
        'easeInCubic': 'easeIn',
        'easeInSine': 'easeIn',
        'easeInQuart': 'easeIn',
        'easeInQuint': 'easeIn',
        'easeInExpo': 'easeIn',
        'easeInCirc': 'easeIn',
        'easeInBack': 'overshoot'
    };

    var DEFAULT_CURVE_ID = 'smoothOut';

    var DEFAULT_CONFIG = {
        mode: 'single',
        singleCurveId: DEFAULT_CURVE_ID
    };

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function resolveCurveId(id) {
        if (!id || typeof id !== 'string') return DEFAULT_CURVE_ID;
        for (var i = 0; i < GOLDEN_CURVES.length; i++) {
            if (GOLDEN_CURVES[i].id === id) return id;
        }
        if (LEGACY_ALIASES[id]) {
            return LEGACY_ALIASES[id];
        }
        return DEFAULT_CURVE_ID;
    }

    return {
        GOLDEN_CURVES: GOLDEN_CURVES,
        LEGACY_ALIASES: LEGACY_ALIASES,
        DEFAULT_CURVE_ID: DEFAULT_CURVE_ID,
        DEFAULT_CONFIG: Object.freeze ? Object.freeze(clone(DEFAULT_CONFIG)) : DEFAULT_CONFIG,
        resolveCurveId: resolveCurveId,
        clone: clone
    };
})();
