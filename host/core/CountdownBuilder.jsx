/**
 * NOMRO - Countdown Builder (Embedded Controls)
 * Timer/Countdown with controls directly on Text Layer
 * Supports multiple duration modes including markers
 * @module core/CountdownBuilder
 */

NOMRO.core = NOMRO.core || {};

/**
 * Create countdown counter with embedded controls
 * Start -> End over Duration in timeline
 * @param {CompItem} comp - Target composition
 * @param {Object} settings - Countdown settings
 * @returns {TextLayer} Text layer with embedded controls
 */
NOMRO.core.buildCountdown = function (comp, settings) {
    app.beginUndoGroup('NOMRO Create Countdown');

    try {
        var startValue = (settings.start !== undefined) ? settings.start : 60;
        var endValue = (settings.end !== undefined) ? settings.end : 0;
        var duration = (settings.duration !== undefined) ? settings.duration : 10;
        var durationMode = settings.durationMode || 'manual'; // manual, auto, realtime, markers
        var displayFormat = settings.format || 'hms';
        var startAt = (settings.startAt !== undefined) ? settings.startAt : 0;

        // For realtime mode, duration = absolute difference between start and end
        if (durationMode === 'realtime') {
            duration = Math.abs(startValue - endValue);
        }

        // ========================================
        // CREATE TEXT LAYER WITH EMBEDDED CONTROLS
        // ========================================
        var textLayer = comp.layers.addText('00:00:00');
        textLayer.name = 'NOMRO_Countdown';
        textLayer.label = 11; // Aqua
        textLayer.startTime = startAt;

        // ========================================
        // ADD CONTROLS DIRECTLY TO TEXT LAYER
        // ========================================

        // Core sliders
        NOMRO.core.addSlider(textLayer, 'NOMRO_Start', startValue);
        NOMRO.core.addSlider(textLayer, 'NOMRO_End', endValue);
        NOMRO.core.addSlider(textLayer, 'NOMRO_Duration', duration);

        // ========================================
        // ADD MARKERS FOR MARKER MODE
        // ========================================
        if (durationMode === 'markers') {
            var markers = textLayer.property('Marker');

            // IN marker at startAt
            var inMarker = new MarkerValue('IN');
            inMarker.comment = 'IN';
            markers.setValueAtTime(startAt, inMarker);

            // OUT marker at startAt + duration
            var outMarker = new MarkerValue('OUT');
            outMarker.comment = 'OUT';
            markers.setValueAtTime(startAt + duration, outMarker);
        }

        // ========================================
        // PARAGRAPH & FONT SETTINGS
        // ========================================
        try {
            var textProp = textLayer.property("Source Text");
            var textDoc = textProp.value;
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            if (settings.monospace) {
                textDoc.font = "CourierNewPSMT";
            }
            textProp.setValue(textDoc);
        } catch (e) { }

        // ========================================
        // BUILD AND APPLY EXPRESSION
        // ========================================
        var sourceText = textLayer.property('ADBE Text Properties').property('ADBE Text Document');
        var expr = NOMRO.expressions.generateCountdownEmbedded(settings);
        sourceText.expression = expr;

        // ========================================
        // CENTER TEXT
        // ========================================
        var textRect = textLayer.sourceRectAtTime(0, false);
        var anchorX = textRect.left + textRect.width / 2;
        var anchorY = textRect.top + textRect.height / 2;
        textLayer.property('Anchor Point').setValue([anchorX, anchorY]);
        textLayer.property('Position').setValue([comp.width / 2, comp.height / 2]);

        // ========================================
        // SAVE METADATA (For UI Sync)
        // ========================================
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
