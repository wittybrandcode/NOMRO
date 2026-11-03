/**
 * NOMRO Pro - Timer Parity & Quality Assurance Harness
 * Comprehensive test suite verifying 100% adherence to Timer Elevation Plan
 * 
 * Tests Covered:
 * - [TEST 1] TimerDefaults Unit Conversion & Bi-directionality (50+ cases)
 * - [TEST 2] Negative Time Formatting & Zero Preservation (T-01, T-07)
 * - [TEST 3] Settings Validation & Normalization Schema (T-04, T-09)
 * - [TEST 4] Host Expression Generation & Easing Integration (T-02, T-10)
 * - [TEST 5] Absence of Redundant Millions Sliders (T-03)
 * - [TEST 6] Simulated After Effects Expression Runtime Evaluation
 * - [TEST 7] Preset & State Parity (T-05, T-06, T-08)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Setup environment and load modules
const baseDir = path.resolve(__dirname, '..');
const timerDefaultsPath = path.join(baseDir, 'client', 'js', 'modules', 'timer-defaults.js');
const easingDefaultsPath = path.join(baseDir, 'client', 'js', 'easing', 'EasingDefaults.js');
const expressionGenPath = path.join(baseDir, 'host', 'expressions', 'ExpressionGenerator.jsx');

// Sandbox VM context
const sandbox = {
    console: console,
    Math: Math,
    parseFloat: parseFloat,
    parseInt: parseInt,
    isNaN: isNaN,
    JSON: JSON,
    NOMRO: {
        version: '2.0.0',
        expressions: {},
        core: {}
    }
};

vm.createContext(sandbox);

// Load TimerDefaults
const timerDefaultsCode = fs.readFileSync(timerDefaultsPath, 'utf8');
vm.runInContext(timerDefaultsCode, sandbox);
const TimerDefaults = sandbox.TimerDefaults;

// Load EasingDefaults
const easingDefaultsCode = fs.readFileSync(easingDefaultsPath, 'utf8');
vm.runInContext(easingDefaultsCode, sandbox);

// Load ExpressionGenerator (clean JSX includes)
let exprGenCode = fs.readFileSync(expressionGenPath, 'utf8');
// Clean any JSX specific directives if present
exprGenCode = exprGenCode.replace(/#include/g, '// #include');
vm.runInContext(exprGenCode, sandbox);
const NOMRO = sandbox.NOMRO;

// Test Suite Runner
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    } else {
        failedTests++;
        const failMsg = `  \x1b[31m✖ FAIL\x1b[0m: ${testName} - Details: ${details || 'Assertion failed'}`;
        console.error(failMsg);
        failures.push(failMsg);
    }
}

console.log('\n===============================================================');
console.log('       NOMRO PRO - TIMER PARITY & QA VERIFICATION SUITE       ');
console.log('===============================================================\n');

// -------------------------------------------------------------------
// TEST 1: Unit Conversion & Bi-directionality (50+ cases)
// -------------------------------------------------------------------
console.log('\x1b[36m[TEST 1] Testing Unit Conversion & Bi-directionality...\x1b[0m');

const fpsList = [24, 25, 29.97, 30, 50, 59.94, 60];
const sampleSeconds = [
    0, 0.5, 1, 5, 10, 30, 59, 60, 61, 90, 125.5, 3599, 3600, 3601,
    7200, 7325.25, 86399, 86400, 359999
];

let conversionPassCount = 0;
sampleSeconds.forEach(sec => {
    fpsList.forEach(fps => {
        const units = TimerDefaults.secondsToUnits(sec, fps);
        const reconstructed = TimerDefaults.unitsToSeconds(units.hours, units.mins, units.secs, units.frames, fps);
        
        // Difference must be within 1 frame tolerance
        const frameTolerance = 1 / fps;
        const diff = Math.abs(sec - reconstructed);
        if (diff <= frameTolerance + 0.0001) {
            conversionPassCount++;
        }
    });
});

assert(
    conversionPassCount === sampleSeconds.length * fpsList.length,
    `50+ seconds-to-units conversion cycles (${conversionPassCount}/${sampleSeconds.length * fpsList.length} cases passed)`,
    `Expected all ${sampleSeconds.length * fpsList.length} conversions to match within 1 frame tolerance.`
);

// Test clamping limits
const clampedUnits = TimerDefaults.secondsToUnits(1000000, 30);
assert(clampedUnits.hours === 99, 'Clamping max hours to 99', `Got ${clampedUnits.hours}`);
assert(clampedUnits.mins <= 59 && clampedUnits.secs <= 59, 'Clamping max mins and secs to 59', `Got ${clampedUnits.mins}:${clampedUnits.secs}`);

// -------------------------------------------------------------------
// TEST 2: Negative Time Formatting & Zero Preservation (T-01, T-07)
// -------------------------------------------------------------------
console.log('\n\x1b[36m[TEST 2] Testing Negative Time Formatting & Zero Preservation (T-01, T-07)...\x1b[0m');

// Standard positive
assert(TimerDefaults.formatDisplayTime(3665, 'hms', 30) === '01:01:05', 'Positive HMS format (3665s -> 01:01:05)');
assert(TimerDefaults.formatDisplayTime(125, 'ms', 30) === '02:05', 'Positive MS format (125s -> 02:05)');
assert(TimerDefaults.formatDisplayTime(45, 's', 30) === '45', 'Positive S format (45s -> 45)');

// Negative times (T-01)
assert(TimerDefaults.formatDisplayTime(-90, 'hms', 30) === '-00:01:30', 'Negative HMS preserves minus sign (-90s -> -00:01:30)');
assert(TimerDefaults.formatDisplayTime(-90, 'ms', 30) === '-01:30', 'Negative MS preserves minus sign (-90s -> -01:30)');
assert(TimerDefaults.formatDisplayTime(-90, 's', 30) === '-90', 'Negative S preserves minus sign (-90s -> -90)');
assert(TimerDefaults.formatDisplayTime(-3665, 'hms', 30) === '-01:01:05', 'Large negative HMS preserves minus sign (-3665s -> -01:01:05)');

// Frames formats
assert(TimerDefaults.formatDisplayTime(10.5, 'hmsf', 30) === '00:00:10:15', 'Positive HMSF format with frames (10.5s @ 30fps -> 00:00:10:15)');
assert(TimerDefaults.formatDisplayTime(-10.5, 'hmsf', 30) === '-00:00:10:15', 'Negative HMSF format with frames (-10.5s @ 30fps -> -00:00:10:15)');
assert(TimerDefaults.formatDisplayTime(-75.2, 'msf', 25) === '-01:15:05', 'Negative MSF format with frames (-75.2s @ 25fps -> -01:15:05)');
assert(TimerDefaults.formatDisplayTime(-5.5, 'sf', 30) === '-05:15', 'Negative SF format with frames (-5.5s @ 30fps -> -05:15)');

// Zero crossing (T-07)
assert(TimerDefaults.formatDisplayTime(0, 'hms', 30) === '00:00:00', 'Zero time is formatted as unsigned "00:00:00"');
assert(TimerDefaults.formatDisplayTime(0, 'ms', 30) === '00:00', 'Zero time is formatted as unsigned "00:00"');
assert(TimerDefaults.formatDisplayTime(0, 's', 30) === '00', 'Zero time is formatted as unsigned "00"');

// -------------------------------------------------------------------
// TEST 3: Settings Validation & Normalization Schema (T-04, T-09)
// -------------------------------------------------------------------
console.log('\n\x1b[36m[TEST 3] Testing Settings Validation & Normalization Schema (T-04, T-09)...\x1b[0m');

assert(TimerDefaults.normalizeMode('markers') === 'markers', 'Normalize valid mode: markers');
assert(TimerDefaults.normalizeMode('auto') === 'auto', 'Normalize valid mode: auto');
assert(TimerDefaults.normalizeMode('realtime') === 'realtime', 'Normalize valid mode: realtime');
assert(TimerDefaults.normalizeMode('invalid_mode') === 'manual', 'Fallback invalid mode to manual');

assert(TimerDefaults.normalizeFormat('msf') === 'msf', 'Normalize valid format: msf');
assert(TimerDefaults.normalizeFormat('hmsf') === 'hmsf', 'Normalize valid format: hmsf');
assert(TimerDefaults.normalizeFormat('unknown') === 'hms', 'Fallback invalid format to hms');

const validated1 = TimerDefaults.validateSettings({
    start: '120',
    end: '0',
    duration: '15',
    durationMode: 'markers',
    format: 'ms',
    monospace: true
});

assert(validated1.counterType === 'timer', 'Validated settings counterType is "timer"');
assert(validated1.start === 120 && validated1.end === 0, 'Parsed numeric start and end values');
assert(validated1.duration === 15, 'Parsed numeric duration');
assert(validated1.durationMode === 'markers', 'Preserved validated durationMode');
assert(validated1.format === 'ms', 'Preserved validated format');
assert(validated1.monospace === true, 'Preserved boolean monospace flag');

const validatedEmpty = TimerDefaults.validateSettings(null);
assert(validatedEmpty.duration === TimerDefaults.LIMITS.DURATION.default, 'Default duration when empty input');
assert(validatedEmpty.format === 'hms', 'Default format when empty input');

// -------------------------------------------------------------------
// TEST 4: Host Expression Generation & Easing Integration (T-02, T-10)
// -------------------------------------------------------------------
console.log('\n\x1b[36m[TEST 4] Testing Host Expression Generation & Easing Integration (T-02, T-10)...\x1b[0m');

const mockTimerSettings = {
    counterType: 'timer',
    start: 60,
    end: 0,
    duration: 10,
    durationMode: 'manual',
    format: 'hms',
    easing: 'easeOut',
    easingConfig: { mode: 'single', singleCurveId: 'easeOut' }
};

const exprManual = NOMRO.expressions.generateCountdownEmbedded(mockTimerSettings);

assert(typeof exprManual === 'string' && exprManual.length > 50, 'Generated countdown expression string');
assert(exprManual.includes('var k ='), 'Expression includes easing evaluation (var k = ...) (T-02)');
assert(exprManual.includes('var val = startVal + (endVal - startVal) * k;'), 'Expression interpolates values via easing factor k (T-02)');
assert(exprManual.includes('var sign = val < 0 ? "-" : "";'), 'Expression includes negative sign preservation logic (T-01)');
assert(exprManual.includes('/* NOMRO_CONFIG ='), 'Expression embeds config payload as source of truth');

// Test Markers mode zero-division protection (T-10)
const mockMarkersSettings = Object.assign({}, mockTimerSettings, { durationMode: 'markers' });
const exprMarkers = NOMRO.expressions.generateCountdownEmbedded(mockMarkersSettings);
assert(exprMarkers.includes('Math.max(0.001, outTime - inTime)'), 'Markers mode guards against division by zero (T-10)');

// -------------------------------------------------------------------
// TEST 5: Absence of Redundant Millions Sliders (T-03)
// -------------------------------------------------------------------
console.log('\n\x1b[36m[TEST 5] Testing Absence of Redundant Millions Sliders (T-03)...\x1b[0m');

assert(!exprManual.includes('NOMRO_Start_M'), 'Countdown expression does not reference NOMRO_Start_M (T-03)');
assert(!exprManual.includes('NOMRO_End_M'), 'Countdown expression does not reference NOMRO_End_M (T-03)');

const countdownBuilderCode = fs.readFileSync(path.join(baseDir, 'host', 'core', 'CountdownBuilder.jsx'), 'utf8');
assert(!countdownBuilderCode.includes('addLargeValue'), 'CountdownBuilder.jsx does not contain addLargeValue function (T-03)');
assert(!countdownBuilderCode.includes('_M'), 'CountdownBuilder.jsx does not create _M sliders (T-03)');

// -------------------------------------------------------------------
// TEST 6: Simulated After Effects Expression Runtime Evaluation
// -------------------------------------------------------------------
console.log('\n\x1b[36m[TEST 6] Testing Simulated After Effects Expression Runtime...\x1b[0m');

function evaluateAEExpression(expressionCode, mockState) {
    const aeContext = {
        thisLayer: {
            effect: function(name) {
                return function(prop) {
                    if (name === 'NOMRO_Start') return mockState.startVal;
                    if (name === 'NOMRO_End') return mockState.endVal;
                    if (name === 'NOMRO_Duration') return mockState.duration;
                    return 0;
                };
            },
            marker: {
                numKeys: 2,
                key: function(i) {
                    if (i === 1) return { comment: 'IN', time: 0 };
                    if (i === 2) return { comment: 'OUT', time: 10 };
                    return { comment: '', time: 0 };
                }
            }
        },
        thisComp: {
            frameDuration: 1.0 / (mockState.fps || 30)
        },
        time: mockState.time,
        inPoint: 0,
        outPoint: 10,
        timeToFrames: function(t) {
            return Math.round(t * (mockState.fps || 30));
        },
        clamp: function(v, min, max) {
            return Math.min(max, Math.max(min, v));
        },
        Math: Math,
        parseFloat: parseFloat,
        parseInt: parseInt
    };

    // Remove the embedded config comment at the end to evaluate expression
    const executableCode = expressionCode.replace(/\/\* NOMRO_CONFIG =[\s\S]*?\*\//, '').trim();
    
    // In AE expressions, the last statement evaluates to the property value
    return vm.runInNewContext(executableCode, aeContext);
}

// Test start time (t=0s) -> 00:01:00 (60s countdown to 0)
const resAtStart = evaluateAEExpression(exprManual, { startVal: 60, endVal: 0, duration: 10, time: 0, fps: 30 });
assert(resAtStart === '00:01:00', `Expression result at t=0s: Expected "00:01:00", got "${resAtStart}"`);

// Test end time (t=10s) -> 00:00:00
const resAtEnd = evaluateAEExpression(exprManual, { startVal: 60, endVal: 0, duration: 10, time: 10, fps: 30 });
assert(resAtEnd === '00:00:00', `Expression result at t=10s: Expected "00:00:00", got "${resAtEnd}"`);

// Test countdown going negative (Start 10s -> End -10s over 10s duration) at t=10s
const exprNegative = NOMRO.expressions.generateCountdownEmbedded({
    durationMode: 'manual',
    format: 'ms',
    easing: 'linear'
});
const resNegative = evaluateAEExpression(exprNegative, { startVal: 10, endVal: -10, duration: 10, time: 10, fps: 30 });
assert(resNegative === '-00:10', `Expression result at negative end: Expected "-00:10", got "${resNegative}"`);

// -------------------------------------------------------------------
// TEST 7: Preset & UI Integration Parity (T-05, T-06, T-08)
// -------------------------------------------------------------------
console.log('\n\x1b[36m[TEST 7] Testing Preset & UI Integration Parity (T-05, T-06, T-08)...\x1b[0m');

// Check index.html for monospace toggle button
const indexHtml = fs.readFileSync(path.join(baseDir, 'client', 'index.html'), 'utf8');
assert(indexHtml.includes('id="timer-toggle-monospace-btn"'), 'index.html contains #timer-toggle-monospace-btn (T-06)');
assert(indexHtml.includes('src="js/modules/timer-defaults.js"'), 'index.html includes timer-defaults.js script tag');

// Check timer.js getSettings and validateSettings
const timerJsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'timer.js'), 'utf8');
assert(timerJsCode.includes('function getSettings()'), 'timer.js defines dedicated getSettings() (T-05)');
assert(timerJsCode.includes('TimerDefaults.validateSettings'), 'timer.js delegates validation to TimerDefaults (T-09)');

// Check app.js getSettingsForCurrentTab
const appJsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'app.js'), 'utf8');
assert(appJsCode.includes("targetTab === 'timer'") && appJsCode.includes('TimerModule.getSettings'), 'app.js routes timer tab to TimerModule.getSettings()');

// -------------------------------------------------------------------
// SUMMARY & REPORT
// -------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`TOTAL TESTS RUN : ${totalTests}`);
console.log(`TESTS PASSED    : \x1b[32m${passedTests}\x1b[0m`);
console.log(`TESTS FAILED    : ${failedTests > 0 ? '\x1b[31m' + failedTests + '\x1b[0m' : '\x1b[32m0\x1b[0m'}`);
console.log(`SUCCESS RATE    : \x1b[32m${((passedTests / totalTests) * 100).toFixed(2)}%\x1b[0m`);
console.log('===============================================================\n');

if (failedTests > 0) {
    console.error('FAILURES SUMMARY:');
    failures.forEach(f => console.error(f));
    process.exit(1);
} else {
    console.log('\x1b[32m✨ ALL QA PARITY TESTS PASSED WITH 100% ACCURACY! ✨\x1b[0m\n');
    process.exit(0);
}
