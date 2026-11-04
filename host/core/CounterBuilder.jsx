/**
 * NOMRO - Counter Builder (Embedded Controls)
 * Controls are now directly on Text Layer, no separate Null layer
 * @module core/CounterBuilder
 */

NOMRO.core = NOMRO.core || {};

/**
 * Add slider effect to layer
 * @param {Layer} layer - Target layer
 * @param {string} name - Slider name
 * @param {number} value - Default value
 * @returns {Property} Slider property
 */
NOMRO.core.addSlider = function (layer, name, value) {
    var effect = layer.Effects.addProperty('ADBE Slider Control');
    effect.name = name;
    effect.property('Slider').setValue(value);
    return effect.property('Slider');
};

/**
 * Add checkbox effect to layer
 * @param {Layer} layer - Target layer
 * @param {string} name - Checkbox name
 * @param {boolean} value - Default value
 * @returns {Property} Checkbox property
 */
NOMRO.core.addCheckbox = function (layer, name, value) {
    var effect = layer.Effects.addProperty('ADBE Checkbox Control');
    effect.name = name;
    effect.property('Checkbox').setValue(value ? 1 : 0);
    return effect.property('Checkbox');
};

/**
 * Create counter with embedded controls
 * All sliders are on the Text Layer itself
 * @param {CompItem} comp - Target composition
 * @param {Object} settings - Counter settings
 * @returns {TextLayer} Text layer with embedded controls
 */
NOMRO.core.buildCounter = function (comp, settings) {
    app.beginUndoGroup('NOMRO Create Counter');

    try {
        // Create text layer directly
        var textLayer = comp.layers.addText('0');
        textLayer.name = 'NOMRO_Counter';
        textLayer.label = 10; // Yellow

        // ========================================
        // ADD CONTROLS DIRECTLY TO TEXT LAYER
        // ========================================

        // Helper to handle large numbers (split into millions + remainder)
        function addLargeValue(name, val) {
            val = parseFloat(val) || 0;
            if (Math.abs(val) > 1000000) {
                var millions = val >= 0 ? Math.floor(val / 1000000) : Math.ceil(val / 1000000);
                var remainder = val - (millions * 1000000);
                NOMRO.core.addSlider(textLayer, name + '_M', millions);
                NOMRO.core.addSlider(textLayer, name, remainder);
            } else {
                NOMRO.core.addSlider(textLayer, name, val);
            }
        }

        // Core counters
        addLargeValue('NOMRO_Start', settings.start !== undefined ? settings.start : 0);
        addLargeValue('NOMRO_End', settings.end !== undefined ? settings.end : 100);
        NOMRO.core.addSlider(textLayer, 'NOMRO_Duration', settings.duration !== undefined ? settings.duration : 2);
        NOMRO.core.addSlider(textLayer, 'NOMRO_Delay', 0);

        // ========================================
        // ADD MARKERS (If Enabled)
        // ========================================
        if (settings.useMarkers) {
            var markers = textLayer.property('Marker');
            var inTime = textLayer.inPoint;
            var outTime = inTime + (settings.duration !== undefined ? settings.duration : 2);

            if (settings.useFreeExpression) {
                var startMarker = new MarkerValue('START');
                markers.setValueAtTime(inTime, startMarker);

                var stopMarker = new MarkerValue('STOP');
                markers.setValueAtTime(outTime, stopMarker);
            } else {
                var inMarker = new MarkerValue('IN');
                markers.setValueAtTime(inTime, inMarker);

                var outMarker = new MarkerValue('OUT');
                markers.setValueAtTime(outTime, outMarker);
            }
        }

        // ========================================
        // APPLY EXPRESSION
        // ========================================
        var sourceText = textLayer.property('ADBE Text Properties').property('ADBE Text Document');
        var expression = settings.useFreeExpression
            ? NOMRO.expressions.generateFreeExpression(settings)
            : NOMRO.expressions.generateEmbedded(settings);
        sourceText.expression = expression;
        sourceText.expressionEnabled = true;

        // ========================================
        // PARAGRAPH & FONT SETTINGS
        // ========================================
        try {
            var textDoc = sourceText.value;
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            if (settings.monospace) {
                textDoc.font = "CourierNewPSMT";
            }
            sourceText.setValue(textDoc);
        } catch (e) {
            // Ignore if font or justification not supported
        }

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
            // Save full settings to layer comment for restoration
            settings.layerName = textLayer.name;
            textLayer.comment = JSON.stringify(settings);
        } catch (e) {
            // Ignore if comment fails
        }

        app.endUndoGroup();
        return textLayer;

    } catch (e) {
        app.endUndoGroup();
        throw e;
    }
};
