/**
 * NOMRO - Settings & Metadata Extractor Service
 * Handles reading configs from expressions, comments, native text properties, and sliders
 * @module services/SettingsExtractor
 */

NOMRO.helpers = NOMRO.helpers || {};

/**
 * Read settings from expression config
 */
NOMRO.helpers.readExpressionConfig = function (layer) {
    try {
        var expr = layer.property("Source Text").expression;
        if (!expr || expr.indexOf(NOMRO_CONSTANTS.CONFIG_MARKER) === -1) {
            return {};
        }

        var configMatch = expr.match(/\/\*\s*NOMRO_CONFIG\s*=\s*(\{[\s\S]*?\})\s*\*\/(?![\s\S]*\/\*\s*NOMRO_CONFIG)/) ||
            expr.match(/\/\*\s*NOMRO_CONFIG\s*=\s*(\{[\s\S]*\})\s*\*\//);
        if (configMatch && configMatch[1]) {
            return NOMRO.helpers.safeParse(configMatch[1], {});
        }
    } catch (e) {
        NOMRO.helpers.logError('Read Expression Config', e);
    }
    return {};
};

/**
 * Read settings from layer comment (legacy fallback)
 */
NOMRO.helpers.readCommentConfig = function (layer) {
    try {
        if (layer.comment && layer.comment.indexOf('{') === 0) {
            return NOMRO.helpers.safeParse(layer.comment, {});
        }
    } catch (e) {
        NOMRO.helpers.logError('Read Comment Config', e);
    }
    return {};
};

/**
 * Read native text properties
 */
NOMRO.helpers.readTextProperties = function (layer) {
    var props = {};
    try {
        var textProp = layer.property("Source Text");
        var textDoc = textProp.value;

        props.fontFamily = textDoc.font;
        props.fontSize = textDoc.fontSize;
        props.fillColor = textDoc.fillColor;
        props.strokeColor = textDoc.strokeColor;
        props.strokeOverFill = textDoc.strokeOverFill;
        props.applyStroke = textDoc.applyStroke;
        props.applyFill = textDoc.applyFill;
        props.justification = textDoc.justification;
    } catch (e) {
        NOMRO.helpers.logError('Read Text Properties', e);
    }
    return props;
};

/**
 * Read slider values from effects
 */
NOMRO.helpers.readSliderValues = function (layer) {
    var values = {};
    try {
        var effects = layer.Effects;
        for (var i = 1; i <= effects.numProperties; i++) {
            var effect = effects.property(i);
            if (effect.matchName === NOMRO_CONSTANTS.EFFECTS.SLIDER) {
                var sliderName = effect.name;
                // Only read NOMRO-specific sliders to prevent collision with user effects
                if (sliderName.indexOf(NOMRO_CONSTANTS.PREFIX) === 0) {
                    var value = effect.property('Slider').value;
                    var keyName = sliderName.replace(NOMRO_CONSTANTS.PREFIX, '').toLowerCase();
                    values[keyName] = value;
                }
            }
        }
    } catch (e) {
        NOMRO.helpers.logError('Read Slider Values', e);
    }
    return values;
};

/**
 * Reassemble large values (millions split)
 */
NOMRO.helpers.reassembleLargeValues = function (settings) {
    var largeKeys = ['start', 'end'];

    for (var i = 0; i < largeKeys.length; i++) {
        var baseKey = largeKeys[i];
        var mKey = baseKey + '_m';

        if (settings[mKey] !== undefined) {
            var millions = parseFloat(settings[mKey]) || 0;
            var remainder = parseFloat(settings[baseKey]) || 0;
            settings[baseKey] = (millions * NOMRO_CONSTANTS.LARGE_VALUE_THRESHOLD) + remainder;
            delete settings[mKey];
        }
    }

    return settings;
};

/**
 * Read all markers from layer
 */
NOMRO.helpers.readMarkers = function (layer) {
    var markersList = [];
    try {
        var markers = layer.property('Marker');
        if (markers.numKeys > 0) {
            for (var m = 1; m <= markers.numKeys; m++) {
                markersList.push({
                    time: markers.keyTime(m),
                    comment: markers.keyValue(m).comment
                });
            }
        }
    } catch (e) {
        NOMRO.helpers.logError('Read Markers', e);
    }
    return markersList;
};

/**
 * Merge settings from multiple sources (priority order: sources[0] > sources[1] > ...)
 * Accepts either an Array of objects or variable arguments (source1, source2, ...)
 */
NOMRO.helpers.mergeSettings = function (sources) {
    var sourceList = [];
    if (sources instanceof Array) {
        sourceList = sources;
    } else if (arguments.length > 0) {
        for (var a = 0; a < arguments.length; a++) {
            if (arguments[a]) sourceList.push(arguments[a]);
        }
    }

    var merged = {};

    for (var i = 0; i < sourceList.length; i++) {
        var source = sourceList[i];
        if (!source || typeof source !== 'object') continue;
        for (var key in source) {
            if (merged[key] === undefined) {
                merged[key] = source[key];
            }
        }
    }

    if (merged.ease !== undefined && merged.easeStrength === undefined) {
        merged.easeStrength = merged.ease;
    }

    return merged;
};
