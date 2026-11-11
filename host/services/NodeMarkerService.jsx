/**
 * NOMRO - Node Marker Service
 * Handles specialized After Effects marker operations for Multi-Node Sequences
 * Provides color labeling, hold durations, and playhead marker injection
 * @module services/NodeMarkerService
 */

NOMRO.markers = NOMRO.markers || {};

/**
 * Get color label index for After Effects marker by node type
 * 8: Blue, 9: Green, 10: Purple, 11: Orange
 * @param {string} type
 * @returns {number}
 */
NOMRO.markers.getMarkerLabelForType = function (type) {
    if (type === 'time') return 9;       // Green
    if (type === 'text') return 10;      // Purple
    if (type === 'delta') return 11;     // Orange
    return 8;                            // Blue (Number)
};

/**
 * Format marker payload string
 * @param {Object} node
 * @returns {string}
 */
NOMRO.markers.buildMarkerPayload = function (node) {
    if (!node) return 'NUM:0';
    var type = node.type || 'number';
    var val = String(node.value !== undefined ? node.value : 0).replace(/^\s+|\s+$/g, '');
    var hold = (node.hold && parseFloat(node.hold) > 0) ? '|H:' + parseFloat(node.hold) : '';
    var ease = (node.easing && node.easing !== 'smoothOut') ? '|E:' + node.easing : '';

    if (type === 'time') {
        return 'TIME:' + val + hold + ease;
    } else if (type === 'text') {
        return 'TXT:' + val + hold + ease;
    } else if (type === 'delta') {
        return 'DELTA:' + val + hold + ease;
    } else {
        return 'NUM:' + val + hold + ease;
    }
};

/**
 * Write/replace all node markers on layer
 * @param {TextLayer} layer
 * @param {Array} nodes
 */
NOMRO.markers.writeNodeMarkers = function (layer, nodes) {
    if (!layer) return;
    nodes = nodes || [];

    var markers = layer.property('Marker');
    // Clear existing markers safely from last to first
    var numKeys = markers.numKeys;
    for (var k = numKeys; k >= 1; k--) {
        markers.removeKey(k);
    }

    var startTime = layer.inPoint;

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var mTime = startTime + (parseFloat(node.time) || 0);
        var payload = NOMRO.markers.buildMarkerPayload(node);
        var markerVal = new MarkerValue(payload);
        markerVal.comment = payload;
        try {
            if (node.hold && parseFloat(node.hold) > 0) {
                markerVal.duration = parseFloat(node.hold);
            }
        } catch (eDur) { }
        try {
            markerVal.label = NOMRO.markers.getMarkerLabelForType(node.type);
        } catch (eLab) { }
        markers.setValueAtTime(mTime, markerVal);
    }
};

/**
 * Add a single node marker to active layer at playhead or specified time
 * @param {CompItem} comp
 * @param {TextLayer} layer
 * @param {Object} nodeData
 * @param {number} [targetTime] - Relative time from layer inPoint (or null to use CTI)
 * @returns {Object} Added node info
 */
NOMRO.markers.addNodeMarker = function (comp, layer, nodeData, targetTime) {
    nodeData = nodeData || {};
    var markers = layer.property('Marker');
    var inPoint = layer.inPoint;

    var absTime = (targetTime !== undefined && targetTime !== null)
        ? inPoint + parseFloat(targetTime)
        : comp.time;

    // Ensure within comp duration
    absTime = Math.max(inPoint, Math.min(comp.duration, absTime));
    var relTime = Math.max(0, absTime - inPoint);
    nodeData.time = parseFloat(relTime.toFixed(2));

    var payload = NOMRO.markers.buildMarkerPayload(nodeData);
    var markerVal = new MarkerValue(payload);
    markerVal.comment = payload;
    try {
        if (nodeData.hold && parseFloat(nodeData.hold) > 0) {
            markerVal.duration = parseFloat(nodeData.hold);
        }
    } catch (eDur) { }
    try {
        markerVal.label = NOMRO.markers.getMarkerLabelForType(nodeData.type);
    } catch (eLab) { }

    markers.setValueAtTime(absTime, markerVal);

    return nodeData;
};

/**
 * Read all node markers from layer
 * @param {TextLayer} layer
 * @returns {Array} List of node marker objects
 */
NOMRO.markers.readNodeMarkers = function (layer) {
    var markersList = [];
    try {
        var markers = layer.property('Marker');
        var inPoint = layer.inPoint;
        if (markers.numKeys > 0) {
            for (var m = 1; m <= markers.numKeys; m++) {
                var kTime = markers.keyTime(m);
                var kVal = markers.keyValue(m);
                markersList.push({
                    time: parseFloat((kTime - inPoint).toFixed(2)),
                    absTime: kTime,
                    comment: kVal.comment || '',
                    duration: kVal.duration || 0,
                    label: kVal.label || 0
                });
            }
        }
    } catch (e) {
        NOMRO.helpers.logError('Read Node Markers', e);
    }
    return markersList;
};

/**
 * Apply milestone markers across any NOMRO layer type (Counter, Timer, etc.)
 * Supports milestone percentages (0%, 50%, 100%) and cue markers
 * @param {Layer} layer - Target layer
 * @param {Object} settings - Layer configuration settings
 */
NOMRO.markers.applyMilestoneMarkers = function (layer, settings) {
    if (!layer || !settings) return;
    if (!settings.layerMarkers && !settings.milestones) return;

    var markers = layer.property('Marker');
    if (!markers) return;

    var inTime = layer.inPoint;
    var duration = parseFloat(settings.duration) || 2;
    var outTime = inTime + duration;
    var type = settings.counterType || 'counter';

    try {
        if (type === 'counter' || type === 'basic') {
            // Milestone markers at 0%, 50%, 100%
            var m0 = new MarkerValue('START: ' + (settings.start !== undefined ? settings.start : 0));
            m0.comment = 'START: ' + (settings.start !== undefined ? settings.start : 0);
            try { m0.label = 8; } catch (e0) { } // Blue
            markers.setValueAtTime(inTime, m0);

            var midTime = inTime + (duration * 0.5);
            var midVal = Math.round(((parseFloat(settings.start) || 0) + (parseFloat(settings.end) || 100)) / 2);
            var mMid = new MarkerValue('50%: ' + midVal);
            mMid.comment = '50%: ' + midVal;
            try { mMid.label = 11; } catch (eMid) { } // Orange
            markers.setValueAtTime(midTime, mMid);

            var mEnd = new MarkerValue('END: ' + (settings.end !== undefined ? settings.end : 100));
            mEnd.comment = 'END: ' + (settings.end !== undefined ? settings.end : 100);
            try { mEnd.label = 9; } catch (eEnd) { } // Green
            markers.setValueAtTime(outTime, mEnd);
        } else if (type === 'timer' || type === 'countdown') {
            // Timer Split cues: START, HALF-WAY, COMPLETE
            var tStart = new MarkerValue('START: ' + (settings.format || 'hms').toUpperCase());
            tStart.comment = 'START: ' + (settings.format || 'hms').toUpperCase();
            try { tStart.label = 8; } catch (et0) { }
            markers.setValueAtTime(inTime, tStart);

            if (duration >= 3) {
                var tMidTime = inTime + (duration * 0.5);
                var tMid = new MarkerValue('HALF-WAY');
                tMid.comment = 'HALF-WAY';
                try { tMid.label = 11; } catch (etMid) { }
                markers.setValueAtTime(tMidTime, tMid);
            }

            var tEnd = new MarkerValue('COMPLETE');
            tEnd.comment = 'COMPLETE';
            try { tEnd.label = 9; } catch (etEnd) { }
            markers.setValueAtTime(outTime, tEnd);
        }
    } catch (eMilestone) {
        if (NOMRO.helpers && NOMRO.helpers.logError) {
            NOMRO.helpers.logError('Apply Milestone Markers', eMilestone);
        }
    }
};

