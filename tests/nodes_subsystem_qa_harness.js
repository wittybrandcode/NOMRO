/**
 * NOMRO PRO — Multi-Node Sequence Subsystem QA Harness
 * Comprehensive verification of NodeSequence model, marker serialization,
 * NodesExpressionGenerator, NodesModule calculation, and DOM wiring.
 */

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var BASE_DIR = path.resolve(__dirname, '..');

var totalTests = 0;
var passedTests = 0;
var failedTests = 0;

function runTest(desc, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log('  ✔ PASS: ' + desc);
    } catch (e) {
        failedTests++;
        console.error('  ✘ FAIL: ' + desc);
        console.error('    Error: ' + e.message);
    }
}

console.log('\n===============================================================');
console.log('    NOMRO PRO — MULTI-NODE SUBSYSTEM QA HARNESS (v4.2.0)       ');
console.log('===============================================================\n');

// -------------------------------------------------------------
// [SUITE 1] NodeSequence Data Model & Marker Serialization
// -------------------------------------------------------------
console.log('[SUITE 1] Testing NodeSequence Model & Serialization...');

var NodeSequence = require(path.join(BASE_DIR, 'client/js/models/NodeSequence.js'));

runTest('NodeSequence exports required constants and methods', function () {
    assert.strictEqual(typeof NodeSequence.createNode, 'function');
    assert.strictEqual(typeof NodeSequence.getDefaultSequence, 'function');
    assert.strictEqual(typeof NodeSequence.sortNodes, 'function');
    assert.strictEqual(typeof NodeSequence.sanitizeSequence, 'function');
    assert.strictEqual(typeof NodeSequence.toMarkerComment, 'function');
    assert.strictEqual(typeof NodeSequence.fromMarkerComment, 'function');
    assert.strictEqual(NodeSequence.NODE_TYPES.NUMBER, 'number');
    assert.strictEqual(NodeSequence.NODE_TYPES.TIME, 'time');
    assert.strictEqual(NodeSequence.NODE_TYPES.TEXT, 'text');
    assert.strictEqual(NodeSequence.NODE_TYPES.DELTA, 'delta');
});

runTest('getDefaultSequence returns 3 ordered nodes', function () {
    var def = NodeSequence.getDefaultSequence();
    assert.strictEqual(def.length, 3);
    assert.strictEqual(def[0].value, 0);
    assert.strictEqual(def[1].value, 500);
    assert.strictEqual(def[2].value, 1000);
    assert.strictEqual(def[0].time, 0);
    assert.strictEqual(def[1].time, 2);
    assert.strictEqual(def[2].time, 4);
});

runTest('toMarkerComment formats Number, Time, Text, and Delta correctly', function () {
    var nNum = NodeSequence.createNode({ type: 'number', value: 1500, hold: 1.0, easing: 'snappyOut' });
    assert.strictEqual(NodeSequence.toMarkerComment(nNum), 'NUM:1500|H:1|E:snappyOut');

    var nTime = NodeSequence.createNode({ type: 'time', value: '00:03:00', hold: 0 });
    assert.strictEqual(NodeSequence.toMarkerComment(nTime), 'TIME:00:03:00');

    var nTxt = NodeSequence.createNode({ type: 'text', value: 'HALFTIME', hold: 2.5 });
    assert.strictEqual(NodeSequence.toMarkerComment(nTxt), 'TXT:HALFTIME|H:2.5');

    var nDelta = NodeSequence.createNode({ type: 'delta', value: '+25%' });
    assert.strictEqual(NodeSequence.toMarkerComment(nDelta), 'DELTA:+25%');
});

runTest('fromMarkerComment parses payloads with options accurately', function () {
    var parsed1 = NodeSequence.fromMarkerComment('NUM:2500|H:1.5|E:bounceOut', 3.0);
    assert.strictEqual(parsed1.type, 'number');
    assert.strictEqual(parsed1.value, 2500);
    assert.strictEqual(parsed1.hold, 1.5);
    assert.strictEqual(parsed1.easing, 'bounceOut');
    assert.strictEqual(parsed1.time, 3.0);

    var parsed2 = NodeSequence.fromMarkerComment('TIME:01:20:00', 5.0);
    assert.strictEqual(parsed2.type, 'time');
    assert.strictEqual(parsed2.value, '01:20:00');
    assert.strictEqual(parsed2.hold, 0);
    assert.strictEqual(parsed2.time, 5.0);

    var parsed3 = NodeSequence.fromMarkerComment('TXT:GOAL!', 10.0);
    assert.strictEqual(parsed3.type, 'text');
    assert.strictEqual(parsed3.value, 'GOAL!');
});

runTest('sortNodes orders by time chronologically', function () {
    var unsorted = [
        NodeSequence.createNode({ time: 5 }),
        NodeSequence.createNode({ time: 1 }),
        NodeSequence.createNode({ time: 3 })
    ];
    var sorted = NodeSequence.sortNodes(unsorted);
    assert.strictEqual(sorted[0].time, 1);
    assert.strictEqual(sorted[1].time, 3);
    assert.strictEqual(sorted[2].time, 5);
});

// -------------------------------------------------------------
// [SUITE 2] NodesExpressionGenerator
// -------------------------------------------------------------
console.log('\n[SUITE 2] Testing NodesExpressionGenerator...');

var exprGenPath = path.join(BASE_DIR, 'host/expressions/NodesExpressionGenerator.jsx');
var exprGenContent = fs.readFileSync(exprGenPath, 'utf8');

runTest('NodesExpressionGenerator file exists and exports generateNodesExpression', function () {
    assert.ok(exprGenContent.length > 500);
    assert.ok(exprGenContent.indexOf('NOMRO.expressions.generateNodesExpression') !== -1);
});

runTest('Generated expression contains piecewise interpolation & easing evaluation', function () {
    // Mock environment for Node.js
    var NOMRO = { expressions: {} };
    eval(exprGenContent);

    var settings = {
        counterType: 'nodes',
        nodes: NodeSequence.getDefaultSequence(),
        commas: true,
        monospace: false
    };

    var expr = NOMRO.expressions.generateNodesExpression(settings);
    assert.ok(expr.indexOf('NOMRO_CONFIG') !== -1);
    assert.ok(expr.indexOf('function applyEase') !== -1);
    assert.ok(expr.indexOf('function timeStrToSec') !== -1);
    assert.ok(expr.indexOf('function secToTimeStr') !== -1);
    assert.ok(expr.indexOf('function formatNumber') !== -1);
    assert.ok(expr.indexOf('markers.numKeys') !== -1);
});

// -------------------------------------------------------------
// [SUITE 3] NodesModule Calculation & Logic
// -------------------------------------------------------------
console.log('\n[SUITE 3] Testing NodesModule Preview Calculation...');

var NodesModule = require(path.join(BASE_DIR, 'client/js/modules/nodes.js'));

runTest('NodesModule initializes and calculates output at waypoints', function () {
    var state = {
        nodes: {
            sequence: [
                NodeSequence.createNode({ id: 'n1', type: 'number', value: 0, time: 0, hold: 0 }),
                NodeSequence.createNode({ id: 'n2', type: 'number', value: 1000, time: 2, hold: 0 })
            ],
            easing: 'linear',
            easeStrength: 75,
            format: 'normal',
            commas: true
        }
    };

    NodesModule.init({}, state, {});

    var out0 = NodesModule.calculateOutputAtTime(0);
    assert.strictEqual(out0.display, '0');
    assert.strictEqual(out0.activeIndex, 0);

    var out2 = NodesModule.calculateOutputAtTime(2);
    assert.strictEqual(out2.display, '1,000');
    assert.strictEqual(out2.activeIndex, 1);
});

runTest('NodesModule handles hold duration correctly', function () {
    var state = {
        nodes: {
            sequence: [
                NodeSequence.createNode({ id: 'n1', type: 'number', value: 100, time: 0, hold: 1.0 }),
                NodeSequence.createNode({ id: 'n2', type: 'number', value: 500, time: 3, hold: 0 })
            ],
            easing: 'linear',
            commas: false
        }
    };
    NodesModule.init({}, state, {});

    // At t = 0.5s (inside hold), value must remain 100
    var outHold = NodesModule.calculateOutputAtTime(0.5);
    assert.strictEqual(outHold.display, '100');
    assert.strictEqual(outHold.activeIndex, 0);
});

runTest('NodesModule multi-type transition (time to number)', function () {
    var state = {
        nodes: {
            sequence: [
                NodeSequence.createNode({ id: 'n1', type: 'time', value: '00:01:00', time: 0, hold: 0 }),
                NodeSequence.createNode({ id: 'n2', type: 'number', value: 120, time: 2, hold: 0 })
            ],
            easing: 'linear',
            commas: false
        }
    };
    NodesModule.init({}, state, {});

    // At t=0, starts as 60s
    var out0 = NodesModule.calculateOutputAtTime(0);
    assert.strictEqual(out0.display, '00:01:00');

    // At t=2, ends as 120
    var out2 = NodesModule.calculateOutputAtTime(2);
    assert.strictEqual(out2.display, '120');
});

runTest('NodesModule getSettings returns clean nodes payload', function () {
    var state = {
        nodes: {
            sequence: NodeSequence.getDefaultSequence(),
            easing: 'smoothOut',
            easeStrength: 75,
            format: 'normal'
        }
    };
    NodesModule.init({}, state, {});
    var settings = NodesModule.getSettings();
    assert.strictEqual(settings.counterType, 'nodes');
    assert.ok(Array.isArray(settings.nodes));
    assert.strictEqual(settings.easing, 'smoothOut');
});

// -------------------------------------------------------------
// [SUITE 4] HTML, CSS & Architecture Wiring
// -------------------------------------------------------------
console.log('\n[SUITE 4] Testing UI & Script Wiring in index.html and CSS...');

var htmlContent = fs.readFileSync(path.join(BASE_DIR, 'client/index.html'), 'utf8');
var cssContent = fs.readFileSync(path.join(BASE_DIR, 'client/css/compact.css'), 'utf8');

runTest('index.html contains Nodes tab button with data-tab="nodes"', function () {
    assert.ok(htmlContent.indexOf('data-tab="nodes"') !== -1);
});

runTest('index.html contains #panel-nodes with all required components', function () {
    assert.ok(htmlContent.indexOf('id="panel-nodes"') !== -1);
    assert.ok(htmlContent.indexOf('id="preview-nodes-val"') !== -1);
    assert.ok(htmlContent.indexOf('id="nodes-list-container"') !== -1);
    assert.ok(htmlContent.indexOf('id="btn-add-node"') !== -1);
    assert.ok(htmlContent.indexOf('id="btn-create-nodes"') !== -1);
});

runTest('index.html includes NodeSequence.js, NodesView.js, and nodes.js', function () {
    assert.ok(htmlContent.indexOf('js/models/NodeSequence.js') !== -1);
    assert.ok(htmlContent.indexOf('js/views/NodesView.js') !== -1);
    assert.ok(htmlContent.indexOf('js/modules/nodes.js') !== -1);
});

runTest('compact.css contains multi-node styling tokens and classes', function () {
    assert.ok(cssContent.indexOf('.node-card') !== -1);
    assert.ok(cssContent.indexOf('.nodes-preview-stage') !== -1);
    assert.ok(cssContent.indexOf('.node-connector') !== -1);
    assert.ok(cssContent.indexOf('.btn-add-node-block') !== -1);
});

runTest('LayerResolver recognizes nodes family and detectLayerType', function () {
    var resolverPath = path.join(BASE_DIR, 'host/services/LayerResolver.jsx');
    var resolverContent = fs.readFileSync(resolverPath, 'utf8');
    assert.ok(resolverContent.indexOf('NOMRO_CONSTANTS.LAYER_TYPES.NODES') !== -1);
    assert.ok(resolverContent.indexOf('Sequence') !== -1);
    assert.ok(resolverContent.indexOf('Nodes') !== -1);
});

// -------------------------------------------------------------
// [SUITE 5] NodeMarkerService & Marker System Integration
// -------------------------------------------------------------
console.log('\n[SUITE 5] Testing NodeMarkerService & Marker Operations...');

var markerServicePath = path.join(BASE_DIR, 'host/services/NodeMarkerService.jsx');
var markerServiceContent = fs.readFileSync(markerServicePath, 'utf8');

runTest('NodeMarkerService file exists and defines NOMRO.markers methods', function () {
    assert.ok(markerServiceContent.indexOf('NOMRO.markers.getMarkerLabelForType') !== -1);
    assert.ok(markerServiceContent.indexOf('NOMRO.markers.buildMarkerPayload') !== -1);
    assert.ok(markerServiceContent.indexOf('NOMRO.markers.writeNodeMarkers') !== -1);
    assert.ok(markerServiceContent.indexOf('NOMRO.markers.addNodeMarker') !== -1);
    assert.ok(markerServiceContent.indexOf('NOMRO.markers.readNodeMarkers') !== -1);
});

runTest('NodeMarkerService assigns correct color labels for each node type', function () {
    var NOMRO = { helpers: {} };
    eval(markerServiceContent);

    assert.strictEqual(NOMRO.markers.getMarkerLabelForType('number'), 8);  // Blue
    assert.strictEqual(NOMRO.markers.getMarkerLabelForType('time'), 9);    // Green
    assert.strictEqual(NOMRO.markers.getMarkerLabelForType('text'), 10);   // Purple
    assert.strictEqual(NOMRO.markers.getMarkerLabelForType('delta'), 11);  // Orange
});

runTest('Bridge.js exports addNodeMarker and syncNodeMarkers', function () {
    var bridgePath = path.join(BASE_DIR, 'client/js/bridge/Bridge.js');
    var bridgeContent = fs.readFileSync(bridgePath, 'utf8');
    assert.ok(bridgeContent.indexOf('addNodeMarker') !== -1);
    assert.ok(bridgeContent.indexOf('syncNodeMarkers') !== -1);
});

runTest('index.html contains marker quick creator and timeline ruler', function () {
    assert.ok(htmlContent.indexOf('id="nodes-marker-ruler-rail"') !== -1);
    assert.ok(htmlContent.indexOf('id="btn-quick-add-marker"') !== -1);
    assert.ok(htmlContent.indexOf('id="btn-sync-markers-from-layer"') !== -1);
    assert.ok(htmlContent.indexOf('id="btn-write-markers-to-layer"') !== -1);
});

runTest('compact.css contains styling for marker ruler and quick creator', function () {
    assert.ok(cssContent.indexOf('.nodes-marker-ruler-box') !== -1);
    assert.ok(cssContent.indexOf('.nodes-ruler-pin') !== -1);
    assert.ok(cssContent.indexOf('.btn-add-marker-quick') !== -1);
    assert.ok(cssContent.indexOf('.select-compact') !== -1);
    assert.ok(cssContent.indexOf('.input-unit-compact') !== -1);
    assert.ok(cssContent.indexOf('.input-short') !== -1);
    assert.ok(cssContent.indexOf('.ruler-playhead') !== -1);
});

runTest('index.html contains #input-quick-marker-time and #btn-quick-capture-cti', function () {
    assert.ok(htmlContent.indexOf('id="input-quick-marker-time"') !== -1);
    assert.ok(htmlContent.indexOf('id="btn-quick-capture-cti"') !== -1);
});

runTest('NodesView renders high-density card rows and ruler playhead needle', function () {
    var NodesView = require(path.join(BASE_DIR, 'client/js/views/NodesView.js'));
    assert.strictEqual(typeof NodesView.renderNodeList, 'function');
    assert.strictEqual(typeof NodesView.renderMarkerRuler, 'function');

    // Minimal Node.js mock for document
    global.document = {
        createElement: function (tag) {
            return {
                tagName: tag,
                className: '',
                style: {},
                innerHTML: '',
                setAttribute: function (k, v) { this[k] = v; },
                getAttribute: function (k) { return this[k]; },
                appendChild: function (child) { this.children = this.children || []; this.children.push(child); },
                addEventListener: function () {},
                querySelector: function () { return null; },
                querySelectorAll: function () { return []; }
            };
        }
    };

    // Test renderNodeList with mock container
    var mockListContainer = { innerHTML: '', appendChild: function (el) { this.children.push(el); }, children: [] };
    var mockSeq = [
        { id: 'n1', type: 'number', value: 100, time: 0, hold: 0.5, easing: 'smoothOut' },
        { id: 'n2', type: 'time', value: '00:01:00', time: 2, hold: 0, easing: 'linear' }
    ];
    NodesView.renderNodeList(mockListContainer, mockSeq, {});
    assert.ok(mockListContainer.children.length >= 2);
    assert.ok(mockListContainer.children[0].innerHTML.indexOf('node-row-primary') !== -1);
    assert.ok(mockListContainer.children[0].innerHTML.indexOf('node-row-secondary') !== -1);

    // Test renderMarkerRuler with mock container
    var mockRulerContainer = { innerHTML: '', appendChild: function (el) { this.children.push(el); }, children: [] };
    NodesView.renderMarkerRuler(mockRulerContainer, mockSeq, null);
    assert.ok(mockRulerContainer.children.length === 1);
    var trackEl = mockRulerContainer.children[0];
    assert.strictEqual(trackEl.className, 'nodes-ruler-track');
});

runTest('NodesModule exports marker system methods', function () {
    assert.strictEqual(typeof NodesModule.quickAddMarker, 'function');
    assert.strictEqual(typeof NodesModule.syncMarkersFromLayer, 'function');
    assert.strictEqual(typeof NodesModule.writeMarkersToLayer, 'function');
});

// -------------------------------------------------------------
// [SUITE 6] Testing Multi-Node Presets & Layer Markers Integration
// -------------------------------------------------------------
console.log('\n[SUITE 6] Testing Multi-Node Presets & Layer Markers Integration...');

var PresetDefaults = require(path.join(BASE_DIR, 'client/js/presets/PresetDefaults.js'));
var Preset = require(path.join(BASE_DIR, 'client/js/models/Preset.js'));

runTest('PresetDefaults contains 6 Golden Nodes presets', function () {
    var factory = PresetDefaults.getFactoryPresets();
    var nodePresets = factory.filter(function (p) { return p.category === 'nodes'; });
    assert.strictEqual(nodePresets.length, 6);
    assert.ok(nodePresets.every(function (p) {
        return p.isFactory === true &&
            p.settings &&
            p.settings.counterType === 'nodes' &&
            Array.isArray(p.settings.nodes) &&
            p.settings.nodes.length >= 3;
    }));
});

runTest('Preset model correctly resolves nodes category', function () {
    var pNode = Preset.create('Test Node Preset', {
        counterType: 'nodes',
        nodes: [{ type: 'number', value: 0, time: 0 }, { type: 'number', value: 100, time: 2 }]
    });
    assert.strictEqual(pNode.category, 'nodes');
    assert.strictEqual(pNode.isFactory, false);
    assert.strictEqual(pNode.settings.counterType, 'nodes');
});

runTest('Nodes preset JSON serialization roundtrips flawlessly', function () {
    var original = Preset.create('Roundtrip Sequence', {
        counterType: 'nodes',
        nodes: [
            { id: 'n1', type: 'number', value: 0, time: 0, hold: 0.5 },
            { id: 'n2', type: 'time', value: '00:01:00', time: 3, hold: 1.0 },
            { id: 'n3', type: 'text', value: 'DONE', time: 5, hold: 0 }
        ]
    });
    var jsonStr = Preset.toJSON(original);
    var deserialized = Preset.fromJSON(jsonStr);
    assert.strictEqual(deserialized.name, 'Roundtrip Sequence');
    assert.strictEqual(deserialized.category, 'nodes');
    assert.strictEqual(deserialized.settings.nodes.length, 3);
    assert.strictEqual(deserialized.settings.nodes[2].value, 'DONE');
});

// -------------------------------------------------------------
// [SUITE 7] Testing Elevated Math Parity, Validation & Radix Hardening
// -------------------------------------------------------------
console.log('\n[SUITE 7] Testing Elevated Math Parity, Validation & Hardening...');

var ValidatorSrc = fs.readFileSync(path.join(BASE_DIR, 'client/js/services/Validator.js'), 'utf8');
var Validator = (function() {
    var window = {};
    eval(ValidatorSrc);
    return Validator;
})();

runTest('Validator.validateNodes validates correct sequence and detects anomalies', function () {
    assert.strictEqual(typeof Validator.validateNodes, 'function');

    // Valid sequence
    var validNodes = [
        { id: '1', type: 'number', value: 0, time: 0, hold: 0 },
        { id: '2', type: 'delta', value: '+25%', time: 2, hold: 0.5 },
        { id: '3', type: 'number', value: 2000, time: 4, hold: 0 }
    ];
    var valErrors = Validator.validateNodes({ nodes: validNodes });
    assert.strictEqual(valErrors.length, 0);

    // Too few nodes
    var shortErrors = Validator.validateNodes({ nodes: [{ id: '1', value: 100, time: 0 }] });
    assert.ok(shortErrors.length > 0);
    assert.ok(shortErrors[0].message.indexOf('At least 2') !== -1);

    // Negative timestamp
    var negErrors = Validator.validateNodes({ nodes: [
        { id: '1', value: 0, time: -1 },
        { id: '2', value: 100, time: 2 }
    ]});
    assert.ok(negErrors.length > 0);
    assert.ok(negErrors[0].message.indexOf('non-negative') !== -1);

    // Non-chronological order
    var chronoErrors = Validator.validateNodes({ nodes: [
        { id: '1', value: 0, time: 5 },
        { id: '2', value: 100, time: 2 }
    ]});
    assert.ok(chronoErrors.length > 0);
    assert.ok(chronoErrors[0].message.indexOf('chronologically') !== -1);
});

runTest('NodesExpressionGenerator contains recursive delta resolver and per-node easing', function () {
    var NOMRO = { version: '4.2.0', expressions: {} };
    eval(exprGenContent);
    var code = NOMRO.expressions.generateNodesExpression({
        nodes: [
            { type: 'number', value: 1000, time: 0 },
            { type: 'delta', value: '+25%', time: 2, ease: 'snappyOut' }
        ],
        decimals: false,
        commas: true
    });

    assert.ok(code.indexOf('function resolveNodeNum(idx)') !== -1, 'Defines recursive resolveNodeNum');
    assert.ok(code.indexOf('function applyEase(t, curve)') !== -1, 'Defines per-node applyEase with curve param');
    assert.ok(code.indexOf('parseInt(intPart, 10)') !== -1, 'Uses radix 10 for intPart parseInt');
    assert.ok(code.indexOf('ds.indexOf("%") !== -1') !== -1, 'Evaluates percentage delta in AE expression');
});

runTest('Bridge.getCompPlayheadInfo is exported and functional', function () {
    var bridgeCode = fs.readFileSync(path.join(BASE_DIR, 'client/js/bridge/Bridge.js'), 'utf8');
    assert.ok(bridgeCode.indexOf('getCompPlayheadInfo:') !== -1, 'Bridge exports getCompPlayheadInfo');
    assert.ok(bridgeCode.indexOf('function getCompPlayheadInfo(callback)') !== -1, 'Defines getCompPlayheadInfo');
    assert.ok(bridgeCode.indexOf('getCurrentCompTime()') !== -1, 'Calls getCurrentCompTime host script');
});

runTest('Quick Marker creator inputs have accessibility aria-labels', function () {
    var indexHtml = fs.readFileSync(path.join(BASE_DIR, 'client/index.html'), 'utf8');
    assert.ok(indexHtml.indexOf('id="input-quick-marker-type" title="Node Type (نوع العقدة)" aria-label="Node Type"') !== -1);
    assert.ok(indexHtml.indexOf('id="input-quick-marker-val" placeholder="Value..." value="1000" title="Marker Value (قيمة الماركر)" aria-label="Marker Value"') !== -1);
    assert.ok(indexHtml.indexOf('id="input-quick-marker-time"') !== -1 && indexHtml.indexOf('aria-label="Marker Time"') !== -1);
    assert.ok(indexHtml.indexOf('id="input-quick-marker-hold"') !== -1 && indexHtml.indexOf('aria-label="Hold Duration"') !== -1);
});

// -------------------------------------------------------------
// [SUITE 8] In-Place DOM Mutation & Universal Presets (v4.2.0)
// -------------------------------------------------------------
console.log('\n[SUITE 8] Testing In-Place DOM Mutation & Universal Presets...');

var NodesView = require(path.join(BASE_DIR, 'client/js/views/NodesView.js'));

runTest('NodesView exports updateNodeCardValues for in-place mutation', function () {
    assert.strictEqual(typeof NodesView.updateNodeCardValues, 'function');
});

runTest('NodesView.updateNodeCardValues updates card inputs without wiping DOM', function () {
    var mockCard = {
        className: 'node-card type-number',
        querySelector: function (sel) {
            if (sel === '.node-input-val') return this.valInp;
            if (sel === '.node-input-time') return this.timeInp;
            if (sel === '.node-input-hold') return this.holdInp;
            if (sel === '.node-select-ease') return this.easeSelect;
            if (sel === '.node-select-type') return this.typeSelect;
            return null;
        },
        querySelectorAll: function () { return []; },
        valInp: { value: '100', setAttribute: function () {} },
        timeInp: { value: '0' },
        holdInp: { value: '0' },
        easeSelect: { value: 'smoothOut' },
        typeSelect: { value: 'number' }
    };
    var mockContainer = {
        querySelector: function (sel) {
            if (sel.indexOf('node_test_1') !== -1) return mockCard;
            return null;
        },
        querySelectorAll: function () { return []; }
    };

    var updated = NodesView.updateNodeCardValues(mockContainer, 'node_test_1', {
        value: 500,
        time: 1.5,
        hold: 0.8,
        easing: 'snappyOut'
    });
    assert.strictEqual(updated, true);
    assert.strictEqual(mockCard.valInp.value, 500);
    assert.strictEqual(mockCard.timeInp.value, 1.5);
    assert.strictEqual(mockCard.holdInp.value, 0.8);
    assert.strictEqual(mockCard.easeSelect.value, 'snappyOut');
});

runTest('Universal EffectPresetApplier exists and defines applyPresetEffects', function () {
    var effectCode = fs.readFileSync(path.join(BASE_DIR, 'host/services/EffectPresetApplier.jsx'), 'utf8');
    assert.ok(effectCode.indexOf('NOMRO.effects.applyPresetEffects') !== -1);
    assert.ok(effectCode.indexOf('ADBE Drop Shadow') !== -1);
    assert.ok(effectCode.indexOf('ADBE Glo2') !== -1);
});

runTest('NodeMarkerService defines applyMilestoneMarkers for universal layer markers', function () {
    var markerCode = fs.readFileSync(path.join(BASE_DIR, 'host/services/NodeMarkerService.jsx'), 'utf8');
    assert.ok(markerCode.indexOf('NOMRO.markers.applyMilestoneMarkers') !== -1);
    assert.ok(markerCode.indexOf('50%:') !== -1);
    assert.ok(markerCode.indexOf('HALF-WAY') !== -1);
});

runTest('PresetDefaults factory presets include native effects and layerMarkers', function () {
    var factory = PresetDefaults.getFactoryPresets();
    var withEffects = factory.filter(function (p) {
        return p.settings && p.settings.effects && p.settings.effects.length > 0;
    });
    var withMarkers = factory.filter(function (p) {
        return p.settings && p.settings.layerMarkers === true;
    });
    assert.ok(withEffects.length >= 3, 'At least 3 factory presets include native effects');
    assert.ok(withMarkers.length >= 4, 'At least 4 factory presets include layerMarkers');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n===============================================================');
console.log('TOTAL TESTS RUN : ' + totalTests);
console.log('TESTS PASSED    : ' + passedTests);
console.log('TESTS FAILED    : ' + failedTests);
console.log('SUCCESS RATE    : ' + ((passedTests / totalTests) * 100).toFixed(2) + '%');
console.log('===============================================================\n');

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log('🚀 MULTI-NODE SUBSYSTEM HARNESS: 100% PASSED!\n');
    process.exit(0);
}
