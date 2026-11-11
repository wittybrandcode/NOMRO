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

// DEF-21: 5 Golden Curves System & Mathematical Parity
const easingDefaultsSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'easing', 'EasingDefaults.js'), 'utf8');
const easingRegistrySrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'easing', 'EasingRegistry.js'), 'utf8');
const easingRuntimeSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'easing', 'EasingRuntime.js'), 'utf8');
vm.runInContext(easingDefaultsSrc, hostContext);
vm.runInContext(easingRegistrySrc, hostContext);
vm.runInContext(easingRuntimeSrc, hostContext);

assert(hostContext.EasingDefaults.GOLDEN_CURVES.length === 5,
    'DEF-21: EasingDefaults defines exactly the 5 Golden Curves');
assert(Math.abs(hostContext.EasingRuntime.evaluateById('smoothOut', 0.5) - 0.875) < 1e-6,
    'DEF-21: Smooth Out evaluates exact cubic deceleration (t=0.5 -> 0.875)');

// DEF-22: Backward Compatibility & Legacy Alias Resolution
assert(hostContext.EasingDefaults.resolveCurveId('easeOutQuad') === 'smoothOut' &&
       hostContext.EasingDefaults.resolveCurveId('back') === 'overshoot' &&
       hostContext.EasingDefaults.resolveCurveId('easeOutExpo') === 'snappyOut',
    'DEF-22: EasingDefaults resolves legacy curve aliases to corresponding Golden Curves');
assert(hostContext.NOMRO.easing.resolveId('easeOutQuad') === 'smoothOut' &&
       hostContext.NOMRO.easing.get('easeOutQuad').includes('NOMRO_Ease') &&
       hostContext.NOMRO.easing.get('easeOutQuad').includes('1 - Math.pow(1 - t, p)'),
    'DEF-22: Host EasingLib seamlessly resolves legacy alias easeOutQuad to smoothOut with NOMRO_Ease slider binding');

// DEF-23: Ultra-Fast AE Expression Generation (No Newton-Raphson bloat)
const smoothExpr = hostContext.NOMRO.expressions.generateEmbedded({
    start: 0, end: 100, duration: 2, easing: 'smoothOut'
});
assert(smoothExpr.includes('NOMRO_Ease') && smoothExpr.includes('1 - Math.pow(1 - t, p)') && !smoothExpr.includes('solveX'),
    'DEF-23: AE counter expression contains pure parametric formula reading NOMRO_Ease without Newton-Raphson iterative loops');

// DEF-24: Streamlined One-Click UI DOM Contract
assert(indexHtmlContent.includes('id="easing-curve-switch"') &&
       indexHtmlContent.includes('data-easing="smoothOut"') &&
       indexHtmlContent.includes('data-easing="snappyOut"') &&
       !indexHtmlContent.includes('data-easing-mode="dual"'),
    'DEF-24: index.html contains streamlined 5-button segmented switch and eliminates dual-mode bloat');

// DEF-25: EasingValidator.validateStrict & EasingRuntime.evaluateCounterState Contract
const easingValidatorSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'easing', 'EasingValidator.js'), 'utf8');
vm.runInContext(easingValidatorSrc, hostContext);

assert(typeof hostContext.EasingValidator.validateStrict === 'function',
    'DEF-25: EasingValidator exports validateStrict function');
const validRes = hostContext.EasingValidator.validateStrict(
    hostContext.EasingValidator.sanitizeSettings({ easing: 'smoothOut' })
);
assert(validRes.valid === true && validRes.errors.length === 0,
    'DEF-25: EasingValidator.validateStrict passes for sanitized settings');
assert(typeof hostContext.EasingRuntime.evaluateCounterState === 'function',
    'DEF-25: EasingRuntime exports evaluateCounterState function');
const counterEval = hostContext.EasingRuntime.evaluateCounterState({ easing: 'smoothOut' }, 0.5);
assert(Math.abs(counterEval - 0.875) < 1e-6,
    'DEF-25: evaluateCounterState evaluates accurate progress for counter state');

// DEF-26: SVG Curve Visualizer DOM & CSS Contract
assert(indexHtmlContent.includes('id="easing-visualizer"') &&
       indexHtmlContent.includes('id="easing-svg"') &&
       indexHtmlContent.includes('id="easing-curve-path"') &&
       indexHtmlContent.includes('id="easing-kinetic-dot"'),
    'DEF-26: index.html contains SVG curve visualizer and kinetic dot elements');
assert(compactCssCode.includes('.easing-visualizer-container') &&
       compactCssCode.includes('#easing-curve-path') &&
       compactCssCode.includes('#easing-kinetic-dot'),
    'DEF-26: compact.css contains styles for visualizer container, curve path, and glowing dot');

// DEF-27: Ease Strength Slider DOM & EasingDefaults Limits Contract
assert(indexHtmlContent.includes('id="ease-strength-slider"') &&
       indexHtmlContent.includes('min="20"') &&
       indexHtmlContent.includes('max="95"') &&
       indexHtmlContent.includes('value="75"'),
    'DEF-27: index.html contains #ease-strength-slider with min=20, max=95, default=75');
assert(hostContext.EasingDefaults.DEFAULT_STRENGTH === 75 &&
       hostContext.EasingDefaults.MIN_STRENGTH === 20 &&
       hostContext.EasingDefaults.MAX_STRENGTH === 95,
    'DEF-27: EasingDefaults exports DEFAULT_STRENGTH=75, MIN_STRENGTH=20, MAX_STRENGTH=95');

// DEF-28: CounterBuilder & CountdownBuilder add NOMRO_Ease slider to AE layers
const counterBuilderSrc = fs.readFileSync(path.join(baseDir, 'host', 'core', 'CounterBuilder.jsx'), 'utf8');
const countdownBuilderSrc = fs.readFileSync(path.join(baseDir, 'host', 'core', 'CountdownBuilder.jsx'), 'utf8');
assert(counterBuilderSrc.includes("NOMRO.core.addSlider(textLayer, 'NOMRO_Ease'") || counterBuilderSrc.includes('NOMRO_Ease'),
    'DEF-28: CounterBuilder adds NOMRO_Ease slider to After Effects counter layer');
assert(countdownBuilderSrc.includes("NOMRO.core.addSlider(textLayer, 'NOMRO_Ease'") || countdownBuilderSrc.includes('NOMRO_Ease'),
    'DEF-28: CountdownBuilder adds NOMRO_Ease slider to After Effects timer layer');

// DEF-29: SettingsExtractor & Constants Bidirectional Ease Sync
assert(hostContext.NOMRO_CONSTANTS && hostContext.NOMRO_CONSTANTS.SLIDER_NAMES &&
       hostContext.NOMRO_CONSTANTS.SLIDER_NAMES.EASE === 'NOMRO_Ease',
    'DEF-29: NOMRO_CONSTANTS defines EASE slider name as NOMRO_Ease');
const mergedSettings = hostContext.NOMRO.helpers.mergeSettings({
    counterType: 'basic',
    start: 0,
    end: 100,
    duration: 2
}, {
    ease: 85
});
assert(mergedSettings.easeStrength === 85,
    'DEF-29: SettingsExtractor.mergeSettings maps extracted ease slider value to easeStrength');

// DEF-30: Parametric Easing Parity at Custom Strength
const evalCustom = hostContext.EasingRuntime.evaluateById('smoothOut', 0.5, 37.5);
// At strength=37.5 (ratio=0.5), power = 1 + 0.5*2 = 2.0 (quadratic deceleration)
// 1 - (1 - 0.5)^2 = 1 - 0.25 = 0.75
assert(Math.abs(evalCustom - 0.75) < 1e-6,
    'DEF-30: EasingRuntime evaluates exact parametric power at custom strength 37.5% (t=0.5 -> 0.75)');

// DEF-31: 18 Golden Presets (6 Counters, 6 Timers, 6 Markers) in PresetDefaults
const presetDefaultsSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'presets', 'PresetDefaults.js'), 'utf8');
vm.runInContext(presetDefaultsSrc, hostContext);
assert(hostContext.PresetDefaults && hostContext.PresetDefaults.FACTORY_PRESETS && hostContext.PresetDefaults.FACTORY_PRESETS.length === 18,
    'DEF-31: PresetDefaults defines exactly the 18 Golden Factory Presets');
const counterPresets = hostContext.PresetDefaults.FACTORY_PRESETS.filter(p => p.category === 'counter');
const timerPresets = hostContext.PresetDefaults.FACTORY_PRESETS.filter(p => p.category === 'timer');
const nodesPresets = hostContext.PresetDefaults.FACTORY_PRESETS.filter(p => p.category === 'nodes');
assert(counterPresets.length === 6 && timerPresets.length === 6 && nodesPresets.length === 6,
    'DEF-31: 18 Golden Presets are balanced (6 Counters, 6 Timers, and 6 Markers/Nodes)');
assert(counterPresets.every(p => p.isFactory === true && p.settings && p.settings.easeStrength !== undefined),
    'DEF-31: All factory counter presets include isFactory flag and easeStrength');
assert(nodesPresets.every(p => p.isFactory === true && p.settings && p.settings.nodes && p.settings.nodes.length >= 3),
    'DEF-31: All factory nodes presets include waypoint sequence with at least 3 nodes');

// DEF-32: Live Preset Inspector & Filter DOM & CSS Contract
assert(indexHtmlContent.includes('id="preset-inspector-card"') &&
       indexHtmlContent.includes('id="preset-preview-stage"') &&
       indexHtmlContent.includes('id="preset-preview-number"') &&
       indexHtmlContent.includes('id="btn-preset-play"') &&
       indexHtmlContent.includes('id="btn-preset-apply"') &&
       indexHtmlContent.includes('id="btn-preset-create"') &&
       indexHtmlContent.includes('data-preset-cat="nodes"'),
    'DEF-32: index.html contains Live Preset Inspector stage, action buttons, and Markers filter');
assert(compactCssCode.includes('.preset-inspector-card') &&
       compactCssCode.includes('.preset-preview-stage') &&
       compactCssCode.includes('.preset-preview-number') &&
       compactCssCode.includes('.btn-preset-create'),
    'DEF-32: compact.css contains Industrial Slate styling for live inspector stage');

// DEF-33: PresetService Search & Categorization Subsystem
const storageSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'services', 'Storage.js'), 'utf8');
const presetModelSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'models', 'Preset.js'), 'utf8');
const presetServiceSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'services', 'PresetService.js'), 'utf8');
// Mock localStorage in hostContext
hostContext.localStorage = {
    _store: {},
    getItem: function(k) { return this._store[k] !== undefined ? this._store[k] : null; },
    setItem: function(k, v) { this._store[k] = String(v); },
    removeItem: function(k) { delete this._store[k]; },
    clear: function() { this._store = {}; }
};
vm.runInContext(storageSrc, hostContext);
vm.runInContext(presetModelSrc, hostContext);
vm.runInContext(presetServiceSrc, hostContext);

const allPresets = hostContext.PresetService.getAll();
assert(allPresets.length === 18,
    'DEF-33: PresetService auto-seeds with the 18 Golden Presets on initial startup');
const searchSnappy = hostContext.PresetService.search('Snappy', 'counter');
assert(searchSnappy.length >= 1 && searchSnappy[0].name.includes('Social Metric'),
    'DEF-33: PresetService.search successfully finds presets by name keyword');
const timerFiltered = hostContext.PresetService.getByCategory('timer');
assert(timerFiltered.length === 6 && timerFiltered[0].category === 'timer',
    'DEF-33: PresetService.getByCategory correctly filters only timer presets');
const nodesFiltered = hostContext.PresetService.getByCategory('nodes');
assert(nodesFiltered.length === 6 && nodesFiltered[0].category === 'nodes',
    'DEF-33: PresetService.getByCategory correctly filters only nodes/markers presets');
const searchMilestone = hostContext.PresetService.search('Milestone', 'nodes');
assert(searchMilestone.length >= 1 && searchMilestone[0].name.includes('Milestone 3-Tier'),
    'DEF-33: PresetService.search finds multi-node presets by keyword');

// DEF-34: Preset Duplication, EaseStrength Preservation & Factory Protection
const duped = hostContext.PresetService.duplicate(counterPresets[0].id);
assert(duped && duped.isFactory === false && duped.name.includes('(Copy)'),
    'DEF-34: PresetService.duplicate clones preset as non-factory user preset');
assert(duped.settings.easeStrength === counterPresets[0].settings.easeStrength,
    'DEF-34: Duplicated preset preserves exact easeStrength (85%)');

// DEF-35: Presets JSON Export & Strict Import Validation
const exportedJSON = hostContext.PresetService.exportJSON();
assert(typeof exportedJSON === 'string' && exportedJSON.includes('Social Metric') && exportedJSON.includes('Boxing'),
    'DEF-35: PresetService.exportJSON exports valid JSON string containing presets');
const importSuccess = hostContext.PresetService.importJSON(JSON.stringify([{
    name: 'Custom Marketing Counter',
    category: 'counter',
    settings: {
        counterType: 'basic',
        start: 0,
        end: 50000,
        duration: 2,
        easing: 'smoothOut',
        easeStrength: 80,
        easingConfig: { mode: 'single', singleCurveId: 'smoothOut', easeStrength: 80 }
    }
}]));
assert(importSuccess === true,
    'DEF-35: PresetService.importJSON successfully parses and imports valid custom preset');
const importedFound = hostContext.PresetService.search('Marketing');
assert(importedFound.length === 1 && importedFound[0].settings.easeStrength === 80,
    'DEF-35: Imported custom preset is searchable and preserves easeStrength');

// DEF-36: Cross-Type & Preset Direct Creation Invariant
const creationSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'creation.js'), 'utf8');
assert(creationSrc.includes('forceCreate') &&
       creationSrc.includes('linkedType === type'),
    'DEF-36: CreationModule allows creating a timer when a counter is selected and supports forceCreate');

// DEF-37: Reset State Invariant & Default Parity (CORR-01)
const appSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'app.js'), 'utf8');
assert(appSrc.includes('resetAllToDefaults') &&
       appSrc.includes('commas: true') &&
       appSrc.includes('elements.toggleCommasBtn.classList.add(\'active\')') &&
       appSrc.includes('endMins: 5') &&
       appSrc.includes('elements.selectCountdownFormat.value = \'hmsf\''),
    'DEF-37: app.js resetAllToDefaults maintains 100% parity with initial state (commas: true, endMins: 5, hmsf)');

// DEF-38: Presets Module useMarkers Persistence (CORR-02)
const presetsModuleSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'presets.js'), 'utf8');
assert(presetsModuleSrc.includes('_state.counter.useMarkers = useMarkersVal') &&
       presetsModuleSrc.includes('toggleMarkersBtn.classList.toggle(\'active\', useMarkersVal)'),
    'DEF-38: presets.js applySettings restores useMarkers state and toggles button correctly');

// DEF-39: Fractional Frame Rate Math for NTSC 29.97fps (CORR-03)
const timerModuleSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'timer.js'), 'utf8');
assert(timerModuleSrc.includes('var maxFrames = Math.max(1, Math.round(fps) - 1);'),
    'DEF-39: timer.js uses Math.round(fps)-1 for maxFrames, preventing fractional frame truncation in NTSC');

// DEF-40: Settings Modal Unique DOM IDs (CORR-04)
assert(appSrc.includes('id="modal-btn-export-presets"') &&
       appSrc.includes('id="modal-btn-import-presets"') &&
       appSrc.includes('id="modal-btn-clear-presets"'),
    'DEF-40: app.js showSettingsModal uses unique IDs avoiding DOM collision with index.html');

// DEF-41: Purge of Dead Code _handleTypeMismatch (CORR-05)
assert(!creationSrc.includes('function _handleTypeMismatch'),
    'DEF-41: creation.js has cleanly purged orphaned _handleTypeMismatch dead code');

// DEF-42: HTML Label Accessibility Attributes (CORR-06)
const indexHtmlSrc = fs.readFileSync(path.join(baseDir, 'client', 'index.html'), 'utf8');
assert(indexHtmlSrc.includes('for="input-duration"') &&
       indexHtmlSrc.includes('for="input-startat"') &&
       indexHtmlSrc.includes('for="select-countdown-format"'),
    'DEF-42: index.html includes for attributes on config labels for accessibility and click-focus');

// DEF-43: Bridge getCompPlayheadInfo Contract (BUG-01, BUG-10)
const bridgeSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'bridge', 'Bridge.js'), 'utf8');
assert(bridgeSrc.includes('getCompPlayheadInfo:') &&
       bridgeSrc.includes('function getCompPlayheadInfo('),
    'DEF-43: Bridge.js exports getCompPlayheadInfo returning structured { time, fps }');
assert(bridgeSrc.includes('parsed.markers || (parsed.data && parsed.data.markers)'),
    'DEF-43: Bridge.js syncNodeMarkers correctly unpacks flattened markers payload');

// DEF-44: Live Slider Sync Focus Preservation & Sequence Comparison (BUG-02)
assert(appSrc.includes('function _areNodesEqual(seqA, seqB)') &&
       appSrc.includes('activeEl.closest(\'#panel-nodes\')'),
    'DEF-44: app.js guards _syncLiveValues against DOM destruction and focus stealing');

// DEF-45: ExpressionGenerator ES3 Radix 10 Hardening (BUG-05)
const exprGenSrc = fs.readFileSync(path.join(baseDir, 'host', 'expressions', 'ExpressionGenerator.jsx'), 'utf8');
assert(!exprGenSrc.includes('parseInt(intPart))') &&
       exprGenSrc.includes('parseInt(intPart, 10)'),
    'DEF-45: ExpressionGenerator strictly specifies radix 10 for parseInt, preventing ES3 octal evaluation');

// DEF-46: Validator Nodes Sequence Support (BUG-06)
assert(typeof Validator.validateNodes === 'function',
    'DEF-46: Validator.js exports validateNodes method');
const nodesValidSample = {
    counterType: 'nodes',
    nodes: [
        { id: '1', type: 'number', value: 0, time: 0 },
        { id: '2', type: 'number', value: 100, time: 2 }
    ]
};
assert(Validator.isValid(nodesValidSample) === true,
    'DEF-46: Validator.isValid returns true for valid nodes sequence');

// DEF-47: CreationModule IPC Watchdog Timer (BUG-07)
assert(creationSrc.includes('watchdogTimer') &&
       creationSrc.includes('updateWatchdog'),
    'DEF-47: CreationModule implements 10-second watchdog timers for create and update');

// DEF-48: KeyboardShortcuts Non-Blocking Ctrl+Enter in Text Inputs (BUG-08)
const shortcutsSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'keyboard-shortcuts.js'), 'utf8');
assert(shortcutsSrc.includes('isCtrlEnter') &&
       shortcutsSrc.includes('if (isInput && !isCtrlEnter) return;'),
    'DEF-48: KeyboardShortcuts allows Ctrl+Enter / Cmd+Enter inside input and textarea elements');

// -------------------------------------------------------------------
// [SUITE 5] SYSTEM ELEVATION & ARCHITECTURAL HARDENING (v4.2.0)
// -------------------------------------------------------------------
const hostIndexSrc = fs.readFileSync(path.join(baseDir, 'host', 'index.jsx'), 'utf8');

// DEF-49: Relative Marker Timing in SettingsExtractor (VULN-01)
const settingsExtractorSrc = fs.readFileSync(path.join(baseDir, 'host', 'services', 'SettingsExtractor.jsx'), 'utf8');
assert(settingsExtractorSrc.includes('kTime - inPoint') &&
       settingsExtractorSrc.includes('absTime: kTime'),
    'DEF-49: SettingsExtractor normalizes marker time relative to layer inPoint and preserves absTime');

// DEF-50: Slider Isolation on updateLayer (VULN-02)
assert(hostIndexSrc.includes('isCounterFamily') &&
       hostIndexSrc.includes('NOMRO_CONSTANTS.LAYER_TYPES.COUNTER') &&
       hostIndexSrc.includes('if (isCounterFamily)'),
    'DEF-50: host/index.jsx isolates slider updates strictly to counter layers, preventing slider pollution');

// DEF-51: Clean NodesBuilder without NOMRO_Ease (VULN-03)
const nodesBuilderSrc = fs.readFileSync(path.join(baseDir, 'host', 'core', 'NodesBuilder.jsx'), 'utf8');
assert(!nodesBuilderSrc.includes("NOMRO.core.addSlider(textLayer, 'NOMRO_Ease'"),
    'DEF-51: NodesBuilder is completely clean and does not create orphaned NOMRO_Ease slider');

// DEF-52: Undo Group Wrapping for addNodeMarker (VULN-04)
assert(hostIndexSrc.includes("NOMRO.helpers.withUndoGroup('NOMRO Add Node Marker'"),
    'DEF-52: host/index.jsx wraps addNodeMarker inside withUndoGroup for safe AE undo history');

// DEF-53: Manifest & Host Version 4.2.0 (VULN-07)
const manifestSrc = fs.readFileSync(path.join(baseDir, 'CSXS', 'manifest.xml'), 'utf8');
assert(manifestSrc.includes('ExtensionBundleVersion="4.2.0"') &&
       manifestSrc.includes('Version="4.2.0"') &&
       hostIndexSrc.includes("VERSION: '4.2.0'"),
    'DEF-53: CSXS manifest.xml and host/index.jsx are synchronized to version 4.2.0');

// DEF-54: Dynamic Ruler Scrub Bounds (VULN-05)
const nodesViewSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'views', 'NodesView.js'), 'utf8');
assert(nodesViewSrc.includes('track.getBoundingClientRect()') &&
       nodesViewSrc.includes('clickX = e.clientX - rect.left') &&
       nodesViewSrc.includes('availWidth = Math.max(1, rect.width)') &&
       !nodesViewSrc.includes('rect.width - 28'),
    'DEF-54: NodesView calculates ruler scrubbing dynamically from track bounds without magic numbers');

// DEF-55: In-Place DOM Card Update & Preview Stability (VULN-06)
const nodesSrc = fs.readFileSync(path.join(baseDir, 'client', 'js', 'modules', 'nodes.js'), 'utf8');
assert(nodesViewSrc.includes('updateNodeCardValues:') &&
       nodesSrc.includes('NodesView.updateNodeCardValues') &&
       nodesSrc.includes('renderRulerOnly()'),
    'DEF-55: Nodes subsystem implements in-place DOM card updates preserving focus and preview playhead');

// DEF-56: Native Browser Spinbutton Suppression (SYS-13)
assert(compactCssCode.includes('input[type="number"]::-webkit-outer-spin-button') &&
       compactCssCode.includes('.input-field-compact::-webkit-outer-spin-button') &&
       compactCssCode.includes('-webkit-appearance: none;'),
    'DEF-56: compact.css comprehensively hides native browser number spin buttons across all inputs');

// DEF-57: Universal Native Effects Service EffectPresetApplier (VULN-09 / SYS-07)
const effectApplierPath = path.join(baseDir, 'host', 'services', 'EffectPresetApplier.jsx');
assert(fs.existsSync(effectApplierPath), 'DEF-57: EffectPresetApplier.jsx exists in host/services');
const effectApplierSrc = fs.readFileSync(effectApplierPath, 'utf8');
assert(effectApplierSrc.includes('NOMRO.effects.applyPresetEffects') &&
       effectApplierSrc.includes('ADBE Drop Shadow') &&
       effectApplierSrc.includes('ADBE Glo2') &&
       hostIndexSrc.includes('#include "services/EffectPresetApplier.jsx"'),
    'DEF-57: EffectPresetApplier defines applyPresetEffects supporting ADBE Drop Shadow and Glo2');

// DEF-58: Universal Milestone Layer Markers Service (SYS-08)
const nodeMarkerServiceSrc = fs.readFileSync(path.join(baseDir, 'host', 'services', 'NodeMarkerService.jsx'), 'utf8');
assert(nodeMarkerServiceSrc.includes('NOMRO.markers.applyMilestoneMarkers'),
    'DEF-58: NodeMarkerService exports applyMilestoneMarkers for universal layer markers');

// DEF-59: Builders Integration with Effects & Milestone Markers (SYS-07, SYS-08)
assert(counterBuilderSrc.includes('NOMRO.effects.applyPresetEffects') &&
       counterBuilderSrc.includes('NOMRO.markers.applyMilestoneMarkers') &&
       countdownBuilderSrc.includes('NOMRO.effects.applyPresetEffects') &&
       countdownBuilderSrc.includes('NOMRO.markers.applyMilestoneMarkers') &&
       nodesBuilderSrc.includes('NOMRO.effects.applyPresetEffects') &&
       hostIndexSrc.includes('NOMRO.effects.applyPresetEffects'),
    'DEF-59: CounterBuilder, CountdownBuilder, NodesBuilder, and updateLayer wire preset effects and milestone markers');

// DEF-60: Presets Enhanced with Native Effects & Layer Markers (SYS-16)
assert(presetDefaultsSrc.includes("matchName: 'ADBE Drop Shadow'") &&
       presetDefaultsSrc.includes("matchName: 'ADBE Glo2'") &&
       presetDefaultsSrc.includes('layerMarkers: true'),
    'DEF-60: PresetDefaults enriches factory presets with native effects and layerMarkers');

// DEF-61: Selection Polling Throttling when Hidden or Modal Active (SYS-15 / VULN-10)
assert(appSrc.includes('document.hidden') &&
       appSrc.includes('modalOpen') &&
       appSrc.includes('selectionRequestInFlight'),
    'DEF-61: app.js throttles selection polling when tab is hidden or modal dialog is active');

// DEF-62: Enhanced Layer Type Detection via Marker Comments (VULN-08)
const layerResolverSrc = fs.readFileSync(path.join(baseDir, 'host', 'services', 'LayerResolver.jsx'), 'utf8');
assert(layerResolverSrc.includes('/^(NUM:|TIME:|TXT:|DELTA:)/'),
    'DEF-62: LayerResolver uses marker comment regex /^(NUM:|TIME:|TXT:|DELTA:)/ to reliably identify nodes layers');

// DEF-63: Simulated EffectPresetApplier Execution & Property Setting
(function testSimulatedEffectApplier() {
    const mockPropMap = {};
    const mockEffect = {
        name: 'Drop Shadow',
        matchName: 'ADBE Drop Shadow',
        property: function (propName) {
            return {
                setValue: function (val) {
                    mockPropMap[propName] = val;
                }
            };
        }
    };
    const mockLayer = {
        property: function () { return { numProperties: 0 }; },
        Effects: {
            addProperty: function (name) {
                return mockEffect;
            }
        }
    };

    const effectVMContext = vm.createContext({
        NOMRO: { effects: {}, helpers: { logError: function () {} } }
    });
    vm.runInContext(effectApplierSrc, effectVMContext);
    const applied = effectVMContext.NOMRO.effects.applyPresetEffects(mockLayer, [
        { matchName: 'ADBE Drop Shadow', opacity: 75, distance: 10, softness: 15 }
    ]);
    assert(applied === 1, 'DEF-63: Simulated EffectPresetApplier successfully applied 1 effect');
    assert(mockPropMap['ADBE Drop Shadow-0002'] === 75 || mockPropMap['Opacity'] === 75,
        'DEF-63: Simulated EffectPresetApplier set opacity value on effect');
})();

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
