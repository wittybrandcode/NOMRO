/**
 * NOMRO - Preset Defaults
 * 18 Curated Golden Factory Presets (6 Counters, 6 Timers, 6 Markers)
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
                useMarkers: false,
                layerMarkers: true,
                effects: [
                    { matchName: 'ADBE Drop Shadow', opacity: 40, distance: 5, softness: 10 }
                ]
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
                useMarkers: false,
                layerMarkers: true,
                effects: [
                    { matchName: 'ADBE Drop Shadow', opacity: 50, distance: 4, softness: 8 }
                ]
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
                fps: 30,
                layerMarkers: true
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
                fps: 30,
                layerMarkers: true
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
                fps: 30,
                layerMarkers: true,
                effects: [
                    { matchName: 'ADBE Glo2', threshold: 50, radius: 25, intensity: 1.5 }
                ]
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
        },

        // ==========================================
        // MARKERS / NODES (6 GOLDEN PRESETS)
        // ==========================================
        {
            id: 'factory_nodes_milestone_progression',
            name: 'Milestone 3-Tier Steps',
            category: 'nodes',
            description: 'Multi-stage milestone progression (100 -> 500 -> 1,000) with holding periods and waypoint markers',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'nodes',
                numberFormat: 'normal',
                symbol: '',
                suffix: ' pts',
                separator: ',',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: true,
                easing: 'smoothOut',
                easeStrength: 75,
                nodes: [
                    { id: 'node_m1', type: 'number', value: 100, time: 0.0, hold: 0.5, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_m2', type: 'number', value: 500, time: 2.0, hold: 1.0, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_m3', type: 'number', value: 1000, time: 4.5, hold: 0.0, easing: 'snappyOut', easeStrength: 85 }
                ]
            }
        },
        {
            id: 'factory_nodes_launch_countdown',
            name: 'Rocket Launch Sequence',
            category: 'nodes',
            description: 'Precision countdown passing zero into blast-off status text with colored sequence markers',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'nodes',
                numberFormat: 'normal',
                symbol: '',
                suffix: '',
                separator: ':',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: false,
                easing: 'linear',
                easeStrength: 75,
                nodes: [
                    { id: 'node_l1', type: 'time', value: '00:00:10', time: 0.0, hold: 0.0, easing: 'linear', easeStrength: 75, timeFormat: 'ms' },
                    { id: 'node_l2', type: 'time', value: '00:00:00', time: 5.0, hold: 0.5, easing: 'linear', easeStrength: 75, timeFormat: 'ms' },
                    { id: 'node_l3', type: 'text', value: 'LIFT OFF!', time: 6.0, hold: 1.0, easing: 'snappyOut', easeStrength: 90 }
                ]
            }
        },
        {
            id: 'factory_nodes_crypto_surge',
            name: 'Market Surge & Profit Pulse',
            category: 'nodes',
            description: 'Dynamic market valuation rally ($45 -> $120 -> +166% -> $350 ATH)',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'nodes',
                numberFormat: 'normal',
                symbol: '$',
                suffix: '',
                separator: ',',
                formatPos: 'left',
                monospace: true,
                decimals: true,
                commas: true,
                easing: 'smoothOut',
                easeStrength: 75,
                nodes: [
                    { id: 'node_c1', type: 'number', value: 45.0, time: 0.0, hold: 0.0, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_c2', type: 'number', value: 120.0, time: 2.0, hold: 0.5, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_c3', type: 'delta', value: 166.7, time: 3.5, hold: 0.8, easing: 'snappyOut', easeStrength: 85, deltaSymbol: '+', deltaSuffix: '%' },
                    { id: 'node_c4', type: 'number', value: 350.0, time: 5.5, hold: 0.0, easing: 'overshoot', easeStrength: 80 }
                ],
                effects: [
                    { matchName: 'ADBE Glo2', threshold: 60, radius: 20, intensity: 1.2 }
                ]
            }
        },
        {
            id: 'factory_nodes_gaming_multiplier',
            name: 'Gaming Multiplier Combo',
            category: 'nodes',
            description: 'Rapid combo acceleration from 1.0x to 10.0x ending in MAX COMBO! badge',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'nodes',
                numberFormat: 'normal',
                symbol: '',
                suffix: 'x',
                separator: '',
                formatPos: 'left',
                monospace: true,
                decimals: true,
                commas: false,
                easing: 'snappyOut',
                easeStrength: 80,
                nodes: [
                    { id: 'node_g1', type: 'number', value: 1.0, time: 0.0, hold: 0.0, easing: 'smoothOut', easeStrength: 70 },
                    { id: 'node_g2', type: 'number', value: 3.5, time: 1.5, hold: 0.3, easing: 'snappyOut', easeStrength: 80 },
                    { id: 'node_g3', type: 'number', value: 10.0, time: 3.0, hold: 0.5, easing: 'overshoot', easeStrength: 85 },
                    { id: 'node_g4', type: 'text', value: 'MAX COMBO!', time: 4.2, hold: 0.0, easing: 'snappyOut', easeStrength: 90 }
                ],
                effects: [
                    { matchName: 'ADBE Drop Shadow', opacity: 60, distance: 6, softness: 12 }
                ]
            }
        },
        {
            id: 'factory_nodes_workout_circuit',
            name: 'HIIT Interval Circuit',
            category: 'nodes',
            description: 'Workout circuit with time blocks and rest states (WORK: 30s -> 00:30 -> 00:00 -> REST!)',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'nodes',
                numberFormat: 'normal',
                symbol: '',
                suffix: '',
                separator: ':',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: false,
                easing: 'linear',
                easeStrength: 75,
                nodes: [
                    { id: 'node_w1', type: 'text', value: 'WORK: 30s', time: 0.0, hold: 0.5, easing: 'snappyOut', easeStrength: 75 },
                    { id: 'node_w2', type: 'time', value: '00:00:30', time: 0.6, hold: 0.0, easing: 'linear', easeStrength: 75, timeFormat: 'ms' },
                    { id: 'node_w3', type: 'time', value: '00:00:00', time: 4.0, hold: 0.5, easing: 'linear', easeStrength: 75, timeFormat: 'ms' },
                    { id: 'node_w4', type: 'text', value: 'REST!', time: 4.6, hold: 1.0, easing: 'smoothOut', easeStrength: 80 }
                ]
            }
        },
        {
            id: 'factory_nodes_split_chrono',
            name: 'Precision Checkpoint Chrono',
            category: 'nodes',
            description: 'Multi-checkpoint racing sequence across 3 split times (0 -> 250 -> 750 -> 1,000)',
            isFactory: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            settings: {
                counterType: 'nodes',
                numberFormat: 'normal',
                symbol: '',
                suffix: '',
                separator: ',',
                formatPos: 'left',
                monospace: true,
                decimals: false,
                commas: true,
                easing: 'smoothOut',
                easeStrength: 75,
                nodes: [
                    { id: 'node_p1', type: 'number', value: 0, time: 0.0, hold: 0.2, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_p2', type: 'number', value: 250, time: 1.5, hold: 0.4, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_p3', type: 'number', value: 750, time: 3.0, hold: 0.4, easing: 'smoothOut', easeStrength: 75 },
                    { id: 'node_p4', type: 'number', value: 1000, time: 4.5, hold: 0.0, easing: 'smoothOut', easeStrength: 75 }
                ]
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

