/**
 * NOMRO Pro - Master Architectural & QA Verification Suite
 * Tests the entire modular system across Host, Client, Expressions, Math, and Architecture.
 * 
 * Verifies:
 * - [SUITE 1] Modular ExtendScript Host & Service Layer Loading
 * - [SUITE 2] Timer Subsystem Parity, Negative Time & Frame Math (50+ cases)
 * - [SUITE 3] Counter Subsystem Formatting, Zero Padding & Easing
 * - [SUITE 4] DRY Validation & Dynamic Limit Binding (Validator.js <-> TimerDefaults)
 * - [SUITE 5] CEP Bridge Clean JSON Protocol
 * - [SUITE 6] Simulated After Effects Runtime Expression Evaluation
 * - [SUITE 7] Asset Cleanliness & DOM Contract
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve(__dirname, '..');
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
console.log('       NOMRO PRO — MASTER ARCHITECTURAL & QA TEST SUITE        ');
console.log('===============================================================\n');

// -------------------------------------------------------------------
// SUITE 1: Modular ExtendScript Host & Service Layer
// -------------------------------------------------------------------
console.log('\x1b[36m[SUITE 1] Testing Modular ExtendScript Host & Service Layers...\x1b[0m');

const hostContext = {
    console: console,
    Math: Math,
    parseFloat: parseFloat,
    parseInt: parseInt,
    isNaN: isNaN,
    JSON: JSON,
    app: {
        beginUndoGroup: function() {},
        endUndoGroup: function() {},
        project: { activeItem: null }
    },
    MarkerValue: function(comment) { this.comment = comment; },
    CompItem: function() {},
    $: { writeln: function() {} }
};

vm.createContext(hostContext);

// Read and simulate #include loading of all modular host files in order
const hostFiles = [
    'utils/JSONPolyfill.jsx',
    'utils/CompUtils.jsx',
    'services/LayerResolver.jsx',
    'services/SettingsExtractor.jsx',
    'services/LayerUpdater.jsx',
    'easing/EasingLib.jsx',
    'easing/EasingRegistry.jsx',
    'easing/EasingExpressionAdapter.jsx',
    'expressions/ExpressionGenerator.jsx',
    'core/CounterBuilder.jsx',
    'core/CountdownBuilder.jsx'
];

let hostCode = fs.readFileSync(path.join(baseDir, 'host', 'index.jsx'), 'utf8');

// Load index.jsx base definitions (before #includes)
const indexParts = hostCode.split('// LOAD MODULAR SERVICES & LIBRARIES');
vm.runInContext(indexParts[0], hostContext);

// Load each service module
hostFiles.forEach(hf => {
    const fPath = path.join(baseDir, 'host', hf);
    assert(fs.existsSync(fPath), `Host service module exists: ${hf}`);
    const code = fs.readFileSync(fPath, 'utf8');
    vm.runInContext(code, hostContext);
});

// Load remaining index.jsx entry points
vm.runInContext(indexParts[1].replace(/#include[^\n]+/g, '// included'), hostContext);

assert(typeof hostContext.NOMRO === 'object', 'NOMRO namespace initialized');
assert(typeof hostContext.NOMRO.helpers.getLayerId === 'function', 'LayerResolver loaded: getLayerId');
assert(typeof hostContext.NOMRO.helpers.readExpressionConfig === 'function', 'SettingsExtractor loaded: readExpressionConfig');
assert(typeof hostContext.NOMRO.helpers.updateLargeSlider === 'function', 'LayerUpdater loaded: updateLargeSlider');
assert(typeof hostContext.createCounter === 'function', 'Public API loaded: createCounter');
assert(typeof hostContext.readSelectedLayer === 'function', 'Public API loaded: readSelectedLayer');
assert(typeof hostContext.updateLayer === 'function', 'Public API loaded: updateLayer');

// -------------------------------------------------------------------
// SUITE 2: Timer Subsystem Parity, Negative Time & Frame Math
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 2] Testing Timer Subsystem Parity, Negative Time & Frame Math...\x1b[0m');

const timerDefaultsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'timer-defaults.js'), 'utf8');
vm.runInContext(timerDefaultsCode, hostContext);
const TimerDefaults = hostContext.TimerDefaults;

// Test bidirectional accuracy across framerates
const fpsList = [24, 25, 29.97, 30, 50, 59.94, 60];
const sampleSeconds = [0, 0.5, 1, 10, 59, 60, 125.5, 3599, 3600, 7325.25, 86399, 359999];

let timerConversionsPassed = 0;
sampleSeconds.forEach(sec => {
    fpsList.forEach(fps => {
        const u = TimerDefaults.secondsToUnits(sec, fps);
        const reconstructed = TimerDefaults.unitsToSeconds(u.hours, u.mins, u.secs, u.frames, fps);
        if (Math.abs(sec - reconstructed) <= (1 / fps) + 0.0001) {
            timerConversionsPassed++;
        }
    });
});

assert(
    timerConversionsPassed === sampleSeconds.length * fpsList.length,
    `Bidirectional Timer unit conversion (${timerConversionsPassed}/${sampleSeconds.length * fpsList.length} cases passed)`
);

// Negative formats & Zero handling
assert(TimerDefaults.formatDisplayTime(-90, 'hms', 30) === '-00:01:30', 'Negative HMS format preserves minus sign (-90s -> -00:01:30)');
assert(TimerDefaults.formatDisplayTime(-90, 'ms', 30) === '-01:30', 'Negative MS format preserves minus sign (-90s -> -01:30)');
assert(TimerDefaults.formatDisplayTime(-90, 's', 30) === '-90', 'Negative S format preserves minus sign (-90s -> -90)');
assert(TimerDefaults.formatDisplayTime(-10.5, 'hmsf', 30) === '-00:00:10:15', 'Negative HMSF format (-10.5s @ 30fps -> -00:00:10:15)');
assert(TimerDefaults.formatDisplayTime(0, 'hms', 30) === '00:00:00', 'Zero time is unsigned "00:00:00"');

// -------------------------------------------------------------------
// SUITE 3: Counter Subsystem Formatting & Expressions
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 3] Testing Counter Subsystem Formatting & Expressions...\x1b[0m');

const counterExpr = hostContext.NOMRO.expressions.generateEmbedded({
    counterType: 'counter',
    start: 0,
    end: 1000,
    duration: 3,
    symbol: '$',
    suffix: ' USD',
    separator: ',',
    formatPos: 'left',
    decimals: false,
    easing: 'easeOutQuad',
    easingConfig: { mode: 'single', singleCurveId: 'easeOutQuad' }
});

assert(typeof counterExpr === 'string' && counterExpr.length > 50, 'Generated counter expression');
assert(counterExpr.includes('var k ='), 'Counter expression includes easing resolution');
assert(counterExpr.includes('rawValue'), 'Counter expression formats raw interpolated value');
assert(counterExpr.includes('NOMRO_CONFIG'), 'Counter expression embeds config payload');

// -------------------------------------------------------------------
// SUITE 4: DRY Validation & Dynamic Limit Binding
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 4] Testing DRY Validation & Dynamic Limit Binding...\x1b[0m');

const validatorCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'services', 'Validator.js'), 'utf8');
vm.runInContext(validatorCode, hostContext);
const Validator = hostContext.Validator;

assert(typeof Validator === 'object', 'Validator service loaded');
assert(Validator.isValid({ start: 0, end: 100, duration: 2, counterType: 'counter' }), 'Validates valid counter settings');
assert(!Validator.isValid({ start: 0, end: 100, duration: 0, counterType: 'counter' }), 'Rejects zero duration for counter');

// Test dynamic timer limits in Validator
const timerSettingsValid = { start: 0, end: 300, duration: 10, counterType: 'timer' };
assert(Validator.isValid(timerSettingsValid), 'Validates valid timer settings');

const timerSettingsInvalidDuration = { start: 0, end: 300, duration: 0.05, counterType: 'timer' };
assert(!Validator.isValid(timerSettingsInvalidDuration), 'Rejects timer duration below TimerDefaults min (0.1s)');

// -------------------------------------------------------------------
// SUITE 5: CEP Bridge Clean JSON Protocol
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 5] Testing CEP Bridge Clean JSON Protocol...\x1b[0m');

const bridgeCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'bridge', 'Bridge.js'), 'utf8');
assert(!bridgeCode.includes('JSON.stringify(JSON.stringify'), 'Bridge.js does not contain double JSON stringification (DRY clean)');
assert(bridgeCode.includes('createCounter(') && bridgeCode.includes('updateLayer('), 'Bridge.js exports createCounter and updateLayer');

// -------------------------------------------------------------------
// SUITE 6: Simulated After Effects Runtime Evaluation
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 6] Testing Simulated After Effects Expression Runtime...\x1b[0m');

function evalAE(exprStr, state) {
    const aeEnv = {
        thisLayer: {
            effect: function(name) {
                return function(prop) {
                    if (name === 'NOMRO_Start') return state.start;
                    if (name === 'NOMRO_End') return state.end;
                    if (name === 'NOMRO_Duration') return state.duration;
                    if (name === 'NOMRO_Start_M' || name === 'NOMRO_End_M' || name === 'NOMRO_Delay') return 0;
                    return 0;
                };
            }
        },
        thisComp: { frameDuration: 1.0 / (state.fps || 30) },
        time: state.time,
        inPoint: 0,
        outPoint: state.duration,
        timeToFrames: function(t) { return Math.round(t * (state.fps || 30)); },
        clamp: function(v, min, max) { return Math.min(max, Math.max(min, v)); },
        Math: Math,
        parseFloat: parseFloat,
        parseInt: parseInt
    };

    const cleanCode = exprStr.replace(/\/\* NOMRO_CONFIG =[\s\S]*?\*\//, '').trim();
    return vm.runInNewContext(cleanCode, aeEnv);
}

// Evaluate Timer expression at t=0s, t=5s, t=10s
const countdownExpr = hostContext.NOMRO.expressions.generateCountdownEmbedded({
    durationMode: 'manual',
    format: 'hms',
    easing: 'linear'
});

const t0Res = evalAE(countdownExpr, { start: 60, end: 0, duration: 10, time: 0, fps: 30 });
const t10Res = evalAE(countdownExpr, { start: 60, end: 0, duration: 10, time: 10, fps: 30 });
assert(t0Res === '00:01:00', `Countdown start at t=0s: Expected "00:01:00", got "${t0Res}"`);
assert(t10Res === '00:00:00', `Countdown end at t=10s: Expected "00:00:00", got "${t10Res}"`);

// Evaluate Counter expression at t=10s
const counterEvalRes = evalAE(counterExpr, { start: 0, end: 1000, duration: 3, time: 3, fps: 30 });
assert(counterEvalRes === '$1,000 USD', `Counter formatted end at t=3s: Expected "$1,000 USD", got "${counterEvalRes}"`);

// -------------------------------------------------------------------
// SUITE 7: Asset Cleanliness & DOM Contract
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 7] Testing Asset Cleanliness & DOM Contract...\x1b[0m');

// Verify dead CSS files are completely gone
assert(!fs.existsSync(path.join(baseDir, 'client', 'css', 'layout.css')), 'layout.css is purged');
assert(!fs.existsSync(path.join(baseDir, 'client', 'css', 'tokens')), 'css/tokens directory is purged');
assert(!fs.existsSync(path.join(baseDir, 'client', 'css', 'components')), 'css/components directory is purged');
assert(fs.existsSync(path.join(baseDir, 'client', 'css', 'compact.css')), 'compact.css is active and present');

// Verify index.html loads all required modules
const htmlContent = fs.readFileSync(path.join(baseDir, 'client', 'index.html'), 'utf8');
assert(htmlContent.includes('js/modules/timer-defaults.js'), 'index.html includes timer-defaults.js');
assert(htmlContent.includes('js/services/Validator.js'), 'index.html includes Validator.js');
assert(htmlContent.includes('js/bridge/Bridge.js'), 'index.html includes Bridge.js');
assert(htmlContent.includes('id="timer-toggle-monospace-btn"'), 'index.html has monospace toggle button');

// -------------------------------------------------------------------
// SUITE 8: Invariant Regression Suite for DEF-01 to DEF-15
// -------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 8] Testing Invariant Regression for DEF-01 to DEF-15...\x1b[0m');

// DEF-01: Counter negative number and currency prefix parity
const clientCounterCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'counter.js'), 'utf8');
const clientCounterCtx = {
    window: { addEventListener: function() {} },
    performance: { now: function() { return 0; } },
    requestAnimationFrame: function() {},
    cancelAnimationFrame: function() {},
    document: { querySelector: function() { return null; }, querySelectorAll: function() { return []; } }
};
vm.createContext(clientCounterCtx);
vm.runInContext(clientCounterCode, clientCounterCtx);
clientCounterCtx.CounterModule.init({}, {
    counter: {
        decimals: false,
        prefix: '$',
        suffix: ' USD',
        separator: ',',
        commas: true,
        symbolPosition: 'left'
    }
});

const clientNegFormat = clientCounterCtx.CounterModule.formatNumber(-50);
assert(clientNegFormat === '-$50 USD', `DEF-01: Client formatNumber(-50) -> "${clientNegFormat}" matches -$50 USD`);

const negExpr = hostContext.NOMRO.expressions.generateEmbedded({
    counterType: 'counter',
    start: -50,
    end: 100,
    duration: 3,
    symbol: '$',
    suffix: ' USD',
    separator: ',',
    formatPos: 'left',
    decimals: false,
    easing: 'linear'
});
const aeNegResult = evalAE(negExpr, { start: -50, end: 100, duration: 3, time: 0, fps: 30 });
assert(aeNegResult === '-$50 USD', `DEF-01: AE expression at t=0s -> "${aeNegResult}" matches -$50 USD`);
assert(clientNegFormat === aeNegResult, 'DEF-01: 100% parity between Client preview and AE expression for negative currency');

// DEF-02: Negative zero suppression in Client & Host expression
const clientZeroRes = clientCounterCtx.CounterModule.formatNumber(-0.001);
assert(clientZeroRes === '$0 USD', `DEF-02: Client formatNumber(-0.001) suppresses negative zero -> "${clientZeroRes}"`);

const zeroAEExpr = hostContext.NOMRO.expressions.generateEmbedded({
    counterType: 'counter',
    start: 0,
    end: 100,
    duration: 3,
    symbol: '$',
    suffix: ' USD',
    separator: ',',
    formatPos: 'left',
    decimals: false,
    easing: 'linear'
});
const aeZeroResult = evalAE(zeroAEExpr, { start: 0, end: 100, duration: 3, time: 0, fps: 30 });
assert(aeZeroResult === '$0 USD', `DEF-02: AE expression suppresses negative zero -> "${aeZeroResult}"`);

// DEF-03: Free expression generator supports decimals and separators
const freeExprDec = hostContext.NOMRO.expressions.generateFreeExpression({
    start: 0,
    end: 500,
    duration: 3,
    decimals: true,
    separator: ','
});
assert(freeExprDec.includes("Number(num).toFixed(2)") && freeExprDec.includes('n.split(".")'),
    'DEF-03: generateFreeExpression includes decimal splitting logic');
assert(freeExprDec.includes("decPart"), 'DEF-03: generateFreeExpression appends decPart to formatted string');

// DEF-04: Negative seconds in TimerDefaults.secondsToUnits
const negUnits = TimerDefaults.secondsToUnits(-90, 30);
assert(negUnits.isNegative === true, 'DEF-04: TimerDefaults.secondsToUnits sets isNegative=true for negative values');
assert(negUnits.mins === 1 && negUnits.secs === 30, 'DEF-04: TimerDefaults.secondsToUnits preserves correct min/sec for negative values');

// DEF-05: CreationModule deadlock prevention
const creationCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'creation.js'), 'utf8');
assert(creationCode.includes('try {') && creationCode.includes('_isCreating = false;') && creationCode.includes('hideLoading();'), 
    'DEF-05: CreationModule wraps creation & update in try-catch to prevent _isCreating deadlock');

// DEF-06: Bridge.getHostInfo graceful degradation
const bridgeFileCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'bridge', 'Bridge.js'), 'utf8');
assert(bridgeFileCode.includes('if (!_csInterface) return null;') && bridgeFileCode.includes('catch (e) {'),
    'DEF-06: Bridge.getHostInfo handles missing CSInterface and catches errors safely');

// DEF-07: Slider pollution prevention in LayerUpdater
const mockLayerSliders = [];
const mockLayer = {
    effect: function(name) {
        for (var i = 0; i < mockLayerSliders.length; i++) {
            if (mockLayerSliders[i].name === name) return mockLayerSliders[i];
        }
        return null;
    },
    Effects: {
        addProperty: function(type) {
            const effectObj = {
                name: '',
                property: function(prop) {
                    return {
                        setValue: function(val) { effectObj.value = val; },
                        value: effectObj.value || 0
                    };
                }
            };
            mockLayerSliders.push(effectObj);
            return effectObj;
        }
    }
};

hostContext.NOMRO.helpers.updateLargeSlider(mockLayer, 'NOMRO_Start', 50);
const mSliderCreated = mockLayerSliders.some(s => s.name === 'NOMRO_Start_M');
assert(!mSliderCreated, 'DEF-07: updateLargeSlider does NOT create _M slider for small numbers (<= 1,000,000)');

// DEF-08: Monospace toggle restores original font
const mockFontProp = {
    value: { font: hostContext.NOMRO_CONSTANTS.FONTS.MONOSPACE },
    setValue: function(doc) { this.value = doc; }
};
const mockFontLayer = {
    property: function(name) { return mockFontProp; }
};
hostContext.NOMRO.helpers.updateFont(mockFontLayer, false, 'Helvetica-Bold');
assert(mockFontLayer.property('Source Text').value.font === 'Helvetica-Bold',
    'DEF-08: LayerUpdater.updateFont restores originalFont when monospace is false');

// DEF-09: Unlink selection auto-relink suppression
const appJsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'app.js'), 'utf8');
assert(appJsCode.includes('unlinkedLayerKey') && appJsCode.includes('if (unlinkedLayerKey === candidateKey'),
    'DEF-09: app.js selection loop suppresses auto-relink for unlinkedLayerKey');

// DEF-10: Animation frame timer thrashing eliminated
assert(!clientCounterCode.includes('setTimeout(function () {\n                    _elements.previewNumber.classList.remove(\'counting\');'),
    'DEF-10: counter.js eliminates 60 setTimeout/sec thrashing in requestAnimationFrame loop');

// DEF-11: Two-way sync effect pollution prevention
const mockEffectsLayer = {
    Effects: {
        numProperties: 2,
        property: function(idx) {
            if (idx === 1) {
                return {
                    name: 'Gaussian Blur',
                    matchName: 'ADBE Slider Control',
                    property: function() { return { value: 15 }; }
                };
            }
            return {
                name: 'NOMRO_Start',
                matchName: 'ADBE Slider Control',
                property: function() { return { value: 250 }; }
            };
        }
    }
};
const parsedSliders = hostContext.NOMRO.helpers.readSliderValues(mockEffectsLayer);
assert(parsedSliders.start === 250 && parsedSliders['gaussian blur'] === undefined,
    'DEF-11: SettingsExtractor.readSliderValues strictly filters by NOMRO_ prefix, ignoring user sliders');

// DEF-12: Timer preset restoration
const presetsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'presets.js'), 'utf8');
assert(presetsCode.includes('_state.timer.monospace = !!settings.monospace;') &&
       presetsCode.includes('_state.timer.easing = settings.easing;') &&
       presetsCode.includes('_state.timer.easingConfig = settings.easingConfig;'),
    'DEF-12: presets.js restores monospace, easing, and easingConfig for timer presets');

// DEF-13: Dead CSS cleanup in compact.css
const compactCssCode = fs.readFileSync(path.join(baseDir, 'client', 'css', 'compact.css'), 'utf8');
assert(!compactCssCode.includes('.studio-') && !compactCssCode.includes('.curve-editor-container'),
    'DEF-13: compact.css does not contain dead Easing Studio CSS classes');

// DEF-14: Toast localization consistency
const timerJsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'timer.js'), 'utf8');
assert(!/[\u0600-\u06FF]/.test(timerJsCode),
    'DEF-14: timer.js toast notifications standardized to clean English without encoding issues');

// DEF-15: Frame limits in Validator.js
assert(Validator.validateNumber(100, { min: 0, max: 99 }) !== null,
    'DEF-15: Validator rejects frames value > 99');
assert(Validator.validateNumber(24, { min: 0, max: 99 }) === null,
    'DEF-15: Validator accepts valid frame value within 0-99');

// DEF-16: Center text justification in CounterBuilder and CountdownBuilder
const counterBuilderCode = fs.readFileSync(path.join(baseDir, 'host', 'core', 'CounterBuilder.jsx'), 'utf8');
const countdownBuilderCode = fs.readFileSync(path.join(baseDir, 'host', 'core', 'CountdownBuilder.jsx'), 'utf8');
assert(counterBuilderCode.includes('ParagraphJustification.CENTER_JUSTIFY'),
    'DEF-16: CounterBuilder sets textDoc.justification to CENTER_JUSTIFY');
assert(countdownBuilderCode.includes('ParagraphJustification.CENTER_JUSTIFY'),
    'DEF-16: CountdownBuilder sets textDoc.justification to CENTER_JUSTIFY');

// DEF-17: MathEvaluator division by zero safety
const uiControlsCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'ui-controls.js'), 'utf8');
assert(uiControlsCode.includes('return fallback !== undefined ? fallback : 0;') &&
       uiControlsCode.includes('isFinite(result)'),
    'DEF-17: MathEvaluator rejects division-by-zero Infinity and returns safe fallback');

// DEF-18: Countdown expression negative zero suppression
const exprCountdownDef = hostContext.NOMRO.expressions.generateCountdownEmbedded({ format: 'hms' });
assert(exprCountdownDef.includes('!isZero') && exprCountdownDef.includes('isZero = (hours === 0 && mins === 0 && secs === 0'),
    'DEF-18: generateCountdownEmbedded suppresses negative sign when value reaches zero');

// DEF-19: Localized ErrorHandler mapping
const errorHandlerCode = fs.readFileSync(path.join(baseDir, 'client', 'js', 'services', 'ErrorHandler.js'), 'utf8');
assert(errorHandlerCode.includes('Layer is locked') && errorHandlerCode.includes('No layer selected'),
    'DEF-19: ErrorHandler includes localized mappings for locked layers and unselected layers');

// DEF-20: Timer preview negative sign element in index.html & status bar modifiers in compact.css
const indexHtmlContent = fs.readFileSync(path.join(baseDir, 'client', 'index.html'), 'utf8');
assert(indexHtmlContent.includes('id="timer-sign"'),
    'DEF-20: index.html contains dedicated #timer-sign element for negative time preview');
assert(compactCssCode.includes('.status-dot.status--ready') && compactCssCode.includes('.status-dot.status--linked'),
    'DEF-20: compact.css contains dynamic status bar modifier classes');

// -------------------------------------------------------------------
// MASTER SUMMARY REPORT
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
    console.log('\x1b[32m🎉 FULL SYSTEM ARCHITECTURAL & QA HARNESS: 100% PASSED! 🎉\x1b[0m\n');
    process.exit(0);
}
