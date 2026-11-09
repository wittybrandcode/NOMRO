/**
 * NOMRO - Multi-Node Sequence Controller Module
 * Manages sequence state, node manipulation, live multi-node interpolation preview, and AE sync
 * @module modules/nodes
 */
var NodesModule = (function () {
    'use strict';

    var _elements = {};
    var _state = null;
    var _callbacks = {};
    var _previewAnimId = null;
    var _previewStartTime = null;
    var _isPlayingPreview = false;
    var _currentPreviewTime = 0;
    var _isLooping = true;

    /**
     * Initialize Nodes module
     * @param {Object} elements
     * @param {Object} state
     * @param {Object} callbacks
     */
    function init(elements, state, callbacks) {
        _elements = elements || {};
        _state = state || {};
        _callbacks = callbacks || {};

        if (!_state.nodes) {
            _state.nodes = {
                sequence: (typeof NodeSequence !== 'undefined') ? NodeSequence.getDefaultSequence() : [],
                easing: 'smoothOut',
                easeStrength: 75,
                format: 'normal',
                monospace: false,
                commas: true,
                decimals: false,
                prefix: '',
                suffix: ''
            };
        }

        _cacheElements();
        _bindEvents();
        render();
        updatePreviewAtTime(0);
    }

    /**
     * Cache DOM elements for Nodes tab
     * @private
     */
    function _cacheElements() {
        if (typeof document === 'undefined') return;
        _elements.nodesContainer = document.getElementById('nodes-list-container');
        _elements.markerRuler = document.getElementById('nodes-marker-ruler-rail');
        _elements.btnAddNode = document.getElementById('btn-add-node');
        _elements.btnCapturePlayhead = document.getElementById('btn-capture-playhead-global');
        _elements.btnSyncMarkersFromLayer = document.getElementById('btn-sync-markers-from-layer');
        _elements.btnWriteMarkersToLayer = document.getElementById('btn-write-markers-to-layer');
        _elements.quickMarkerType = document.getElementById('input-quick-marker-type');
        _elements.quickMarkerVal = document.getElementById('input-quick-marker-val');
        _elements.quickMarkerTime = document.getElementById('input-quick-marker-time');
        _elements.btnQuickCaptureCTI = document.getElementById('btn-quick-capture-cti');
        _elements.quickMarkerHold = document.getElementById('input-quick-marker-hold');
        _elements.btnQuickAddMarker = document.getElementById('btn-quick-add-marker');
        _elements.rulerSub = document.getElementById('nodes-ruler-sub');
        _elements.previewNodesVal = document.getElementById('preview-nodes-val');
        _elements.previewNodesProgress = document.getElementById('preview-nodes-progress-fill');
        _elements.previewNodesStage = document.getElementById('preview-nodes-stage-indicator');
        _elements.hudCurrentTime = document.getElementById('nodes-hud-current-time');
        _elements.hudTotalTime = document.getElementById('nodes-hud-total-time');
        _elements.transportStatus = document.getElementById('nodes-transport-status');
        _elements.playPreviewBtn = document.getElementById('nodes-play-preview');
        _elements.stopPreviewBtn = document.getElementById('nodes-stop-preview');
        _elements.resetPreviewBtn = document.getElementById('nodes-reset-preview');
        _elements.btnPrevMarker = document.getElementById('nodes-prev-marker');
        _elements.btnNextMarker = document.getElementById('nodes-next-marker');
        _elements.btnEndMarker = document.getElementById('nodes-end-preview');
        _elements.btnToggleLoop = document.getElementById('nodes-toggle-loop-btn');
        _elements.toggleMonospaceBtn = document.getElementById('nodes-toggle-monospace-btn');
        _elements.toggleCommasBtn = document.getElementById('nodes-toggle-commas-btn');
    }

    /**
     * Bind UI event handlers
     * @private
     */
    function _bindEvents() {
        if (typeof document === 'undefined') return;
        // Add Node button
        if (_elements.btnAddNode) {
            _elements.btnAddNode.addEventListener('click', function () {
                addNode();
            });
        }

        // Quick Marker Add Button
        if (_elements.btnQuickAddMarker) {
            _elements.btnQuickAddMarker.addEventListener('click', function () {
                quickAddMarker();
            });
        }

        // Quick CTI Capture Button
        if (_elements.btnQuickCaptureCTI) {
            _elements.btnQuickCaptureCTI.addEventListener('click', function () {
                if (typeof Bridge !== 'undefined' && Bridge.getCompPlayheadTime) {
                    Bridge.getCompPlayheadTime(function (err, compTime) {
                        if (!err && typeof compTime === 'number') {
                            if (_elements.quickMarkerTime) {
                                _elements.quickMarkerTime.value = parseFloat(compTime.toFixed(2));
                            }
                            if (typeof MessagesModule !== 'undefined') {
                                MessagesModule.showToast('Playhead time captured: ' + compTime.toFixed(2) + 's', 'info');
                            }
                        }
                    });
                } else {
                    if (_elements.quickMarkerTime) _elements.quickMarkerTime.value = 2.5;
                }
            });
        }

        // Quick Marker Type Change (adjust placeholder)
        if (_elements.quickMarkerType) {
            _elements.quickMarkerType.addEventListener('change', function () {
                var t = _elements.quickMarkerType.value;
                if (_elements.quickMarkerVal) {
                    if (t === 'time') _elements.quickMarkerVal.placeholder = '00:01:00';
                    else if (t === 'text') _elements.quickMarkerVal.placeholder = 'GOAL!';
                    else if (t === 'delta') _elements.quickMarkerVal.placeholder = '+100';
                    else _elements.quickMarkerVal.placeholder = '1000';
                }
            });
        }

        // Sync Markers from Layer
        if (_elements.btnSyncMarkersFromLayer) {
            _elements.btnSyncMarkersFromLayer.addEventListener('click', function () {
                syncMarkersFromLayer();
            });
        }

        // Write Markers to Layer
        if (_elements.btnWriteMarkersToLayer) {
            _elements.btnWriteMarkersToLayer.addEventListener('click', function () {
                writeMarkersToLayer();
            });
        }

        // Global Playhead Capture
        if (_elements.btnCapturePlayhead) {
            _elements.btnCapturePlayhead.addEventListener('click', function () {
                captureCompPlayhead(null);
            });
        }

        // Preview Controls
        if (_elements.playPreviewBtn) {
            _elements.playPreviewBtn.addEventListener('click', function () {
                startPreview();
            });
        }
        if (_elements.stopPreviewBtn) {
            _elements.stopPreviewBtn.addEventListener('click', function () {
                stopPreview();
            });
        }
        if (_elements.resetPreviewBtn) {
            _elements.resetPreviewBtn.addEventListener('click', function () {
                resetPreview();
            });
        }
        if (_elements.btnPrevMarker) {
            _elements.btnPrevMarker.addEventListener('click', function () {
                jumpToPrevMarker();
            });
        }
        if (_elements.btnNextMarker) {
            _elements.btnNextMarker.addEventListener('click', function () {
                jumpToNextMarker();
            });
        }
        if (_elements.btnEndMarker) {
            _elements.btnEndMarker.addEventListener('click', function () {
                jumpToEndMarker();
            });
        }
        if (_elements.btnToggleLoop) {
            _elements.btnToggleLoop.addEventListener('click', function () {
                toggleLoop();
            });
        }
        document.addEventListener('keydown', _handleNodesKeydown);

        // Quick Toggles
        if (_elements.toggleMonospaceBtn) {
            _elements.toggleMonospaceBtn.addEventListener('click', function () {
                _state.nodes.monospace = !_state.nodes.monospace;
                _elements.toggleMonospaceBtn.classList.toggle('active', _state.nodes.monospace);
                if (_elements.previewNodesVal) {
                    _elements.previewNodesVal.classList.toggle('font-mono', _state.nodes.monospace);
                }
            });
        }

        if (_elements.toggleCommasBtn) {
            _elements.toggleCommasBtn.addEventListener('click', function () {
                _state.nodes.commas = !_state.nodes.commas;
                _elements.toggleCommasBtn.classList.toggle('active', _state.nodes.commas);
                updatePreviewAtTime(0);
            });
        }
    }

    /**
     * Render nodes list view and timeline marker ruler
     */
    function render() {
        if (typeof document === 'undefined') return;
        if (!_elements.nodesContainer || typeof NodesView === 'undefined') return;

        NodesView.renderNodeList(_elements.nodesContainer, _state.nodes.sequence, {
            onUpdateNode: updateNode,
            onDeleteNode: removeNode,
            onCaptureTime: function (nodeId) {
                captureCompPlayhead(nodeId);
            }
        });

        if (_elements.markerRuler && NodesView.renderMarkerRuler) {
            NodesView.renderMarkerRuler(_elements.markerRuler, _state.nodes.sequence, function (nodeId, index) {
                var node = _state.nodes.sequence[index];
                if (node) {
                    stopPreview();
                    updatePreviewAtTime(node.time || 0);
                }
                if (typeof NodesView.highlightActiveNode === 'function') {
                    NodesView.highlightActiveNode(_elements.nodesContainer, index);
                }
                var targetCard = _elements.nodesContainer.querySelector('[data-node-id="' + nodeId + '"]');
                if (targetCard && targetCard.scrollIntoView) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, function (scrubTime) {
                updatePreviewAtTime(scrubTime);
            });
        }

        if (_elements.rulerSub && _state.nodes && _state.nodes.sequence) {
            var seq = _state.nodes.sequence;
            var maxT = seq.length > 0 ? (seq[seq.length - 1].time || 0) : 0;
            _elements.rulerSub.textContent = seq.length + ' Markers • ' + maxT.toFixed(1) + 's Total';
            if (_elements.hudTotalTime) {
                _elements.hudTotalTime.textContent = maxT.toFixed(1) + 's';
            }
        }
    }

    /**
     * Quick add marker at current AE playhead time
     */
    function quickAddMarker() {
        var type = _elements.quickMarkerType ? _elements.quickMarkerType.value : 'number';
        var valStr = _elements.quickMarkerVal ? _elements.quickMarkerVal.value.trim() : '0';
        var hold = _elements.quickMarkerHold ? (parseFloat(_elements.quickMarkerHold.value) || 0) : 0;

        var val = valStr;
        if (type === 'number') {
            try {
                if (/^[0-9+\-*/. ()]+$/.test(valStr)) {
                    var evaluated = Function('"use strict";return (' + valStr + ')')();
                    if (typeof evaluated === 'number' && !isNaN(evaluated)) val = evaluated;
                } else {
                    val = parseFloat(valStr) || 0;
                }
            } catch (e) {
                val = parseFloat(valStr) || 0;
            }
        }

        // Check if an explicit time was entered in input-quick-marker-time
        var explicitTime = _elements.quickMarkerTime ? parseFloat(_elements.quickMarkerTime.value) : NaN;
        if (!isNaN(explicitTime) && explicitTime >= 0) {
            _insertAndSyncMarker({
                type: type,
                value: val,
                time: parseFloat(explicitTime.toFixed(2)),
                hold: hold,
                easing: _state.nodes.easing || 'smoothOut'
            });
            if (_elements.quickMarkerTime) {
                _elements.quickMarkerTime.value = (explicitTime + 2.0).toFixed(1);
            }
            return;
        }

        // Get playhead time from comp
        if (typeof Bridge !== 'undefined' && Bridge.getCompPlayheadTime) {
            Bridge.getCompPlayheadTime(function (err, compTime) {
                var t = (!err && typeof compTime === 'number') ? parseFloat(compTime.toFixed(2)) : 0;
                _insertAndSyncMarker({
                    type: type,
                    value: val,
                    time: t,
                    hold: hold,
                    easing: _state.nodes.easing || 'smoothOut'
                });
                if (_elements.quickMarkerTime) {
                    _elements.quickMarkerTime.value = (t + 2.0).toFixed(1);
                }
            });
        } else {
            // Browser mock mode
            var seq = _state.nodes.sequence;
            var mockTime = seq.length > 0 ? (parseFloat(seq[seq.length - 1].time) || 0) + 2 : 0;
            _insertAndSyncMarker({
                type: type,
                value: val,
                time: mockTime,
                hold: hold,
                easing: 'smoothOut'
            });
            if (_elements.quickMarkerTime) {
                _elements.quickMarkerTime.value = (mockTime + 2.0).toFixed(1);
            }
        }
    }

    /**
     * Insert marker into sequence and optionally sync with AE layer
     * @private
     */
    function _insertAndSyncMarker(nodeData) {
        var newNode = (typeof NodeSequence !== 'undefined')
            ? NodeSequence.createNode(nodeData)
            : nodeData;

        // If a layer is linked in AE, add marker immediately onto AE layer
        var linkedInfo = (typeof ModeModule !== 'undefined') ? ModeModule.getLinkedLayerInfo() : null;
        if (linkedInfo && typeof Bridge !== 'undefined' && Bridge.addNodeMarker) {
            Bridge.addNodeMarker(linkedInfo, newNode, newNode.time, function (err, result) {
                if (!err) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast('Marker #' + newNode.id + ' placed on layer at ' + newNode.time + 's', 'success');
                    }
                }
            });
        }

        _state.nodes.sequence.push(newNode);
        _state.nodes.sequence = (typeof NodeSequence !== 'undefined')
            ? NodeSequence.sortNodes(_state.nodes.sequence)
            : _state.nodes.sequence;

        render();
        updatePreviewAtTime(newNode.time);

        if (typeof MessagesModule !== 'undefined') {
            MessagesModule.showToast('Marker added at ' + newNode.time + 's', 'success');
        }
    }

    /**
     * Sync and read all markers directly from the active AE layer
     */
    function syncMarkersFromLayer() {
        var linkedInfo = (typeof ModeModule !== 'undefined') ? ModeModule.getLinkedLayerInfo() : null;
        if (!linkedInfo) {
            if (typeof MessagesModule !== 'undefined') {
                MessagesModule.showToast('Please select a NOMRO sequence layer first', 'warning');
            }
            return;
        }

        if (typeof Bridge !== 'undefined' && Bridge.syncNodeMarkers) {
            Bridge.syncNodeMarkers(linkedInfo, function (err, markers) {
                if (err || !markers || markers.length === 0) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast('No markers found on selected layer', 'warning');
                    }
                    return;
                }

                var reconstructed = [];
                for (var m = 0; m < markers.length; m++) {
                    var mk = markers[m];
                    var node = (typeof NodeSequence !== 'undefined')
                        ? NodeSequence.fromMarkerComment(mk.comment, mk.time)
                        : { type: 'number', value: mk.comment, time: mk.time, hold: 0 };
                    if (mk.duration && parseFloat(mk.duration) > 0) {
                        node.hold = parseFloat(mk.duration);
                    }
                    reconstructed.push(node);
                }

                if (reconstructed.length >= 2) {
                    _state.nodes.sequence = (typeof NodeSequence !== 'undefined')
                        ? NodeSequence.sortNodes(reconstructed)
                        : reconstructed;
                    render();
                    resetPreview();
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast('Synced ' + reconstructed.length + ' markers from layer!', 'success');
                    }
                }
            });
        }
    }

    /**
     * Write/re-bake all UI markers to the active AE layer
     */
    function writeMarkersToLayer() {
        var linkedInfo = (typeof ModeModule !== 'undefined') ? ModeModule.getLinkedLayerInfo() : null;
        if (!linkedInfo) {
            if (typeof MessagesModule !== 'undefined') {
                MessagesModule.showToast('Please select or create a sequence layer first', 'warning');
            }
            return;
        }

        if (typeof Bridge !== 'undefined' && Bridge.updateLayer) {
            Bridge.updateLayer(linkedInfo, getSettings(), function (err, result) {
                if (err) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast('Error writing markers to layer', 'error');
                    }
                } else {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast('All markers updated on layer!', 'success');
                    }
                }
            });
        }
    }

    /**
     * Add new node to sequence
     * @param {Object} [options]
     */
    function addNode(options) {
        options = options || {};
        var seq = _state.nodes.sequence;
        var lastNode = seq.length > 0 ? seq[seq.length - 1] : null;

        var nextTime = lastNode ? (parseFloat(lastNode.time) || 0) + 2 : 0;
        var nextVal = 1000;
        var nextType = 'number';

        if (lastNode) {
            nextType = lastNode.type || 'number';
            if (nextType === 'number') {
                nextVal = (parseFloat(lastNode.value) || 0) + 500;
            } else if (nextType === 'time') {
                nextVal = '00:02:00';
            } else if (nextType === 'text') {
                nextVal = 'FINISH';
            } else if (nextType === 'delta') {
                nextVal = '+250';
            }
        }

        var newNode = (typeof NodeSequence !== 'undefined')
            ? NodeSequence.createNode({
                type: options.type || nextType,
                value: options.value !== undefined ? options.value : nextVal,
                time: options.time !== undefined ? options.time : nextTime,
                hold: options.hold !== undefined ? options.hold : 0,
                easing: options.easing || _state.nodes.easing || 'smoothOut'
            })
            : {
                id: 'node_' + Date.now(),
                type: nextType,
                value: nextVal,
                time: nextTime,
                hold: 0,
                easing: 'smoothOut'
            };

        seq.push(newNode);
        _state.nodes.sequence = (typeof NodeSequence !== 'undefined')
            ? NodeSequence.sortNodes(seq)
            : seq;

        render();
        updatePreviewAtTime(0);

        if (typeof MessagesModule !== 'undefined') {
            MessagesModule.showToast('Node added at ' + newNode.time + 's', 'info');
        }
    }

    /**
     * Remove node by id
     * @param {string} nodeId
     */
    function removeNode(nodeId) {
        var seq = _state.nodes.sequence;
        if (seq.length <= 2) {
            if (typeof MessagesModule !== 'undefined') {
                MessagesModule.showToast('Sequence must have at least 2 nodes', 'warning');
            }
            return;
        }

        _state.nodes.sequence = seq.filter(function (n) { return n.id !== nodeId; });
        render();
        updatePreviewAtTime(0);
    }

    /**
     * Update node property
     * @param {string} nodeId
     * @param {Object} changes
     */
    function updateNode(nodeId, changes) {
        var seq = _state.nodes.sequence;
        for (var i = 0; i < seq.length; i++) {
            if (seq[i].id === nodeId) {
                for (var key in changes) {
                    seq[i][key] = changes[key];
                }
                break;
            }
        }

        // If time changed, re-sort chronologically
        if (changes.time !== undefined && typeof NodeSequence !== 'undefined') {
            _state.nodes.sequence = NodeSequence.sortNodes(seq);
        }

        render();
        updatePreviewAtTime(0);
    }

    /**
     * Capture playhead time from After Effects composition
     * @param {string|null} targetNodeId
     */
    function captureCompPlayhead(targetNodeId) {
        if (typeof Bridge !== 'undefined' && Bridge.evalScript) {
            Bridge.evalScript('NOMRO.utils.getCompPlayheadTime ? NOMRO.utils.getCompPlayheadTime() : (app.project.activeItem ? app.project.activeItem.time : 0)', function (err, result) {
                var compTime = 0;
                if (!err && result && !isNaN(parseFloat(result))) {
                    compTime = Math.max(0, parseFloat(parseFloat(result).toFixed(2)));
                }

                if (targetNodeId) {
                    updateNode(targetNodeId, { time: compTime });
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast('Captured Playhead: ' + compTime + 's', 'success');
                    }
                } else {
                    addNode({ time: compTime });
                }
            });
        } else {
            // Mock browser mode
            var mockTime = 3.5;
            if (targetNodeId) {
                updateNode(targetNodeId, { time: mockTime });
            } else {
                addNode({ time: mockTime });
            }
            if (typeof MessagesModule !== 'undefined') {
                MessagesModule.showToast('Browser Mode: Set to ' + mockTime + 's', 'info');
            }
        }
    }

    /**
     * Convert timecode HH:MM:SS to seconds
     * @private
     */
    function _timeToSeconds(str) {
        if (typeof str === 'number') return str;
        var parts = String(str || '0').split(':');
        var s = 0;
        if (parts.length === 3) {
            s = (parseFloat(parts[0]) || 0) * 3600 + (parseFloat(parts[1]) || 0) * 60 + (parseFloat(parts[2]) || 0);
        } else if (parts.length === 2) {
            s = (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
        } else {
            s = parseFloat(parts[0]) || 0;
        }
        return s;
    }

    /**
     * Format number with commas
     * @private
     */
    function _formatNumber(val) {
        var num = parseFloat(val) || 0;
        var fixed = _state.nodes.decimals ? num.toFixed(2) : Math.round(num).toString();
        if (_state.nodes.commas) {
            var parts = fixed.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            fixed = parts.join('.');
        }
        var pre = _state.nodes.prefix || '';
        var suf = _state.nodes.suffix || '';
        return pre + fixed + suf;
    }

    /**
     * Evaluate parametric easing for preview
     * @private
     */
    function _evaluateEase(t, curveId) {
        t = Math.max(0, Math.min(1, t));
        curveId = curveId || 'smoothOut';

        if (curveId === 'linear') return t;
        if (curveId === 'snappyOut') return 1 - Math.pow(1 - t, 4);
        if (curveId === 'dramaticOut') return 1 - Math.pow(1 - t, 6);
        if (curveId === 'bounceOut') {
            var n1 = 7.5625, d1 = 2.75;
            if (t < (1 / d1)) return n1 * t * t;
            if (t < (2 / d1)) return n1 * (t -= (1.5 / d1)) * t + 0.75;
            if (t < (2.5 / d1)) return n1 * (t -= (2.25 / d1)) * t + 0.9375;
            return n1 * (t -= (2.625 / d1)) * t + 0.984375;
        }
        if (curveId === 'elasticOut') {
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
        }
        // Default: smoothOut (cubic)
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Calculate and format output value at arbitrary time t
     * @param {number} t - Time in seconds
     * @returns {Object} { display: string, activeIndex: number, progress: number }
     */
    function calculateOutputAtTime(t) {
        var seq = _state.nodes.sequence;
        if (!seq || seq.length === 0) {
            return { display: '0', activeIndex: 0, progress: 0 };
        }

        var first = seq[0];
        var last = seq[seq.length - 1];

        // Before first node
        if (t <= (first.time || 0)) {
            var val0 = first.type === 'number' ? _formatNumber(first.value) : String(first.value);
            return { display: val0, activeIndex: 0, progress: 0 };
        }

        // After last node
        if (t >= (last.time || 0)) {
            var valEnd = last.type === 'number' ? _formatNumber(last.value) : String(last.value);
            return { display: valEnd, activeIndex: seq.length - 1, progress: 1 };
        }

        // Find active segment between node i and i+1
        for (var i = 0; i < seq.length - 1; i++) {
            var n1 = seq[i];
            var n2 = seq[i + 1];
            var t1 = n1.time || 0;
            var t2 = n2.time || 0;

            if (t >= t1 && t < t2) {
                var totalDur = Math.max(0.001, t2 - t1);
                var holdDur = Math.min(totalDur, n1.hold || 0);
                var elapsed = t - t1;

                // Inside hold period
                if (elapsed < holdDur) {
                    var hVal = n1.type === 'number' ? _formatNumber(n1.value) : String(n1.value);
                    return { display: hVal, activeIndex: i, progress: t / Math.max(0.001, last.time) };
                }

                // Active interpolation
                var activeElapsed = elapsed - holdDur;
                var activeDur = Math.max(0.001, totalDur - holdDur);
                var normT = Math.min(1, activeElapsed / activeDur);
                var easedT = _evaluateEase(normT, n1.easing || 'smoothOut');

                var displayStr = '';

                // Multi-Type Interpolation
                if (n1.type === 'number' && n2.type === 'number') {
                    var v1 = parseFloat(n1.value) || 0;
                    var v2 = parseFloat(n2.value) || 0;
                    displayStr = _formatNumber(v1 + (v2 - v1) * easedT);

                } else if (n1.type === 'time' && n2.type === 'time') {
                    var s1 = _timeToSeconds(n1.value);
                    var s2 = _timeToSeconds(n2.value);
                    var curS = s1 + (s2 - s1) * easedT;
                    displayStr = NodesView.formatTime(curS);

                } else if (n1.type === 'time' && n2.type === 'number') {
                    var ts1 = _timeToSeconds(n1.value);
                    var nv2 = parseFloat(n2.value) || 0;
                    displayStr = _formatNumber(ts1 + (nv2 - ts1) * easedT);

                } else if (n1.type === 'number' && n2.type === 'time') {
                    var nv1 = parseFloat(n1.value) || 0;
                    var ts2 = _timeToSeconds(n2.value);
                    displayStr = NodesView.formatTime(nv1 + (ts2 - nv1) * easedT);

                } else if (n2.type === 'delta') {
                    var baseNum = (n1.type === 'number') ? (parseFloat(n1.value) || 0) : 0;
                    var deltaStr = String(n2.value).trim();
                    var deltaVal = 0;
                    if (deltaStr.indexOf('%') !== -1) {
                        var pct = parseFloat(deltaStr.replace('%', '')) || 0;
                        deltaVal = baseNum * (pct / 100);
                    } else {
                        deltaVal = parseFloat(deltaStr) || 0;
                    }
                    var targetNum = baseNum + deltaVal;
                    displayStr = _formatNumber(baseNum + (targetNum - baseNum) * easedT);

                } else {
                    // Text step switch at midpoint
                    displayStr = (easedT >= 0.5) ? String(n2.value) : String(n1.value);
                }

                var totalProgress = (t - (first.time || 0)) / Math.max(0.001, (last.time || 0) - (first.time || 0));
                return {
                    display: displayStr,
                    activeIndex: i,
                    progress: Math.min(1, Math.max(0, totalProgress))
                };
            }
        }

        return { display: '0', activeIndex: 0, progress: 0 };
    }

    /**
     * Update preview display at time t
     * @param {number} t - Time in seconds
     */
    function updatePreviewAtTime(t) {
        _currentPreviewTime = t;
        var res = calculateOutputAtTime(t);

        if (_elements.previewNodesVal) {
            _elements.previewNodesVal.textContent = res.display;
        }

        if (_elements.previewNodesProgress) {
            _elements.previewNodesProgress.style.width = (res.progress * 100).toFixed(1) + '%';
        }

        if (_elements.previewNodesStage) {
            var seq = _state.nodes.sequence;
            var total = seq.length;
            var cur = res.activeIndex + 1;
            _elements.previewNodesStage.textContent = 'Node ' + cur + ' of ' + total + ' (' + t.toFixed(1) + 's)';
        }

        if (typeof NodesView !== 'undefined' && _elements.nodesContainer) {
            NodesView.highlightActiveNode(_elements.nodesContainer, res.activeIndex);
        }

        // Smoothly position timeline ruler playhead needle
        var needle = _elements.markerRuler ? _elements.markerRuler.querySelector('.ruler-playhead') : null;
        var seqList = _state.nodes.sequence;
        var maxT = (seqList && seqList.length > 0) ? Math.max(0.001, seqList[seqList.length - 1].time || 0) : 1;

        if (needle) {
            var normPct = Math.min(100, Math.max(0, (t / maxT) * 100));
            needle.style.left = normPct.toFixed(2) + '%';
        }

        // Update HUD live timecode readouts
        if (_elements.hudCurrentTime) {
            _elements.hudCurrentTime.textContent = t.toFixed(1) + 's';
        }
        if (_elements.hudTotalTime) {
            _elements.hudTotalTime.textContent = maxT.toFixed(1) + 's';
        }
    }

    /**
     * Start live preview animation loop
     */
    function startPreview() {
        if (_isPlayingPreview) return;
        _isPlayingPreview = true;

        if (_elements.playPreviewBtn) _elements.playPreviewBtn.style.display = 'none';
        if (_elements.stopPreviewBtn) _elements.stopPreviewBtn.style.display = 'inline-flex';
        if (_elements.transportStatus) {
            _elements.transportStatus.textContent = 'PLAYING';
            _elements.transportStatus.classList.add('playing');
        }

        var seq = _state.nodes.sequence;
        if (!seq || seq.length === 0) return;

        var startTime = seq[0].time || 0;
        var endTime = seq[seq.length - 1].time || 2;
        var totalDuration = Math.max(0.5, endTime - startTime);

        _previewStartTime = performance.now();

        function _tick(now) {
            if (!_isPlayingPreview) return;
            var elapsedSec = (now - _previewStartTime) / 1000;

            if (_isLooping) {
                var loopDuration = totalDuration + 0.8;
                var modTime = elapsedSec % loopDuration;
                var currentT = startTime + Math.min(modTime, totalDuration);
                updatePreviewAtTime(currentT);
            } else {
                if (elapsedSec >= totalDuration) {
                    updatePreviewAtTime(endTime);
                    stopPreview();
                    return;
                }
                updatePreviewAtTime(startTime + elapsedSec);
            }

            _previewAnimId = requestAnimationFrame(_tick);
        }

        _previewAnimId = requestAnimationFrame(_tick);
    }

    /**
     * Stop live preview animation
     */
    function stopPreview() {
        _isPlayingPreview = false;
        if (_previewAnimId) {
            cancelAnimationFrame(_previewAnimId);
            _previewAnimId = null;
        }

        if (_elements.playPreviewBtn) _elements.playPreviewBtn.style.display = 'inline-flex';
        if (_elements.stopPreviewBtn) _elements.stopPreviewBtn.style.display = 'none';
        if (_elements.transportStatus) {
            _elements.transportStatus.textContent = 'PAUSED';
            _elements.transportStatus.classList.remove('playing');
        }
    }

    /**
     * Reset preview to start
     */
    function resetPreview() {
        stopPreview();
        if (_elements.transportStatus) {
            _elements.transportStatus.textContent = 'READY';
            _elements.transportStatus.classList.remove('playing');
        }
        var seq = _state.nodes.sequence;
        var startT = (seq && seq.length > 0) ? (seq[0].time || 0) : 0;
        updatePreviewAtTime(startT);
    }

    /**
     * Jump playhead to previous timeline marker (AE 'J' shortcut behavior)
     */
    function jumpToPrevMarker() {
        var seq = _state.nodes.sequence;
        if (!seq || seq.length === 0) return;
        stopPreview();

        var prevNode = null;
        var prevIdx = 0;
        for (var i = seq.length - 1; i >= 0; i--) {
            var t = seq[i].time || 0;
            if (t < _currentPreviewTime - 0.05) {
                prevNode = seq[i];
                prevIdx = i;
                break;
            }
        }
        if (!prevNode) {
            prevNode = seq[0];
            prevIdx = 0;
        }

        updatePreviewAtTime(prevNode.time || 0);
        if (typeof NodesView !== 'undefined' && _elements.nodesContainer) {
            NodesView.highlightActiveNode(_elements.nodesContainer, prevIdx);
        }
        var targetCard = _elements.nodesContainer ? _elements.nodesContainer.querySelector('[data-node-id="' + prevNode.id + '"]') : null;
        if (targetCard && targetCard.scrollIntoView) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Jump playhead to next timeline marker (AE 'K' shortcut behavior)
     */
    function jumpToNextMarker() {
        var seq = _state.nodes.sequence;
        if (!seq || seq.length === 0) return;
        stopPreview();

        var nextNode = null;
        var nextIdx = seq.length - 1;
        for (var i = 0; i < seq.length; i++) {
            var t = seq[i].time || 0;
            if (t > _currentPreviewTime + 0.05) {
                nextNode = seq[i];
                nextIdx = i;
                break;
            }
        }
        if (!nextNode) {
            nextNode = seq[seq.length - 1];
            nextIdx = seq.length - 1;
        }

        updatePreviewAtTime(nextNode.time || 0);
        if (typeof NodesView !== 'undefined' && _elements.nodesContainer) {
            NodesView.highlightActiveNode(_elements.nodesContainer, nextIdx);
        }
        var targetCard = _elements.nodesContainer ? _elements.nodesContainer.querySelector('[data-node-id="' + nextNode.id + '"]') : null;
        if (targetCard && targetCard.scrollIntoView) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Jump playhead to last timeline marker (AE 'End' behavior)
     */
    function jumpToEndMarker() {
        var seq = _state.nodes.sequence;
        if (!seq || seq.length === 0) return;
        stopPreview();

        var lastIdx = seq.length - 1;
        var lastNode = seq[lastIdx];
        updatePreviewAtTime(lastNode.time || 0);
        if (typeof NodesView !== 'undefined' && _elements.nodesContainer) {
            NodesView.highlightActiveNode(_elements.nodesContainer, lastIdx);
        }
        var targetCard = _elements.nodesContainer ? _elements.nodesContainer.querySelector('[data-node-id="' + lastNode.id + '"]') : null;
        if (targetCard && targetCard.scrollIntoView) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Toggle preview loop mode
     */
    function toggleLoop() {
        _isLooping = !_isLooping;
        if (_elements.btnToggleLoop) {
            _elements.btnToggleLoop.classList.toggle('active', _isLooping);
        }
        if (typeof MessagesModule !== 'undefined') {
            MessagesModule.showToast(_isLooping ? 'Preview Loop: ON' : 'Preview Loop: OFF', 'info');
        }
    }

    /**
     * Scoped keyboard shortcuts for Markers tab (J, K, Home, End)
     * @private
     */
    function _handleNodesKeydown(e) {
        var tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        var panel = document.getElementById('panel-nodes');
        if (!panel || !panel.classList.contains('active')) return;

        if (e.key === 'j' || e.key === 'J') {
            e.preventDefault();
            jumpToPrevMarker();
        } else if (e.key === 'k' || e.key === 'K') {
            e.preventDefault();
            jumpToNextMarker();
        } else if (e.key === 'Home') {
            e.preventDefault();
            resetPreview();
        } else if (e.key === 'End') {
            e.preventDefault();
            jumpToEndMarker();
        }
    }

    /**
     * Return complete settings payload for layer creation or updating
     * @returns {Object}
     */
    function getSettings() {
        return {
            counterType: 'nodes',
            nodes: _state.nodes.sequence || [],
            easing: _state.nodes.easing || 'smoothOut',
            easeStrength: _state.nodes.easeStrength !== undefined ? _state.nodes.easeStrength : 75,
            format: _state.nodes.format || 'normal',
            monospace: !!_state.nodes.monospace,
            commas: _state.nodes.commas !== false,
            decimals: !!_state.nodes.decimals,
            prefix: _state.nodes.prefix || '',
            suffix: _state.nodes.suffix || ''
        };
    }

    /**
     * Apply settings loaded from After Effects or preset
     * @param {Object} settings
     */
    function applySettings(settings) {
        if (!settings) return;

        if (settings.nodes && Array.isArray(settings.nodes)) {
            _state.nodes.sequence = (typeof NodeSequence !== 'undefined')
                ? NodeSequence.sanitizeSequence(settings.nodes)
                : settings.nodes;
        } else if (settings.markers && Array.isArray(settings.markers) && typeof NodeSequence !== 'undefined') {
            // Reconstruct nodes from layer markers!
            var reconstructed = [];
            for (var m = 0; m < settings.markers.length; m++) {
                var mk = settings.markers[m];
                reconstructed.push(NodeSequence.fromMarkerComment(mk.comment, mk.time));
            }
            if (reconstructed.length >= 2) {
                _state.nodes.sequence = NodeSequence.sortNodes(reconstructed);
            }
        }

        if (settings.easing) _state.nodes.easing = settings.easing;
        if (settings.easeStrength !== undefined) _state.nodes.easeStrength = settings.easeStrength;
        if (settings.monospace !== undefined) _state.nodes.monospace = !!settings.monospace;
        if (settings.commas !== undefined) _state.nodes.commas = !!settings.commas;
        if (settings.decimals !== undefined) _state.nodes.decimals = !!settings.decimals;
        if (settings.prefix !== undefined) _state.nodes.prefix = settings.prefix;
        if (settings.suffix !== undefined) _state.nodes.suffix = settings.suffix;

        if (_elements.toggleMonospaceBtn) {
            _elements.toggleMonospaceBtn.classList.toggle('active', _state.nodes.monospace);
        }
        if (_elements.toggleCommasBtn) {
            _elements.toggleCommasBtn.classList.toggle('active', _state.nodes.commas);
        }

        render();
        resetPreview();
    }

    return {
        init: init,
        render: render,
        addNode: addNode,
        quickAddMarker: quickAddMarker,
        syncMarkersFromLayer: syncMarkersFromLayer,
        writeMarkersToLayer: writeMarkersToLayer,
        removeNode: removeNode,
        updateNode: updateNode,
        captureCompPlayhead: captureCompPlayhead,
        calculateOutputAtTime: calculateOutputAtTime,
        updatePreviewAtTime: updatePreviewAtTime,
        startPreview: startPreview,
        stopPreview: stopPreview,
        resetPreview: resetPreview,
        getSettings: getSettings,
        applySettings: applySettings
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodesModule;
}
