/**
 * NOMRO - Preset Defaults
 * 12 Curated Golden Factory Presets (6 Counters, 6 Timers)
 * Standardized for Motion Designers and Video Editors
 * @module presets/PresetDefaults
 */
var PresetDefaults = (function () {
    'use strict';

    var FACTORY_PRESETS = [
        // ==========================================
        // COUNTERS (6 GOLDEN PRESETS)
        // ==========================================
        {
            id: 'factory_counter_social_metric',
            name: 'Social Metric (250K+)',
            category: 'counter',
            description: 'Snappy burst for followers, views, and reach',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'basic',
                start: 0,
                end: 250000,
                duration: 2.0,
                easing: 'snappyOut',
                easeStrength: 85,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'snappyOut',
                    easeStrength: 85
                },
                curveLibrary: [],
                numberFormat: 'normal',
                symbol: '',
                suffix: '+',
                separator: ',',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: true,
                useMarkers: false
            }
        },
        {
            id: 'factory_counter_finance_revenue',
            name: 'Finance Revenue ($1.5M)',
            category: 'counter',
            description: 'Smooth cubic easing for revenue and funding',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'basic',
                start: 0,
                end: 1500000,
                duration: 3.0,
                easing: 'smoothOut',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'smoothOut',
                    easeStrength: 75
                },
                curveLibrary: [],
                numberFormat: 'normal',
                symbol: '$',
                suffix: ' USD',
                separator: ',',
                formatPos: 'left',
                monospace: false,
                decimals: false,
                commas: true,
                useMarkers: false
            }
        },
        {
            id: 'factory_counter_progress_percent',
            name: 'Progress Percent (100%)',
            category: 'counter',
            description: 'Balanced ease in-out for loading bars and stats',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'basic',
                start: 0,
                end: 100,
                duration: 2.0,
                easing: 'easeInOut',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'easeInOut',
                    easeStrength: 75
                },
                curveLibrary: [],
                numberFormat: 'normal',
                symbol: '',
                suffix: '%',
                separator: '',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: false,
                useMarkers: false
            }
        },
        {
            id: 'factory_counter_precision_decimal',
            name: 'Precision Decimal (99.95s)',
            category: 'counter',
            description: 'High-accuracy decimal counter with two fractional digits',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'basic',
                start: 0.00,
                end: 99.95,
                duration: 2.5,
                easing: 'smoothOut',
                easeStrength: 70,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'smoothOut',
                    easeStrength: 70
                },
                curveLibrary: [],
                numberFormat: 'normal',
                symbol: '',
                suffix: 's',
                separator: '',
                formatPos: 'left',
                monospace: true,
                decimals: true,
                commas: false,
                useMarkers: false
            }
        },
        {
            id: 'factory_counter_kinetic_spring',
            name: 'Kinetic Spring (100-0)',
            category: 'counter',
            description: 'Dynamic spring overshoot for game countdowns',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'basic',
                start: 100,
                end: 0,
                duration: 1.5,
                easing: 'overshoot',
                easeStrength: 85,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'overshoot',
                    easeStrength: 85
                },
                curveLibrary: [],
                numberFormat: 'normal',
                symbol: '',
                suffix: '',
                separator: '',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: false,
                useMarkers: false
            }
        },
        {
            id: 'factory_counter_clean_minimal',
            name: 'Clean Minimal (0-1,000)',
            category: 'counter',
            description: 'Pure uniform velocity for steady tech UI',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'basic',
                start: 0,
                end: 1000,
                duration: 2.0,
                easing: 'linear',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    easeStrength: 75
                },
                curveLibrary: [],
                numberFormat: 'normal',
                symbol: '',
                suffix: '',
                separator: ',',
                formatPos: 'left',
                monospace: false,
                decimals: false,
                commas: true,
                useMarkers: false
            }
        },

        // ==========================================
        // TIMERS (6 GOLDEN PRESETS)
        // ==========================================
        {
            id: 'factory_timer_boxing_hiit',
            name: 'Boxing / HIIT (3 Min)',
            category: 'timer',
            description: '3-minute round countdown for sports & workouts',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'timer',
                start: 180,
                end: 0,
                durationMode: 'manual',
                duration: 180,
                startAt: 0,
                format: 'ms',
                monospace: true,
                easing: 'linear',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    easeStrength: 75
                },
                curveLibrary: [],
                fps: 30
            }
        },
        {
            id: 'factory_timer_pomodoro_sprint',
            name: 'Pomodoro Focus (25 Min)',
            category: 'timer',
            description: 'Classic 25-minute productivity timer',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'timer',
                start: 1500,
                end: 0,
                durationMode: 'manual',
                duration: 1500,
                startAt: 0,
                format: 'ms',
                monospace: true,
                easing: 'linear',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    easeStrength: 75
                },
                curveLibrary: [],
                fps: 30
            }
        },
        {
            id: 'factory_timer_broadcast_timecode',
            name: 'Broadcast Timecode (30fps)',
            category: 'timer',
            description: 'SMPTE timecode with hours, minutes, seconds & frames',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'timer',
                start: 0,
                end: 90,
                durationMode: 'manual',
                duration: 10,
                startAt: 0,
                format: 'hmsf',
                monospace: true,
                easing: 'linear',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    easeStrength: 75
                },
                curveLibrary: [],
                fps: 30
            }
        },
        {
            id: 'factory_timer_speedrun_millis',
            name: 'Speedrun Timer (msf)',
            category: 'timer',
            description: 'Ultra-fast frame & millisecond sports clock',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'timer',
                start: 0,
                end: 135,
                durationMode: 'manual',
                duration: 10,
                startAt: 0,
                format: 'msf',
                monospace: true,
                easing: 'linear',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    easeStrength: 75
                },
                curveLibrary: [],
                fps: 30
            }
        },
        {
            id: 'factory_timer_new_year_countdown',
            name: 'New Year Countdown (10s)',
            category: 'timer',
            description: 'Explosive 10-second rocket launch with spring easing',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'timer',
                start: 10,
                end: 0,
                durationMode: 'manual',
                duration: 10,
                startAt: 0,
                format: 's',
                monospace: true,
                easing: 'overshoot',
                easeStrength: 80,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'overshoot',
                    easeStrength: 80
                },
                curveLibrary: [],
                fps: 30
            }
        },
        {
            id: 'factory_timer_digital_clock',
            name: 'Digital Clock (12:00-12:05)',
            category: 'timer',
            description: 'Classic digital wall clock time progression',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'timer',
                start: 43200,
                end: 43500,
                durationMode: 'manual',
                duration: 10,
                startAt: 0,
                format: 'hms',
                monospace: true,
                easing: 'linear',
                easeStrength: 75,
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    easeStrength: 75
                },
                curveLibrary: [],
                fps: 30
            }
        }
    ];

    /**
     * Get a deep copy of all factory presets
     * @returns {Array} Factory presets
     */
    function getFactoryPresets() {
        try {
            return JSON.parse(JSON.stringify(FACTORY_PRESETS));
        } catch (e) {
            return FACTORY_PRESETS.slice(0);
        }
    }

    return {
        FACTORY_PRESETS: FACTORY_PRESETS,
        getFactoryPresets: getFactoryPresets
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresetDefaults;
}
