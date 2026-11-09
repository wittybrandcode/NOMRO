/**
 * NOMRO - Layer Updater Service
 * Handles updating sliders, metadata comments, markers, and font styling on existing layers
 * @module services/LayerUpdater
 */

NOMRO.helpers = NOMRO.helpers || {};

/**
 * Update slider value safely
 */
NOMRO.helpers.updateSlider = function (layer, sliderName, value) {
    if (value === undefined || value === null) return;

    try {
        var num = parseFloat(value);
        if (isNaN(num)) return;

        var effect = layer.effect(sliderName);
        if (effect) {
            effect.property('Slider').setValue(num);
        } else {
            var slider = NOMRO.helpers.getOrCreateSlider(layer, sliderName);
            if (slider) {
                slider.setValue(num);
            }
        }
    } catch (e) {
        NOMRO.helpers.logError('Update Slider: ' + sliderName, e);
    }
};

/**
 * Split large value to millions + remainder
 */
NOMRO.helpers.splitLargeValue = function (value) {
    var numeric = parseFloat(value);
    if (isNaN(numeric)) numeric = 0;

    var millions = 0;
    if (Math.abs(numeric) > NOMRO_CONSTANTS.LARGE_VALUE_THRESHOLD) {
        millions = numeric >= 0
            ? Math.floor(numeric / NOMRO_CONSTANTS.LARGE_VALUE_THRESHOLD)
            : Math.ceil(numeric / NOMRO_CONSTANTS.LARGE_VALUE_THRESHOLD);
    }

    var remainder = numeric - (millions * NOMRO_CONSTANTS.LARGE_VALUE_THRESHOLD);
    return {
        millions: millions,
        remainder: remainder
    };
};

/**
 * Get or create slider safely
 */
NOMRO.helpers.getOrCreateSlider = function (layer, sliderName) {
    try {
        var existing = layer.effect(sliderName);
        if (existing) {
            return existing.property('Slider');
        }

        var created = layer.Effects.addProperty(NOMRO_CONSTANTS.EFFECTS.SLIDER);
        created.name = sliderName;
        return created.property('Slider');
    } catch (e) {
        NOMRO.helpers.logError('Get/Create Slider: ' + sliderName, e);
        return null;
    }
};

/**
 * Update a large value pair (base + _M)
 */
NOMRO.helpers.updateLargeSlider = function (layer, sliderName, value) {
    if (value === undefined) return;

    var numeric = parseFloat(value);
    if (isNaN(numeric)) numeric = 0;

    var split = NOMRO.helpers.splitLargeValue(numeric);
    var millionSliderName = sliderName + '_M';
    var needsMillions = Math.abs(numeric) > NOMRO_CONSTANTS.LARGE_VALUE_THRESHOLD;

    if (needsMillions) {
        var mSlider = NOMRO.helpers.getOrCreateSlider(layer, millionSliderName);
        if (mSlider) {
            mSlider.setValue(split.millions);
        }
    } else {
        // Prevent stale million values ONLY on layers that already have *_M sliders
        if (layer.effect(millionSliderName)) {
            NOMRO.helpers.updateSlider(layer, millionSliderName, 0);
        }
    }

    NOMRO.helpers.updateSlider(layer, sliderName, split.remainder);
};

/**
 * Update layer comment with settings
 */
NOMRO.helpers.updateComment = function (layer, settings) {
    try {
        var ref = NOMRO.helpers.getLayerRef(layer);
        settings.layerName = ref.layerName;
        settings.layerIndex = ref.layerIndex;
        if (ref.layerId !== undefined) {
            settings.layerId = ref.layerId;
        }
        layer.comment = JSON.stringify(settings);
    } catch (e) {
        NOMRO.helpers.logError('Update Comment', e);
    }
};

/**
 * Update font based on monospace setting, preserving user's original font when reverting
 */
NOMRO.helpers.updateFont = function (layer, monospace, originalFont) {
    try {
        var textProp = layer.property("Source Text");
        var textDoc = textProp.value;

        if (monospace) {
            // Force monospace
            if (textDoc.font !== NOMRO_CONSTANTS.FONTS.MONOSPACE) {
                textDoc.font = NOMRO_CONSTANTS.FONTS.MONOSPACE;
                textProp.setValue(textDoc);
            }
        } else {
            // Revert monospace (restore original font if known, otherwise fallback to default)
            if (textDoc.font === NOMRO_CONSTANTS.FONTS.MONOSPACE) {
                var targetFont = (originalFont && originalFont !== NOMRO_CONSTANTS.FONTS.MONOSPACE)
                    ? originalFont
                    : NOMRO_CONSTANTS.FONTS.DEFAULT;
                textDoc.font = targetFont;
                textProp.setValue(textDoc);
            }
        }
    } catch (e) {
        NOMRO.helpers.logError('Update Font', e);
    }
};

/**
 * Create default markers
 */
NOMRO.helpers.createDefaultMarkers = function (layer, duration) {
    var inPoint = layer.inPoint;
    var dur = duration || NOMRO_CONSTANTS.MARKERS.DEFAULT_DURATION;

    var inMarker = new MarkerValue(NOMRO_CONSTANTS.MARKERS.IN);
    inMarker.comment = NOMRO_CONSTANTS.MARKERS.IN;
    try { inMarker.label = 8; } catch (eIn) { }
    layer.property('Marker').setValueAtTime(inPoint, inMarker);

    var outMarker = new MarkerValue(NOMRO_CONSTANTS.MARKERS.OUT);
    outMarker.comment = NOMRO_CONSTANTS.MARKERS.OUT;
    try { outMarker.label = 8; } catch (eOut) { }
    layer.property('Marker').setValueAtTime(inPoint + dur, outMarker);
};

/**
 * Create default free-mode markers
 */
NOMRO.helpers.createDefaultFreeMarkers = function (layer, duration) {
    var inPoint = layer.inPoint;
    var dur = duration || NOMRO_CONSTANTS.MARKERS.DEFAULT_DURATION;

    var startMarker = new MarkerValue('START');
    startMarker.comment = 'START';
    try { startMarker.label = 8; } catch (eStart) { }
    layer.property('Marker').setValueAtTime(inPoint, startMarker);

    var stopMarker = new MarkerValue('STOP');
    stopMarker.comment = 'STOP';
    try { stopMarker.label = 8; } catch (eStop) { }
    layer.property('Marker').setValueAtTime(inPoint + dur, stopMarker);
};

/**
 * Clear all markers from layer
 */
NOMRO.helpers.clearMarkers = function (layer) {
    var markers = layer.property('Marker');
    var count = markers.numKeys;

    for (var i = count; i >= 1; i--) {
        markers.removeKey(i);
    }

    return count;
};

/**
 * Ensure markers exist for marker mode
 */
NOMRO.helpers.ensureMarkers = function (layer, duration) {
    var markers = layer.property('Marker');
    if (markers.numKeys === 0) {
        NOMRO.helpers.createDefaultMarkers(layer, duration);
    }
};

/**
 * Ensure free-mode markers exist
 */
NOMRO.helpers.ensureFreeMarkers = function (layer, duration) {
    var markers = layer.property('Marker');
    if (markers.numKeys === 0) {
        NOMRO.helpers.createDefaultFreeMarkers(layer, duration);
    }
};
