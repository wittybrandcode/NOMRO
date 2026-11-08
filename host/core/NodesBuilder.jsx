/**
 * NOMRO - Multi-Node Sequence Builder
 * Creates text layers driven by multi-waypoint node markers with embedded controls
 * @module core/NodesBuilder
 */

NOMRO.core = NOMRO.core || {};

/**
 * Format marker payload string
 * @private
 */
function _buildMarkerPayload(node) {
    if (!node) return 'NUM:0';
    var type = node.type || 'number';
    var val = String(node.value !== undefined ? node.value : 0).replace(/^\s+|\s+$/g, '');
    var hold = (node.hold && node.hold > 0) ? '|H:' + parseFloat(node.hold) : '';
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
}

/**
 * Build Multi-Node Sequence layer in composition
 * @param {CompItem} comp - Target composition
 * @param {Object} settings - Node sequence settings
 * @returns {TextLayer}
 */
NOMRO.core.buildNodesSequence = function (comp, settings) {
    app.beginUndoGroup('NOMRO Create Node Sequence');

    try {
        settings = settings || {};
        var nodes = settings.nodes || [
            { type: 'number', value: 0, time: 0, hold: 0 },
            { type: 'number', value: 500, time: 2, hold: 0.5 },
            { type: 'number', value: 1000, time: 4, hold: 0 }
        ];

        // 1. Create Text Layer
        var textLayer = comp.layers.addText('0');
        textLayer.name = 'NOMRO_Marker_Counter';
        textLayer.label = 13; // Lavender/Purple distinct layer color

        // 2. Add Controls
        NOMRO.core.addSlider(textLayer, 'NOMRO_Ease', settings.easeStrength !== undefined ? settings.easeStrength : 75);

        // 3. Clear existing markers and add node markers with visual colors and hold durations
        if (NOMRO.markers && NOMRO.markers.writeNodeMarkers) {
            NOMRO.markers.writeNodeMarkers(textLayer, nodes);
        } else {
            var markers = textLayer.property('Marker');
            var startTime = textLayer.inPoint;

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var mTime = startTime + (parseFloat(node.time) || 0);
                var payload = _buildMarkerPayload(node);
                var markerVal = new MarkerValue(payload);
                markerVal.comment = payload;
                if (node.hold && parseFloat(node.hold) > 0) {
                    markerVal.duration = parseFloat(node.hold);
                }
                markers.setValueAtTime(mTime, markerVal);
            }
        }

        // 4. Apply Expression
        var sourceText = textLayer.property('ADBE Text Properties').property('ADBE Text Document');
        var expression = (NOMRO.expressions && NOMRO.expressions.generateNodesExpression)
            ? NOMRO.expressions.generateNodesExpression(settings)
            : 'value';
        sourceText.expression = expression;
        sourceText.expressionEnabled = true;

        // 5. Center Text & Font Styling
        try {
            var textDoc = sourceText.value;
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            if (settings.monospace) {
                textDoc.font = "CourierNewPSMT";
            }
            sourceText.setValue(textDoc);
        } catch (e) { }

        var textRect = textLayer.sourceRectAtTime(0, false);
        var anchorX = textRect.left + textRect.width / 2;
        var anchorY = textRect.top + textRect.height / 2;
        textLayer.property('Anchor Point').setValue([anchorX, anchorY]);
        textLayer.property('Position').setValue([comp.width / 2, comp.height / 2]);

        // 6. Save Metadata Comment
        try {
            settings.layerName = textLayer.name;
            textLayer.comment = JSON.stringify(settings);
        } catch (e) { }

        app.endUndoGroup();
        return textLayer;

    } catch (e) {
        app.endUndoGroup();
        throw e;
    }
};

