/**
 * NOMRO Pro - ExtendScript Main Entry Point
 * Modular Architecture for Adobe After Effects CEP Extension
 * @version 4.1.0 - Clean Architecture & Modularized Services
 */

// ============================================
// CONSTANTS
// ============================================
var NOMRO_CONSTANTS = {
    VERSION: '4.1.0',
    PREFIX: 'NOMRO_',

    LAYER_TYPES: {
        COUNTER: 'counter',
        TIMER: 'timer',
        FREE: 'free'
    },

    EFFECTS: {
        SLIDER: 'ADBE Slider Control'
    },

    MARKERS: {
        IN: 'IN',
        OUT: 'OUT',
        DEFAULT_DURATION: 2
    },

    FONTS: {
        MONOSPACE: 'CourierNewPSMT',
        DEFAULT: 'Arial-BoldMT'
    },

    SLIDER_NAMES: {
        START: 'NOMRO_Start',
        END: 'NOMRO_End',
        DURATION: 'NOMRO_Duration',
        EASE: 'NOMRO_Ease'
    },

    CONFIG_MARKER: 'NOMRO_CONFIG',
    LARGE_VALUE_THRESHOLD: 1000000,

    ERRORS: {
        NO_COMP: 'No composition selected',
        NO_LAYER: 'No layer selected',
        LAYER_LOCKED: 'Layer is locked',
        LAYER_NOT_FOUND: 'Layer not found',
        INVALID_MARKER: 'Invalid marker index',
        NOT_NOMRO_LAYER: 'Not a NOMRO layer',
        TYPE_MISMATCH: 'TYPE_MISMATCH'
    }
};

// ============================================
// NAMESPACE INITIALIZATION
// ============================================
var NOMRO = NOMRO || {};
NOMRO.version = NOMRO_CONSTANTS.VERSION;
NOMRO.core = NOMRO.core || {};
NOMRO.easing = NOMRO.easing || {};
NOMRO.utils = NOMRO.utils || {};
NOMRO.validators = NOMRO.validators || {};
NOMRO.helpers = NOMRO.helpers || {};
NOMRO.expressions = NOMRO.expressions || {};
NOMRO.vars = {
    comp: null,
    layer: null,
    debugMode: false
};

// ============================================
// CORE RUNTIME HELPERS
// ============================================

/**
 * Create standardized JSON response for CEP
 */
NOMRO.helpers.createResponse = function (success, data, error) {
    var response = { success: success };
    if (success && data) {
        for (var key in data) {
            response[key] = data[key];
        }
    }
    if (!success && error) {
        response.error = error;
    }
    return JSON.stringify(response);
};

/**
 * Log error to ExtendScript console
 */
NOMRO.helpers.logError = function (context, error) {
    if (NOMRO.vars.debugMode) {
        $.writeln('[NOMRO ERROR] ' + context + ': ' + (error ? error.message || error : 'unknown error'));
    }
};

/**
 * Safe JSON parse with fallback
 */
NOMRO.helpers.safeParse = function (jsonString, fallback) {
    try {
        if (typeof jsonString === 'object' && jsonString !== null) {
            return jsonString;
        }
        return JSON.parse(jsonString);
    } catch (e) {
        NOMRO.helpers.logError('JSON Parse', e);
        return fallback || null;
    }
};

/**
 * Execute with undo group wrapper
 */
NOMRO.helpers.withUndoGroup = function (groupName, callback) {
    try {
        app.beginUndoGroup(groupName);
        var result = callback();
        app.endUndoGroup();
        return result;
    } catch (e) {
        app.endUndoGroup();
        throw e;
    }
};

// ============================================
// LOAD MODULAR SERVICES & LIBRARIES
// ============================================
#include "utils/JSONPolyfill.jsx"
#include "utils/CompUtils.jsx"
#include "services/LayerResolver.jsx"
#include "services/SettingsExtractor.jsx"
#include "services/LayerUpdater.jsx"
#include "easing/EasingLib.jsx"
#include "easing/EasingRegistry.jsx"
#include "easing/EasingExpressionAdapter.jsx"
#include "expressions/ExpressionGenerator.jsx"
#include "core/CounterBuilder.jsx"
#include "core/CountdownBuilder.jsx"

// ============================================
// PUBLIC API DISPATCHERS (CALLED VIA CEP BRIDGE)
// ============================================

/**
 * Create counter or timer layer in active composition
 * @param {string|Object} settings - Configuration settings
 * @returns {string} JSON response
 */
function createCounter(settings) {
    try {
        if (typeof settings === 'string') {
            settings = NOMRO.helpers.safeParse(settings, {});
        }

        var comp = NOMRO.validators.getActiveComp();
        var counterType = settings.counterType || NOMRO_CONSTANTS.LAYER_TYPES.COUNTER;
        var layer;

        if (counterType === NOMRO_CONSTANTS.LAYER_TYPES.TIMER) {
            layer = NOMRO.core.buildCountdown(comp, settings);
        } else if (counterType === NOMRO_CONSTANTS.LAYER_TYPES.FREE) {
            settings.useMarkers = true;
            settings.useFreeExpression = true;
            layer = NOMRO.core.buildCounter(comp, settings);
        } else {
            layer = NOMRO.core.buildCounter(comp, settings);
        }

        var layerRef = NOMRO.helpers.getLayerRef(layer);
        return NOMRO.helpers.createResponse(true, {
            layerName: layer.name,
            layerIndex: layerRef.layerIndex,
            layerId: layerRef.layerId,
            layerRef: layerRef,
            counterType: counterType
        });

    } catch (e) {
        NOMRO.helpers.logError('Create Counter', e);
        return NOMRO.helpers.createResponse(false, null, e.message);
    }
}

/**
 * Read settings from selected NOMRO layer
 * @returns {string} JSON with layer settings or null
 */
function readSelectedLayer() {
    try {
        var comp = NOMRO.validators.getActiveComp();
        var layer = NOMRO.validators.getSelectedLayer(comp);

        if (!NOMRO.validators.isNOMROLayer(layer)) {
            return JSON.stringify(null);
        }

        var exprConfig = NOMRO.helpers.readExpressionConfig(layer);
        var commentConfig = NOMRO.helpers.readCommentConfig(layer);
        var textProps = NOMRO.helpers.readTextProperties(layer);
        var sliderValues = NOMRO.helpers.readSliderValues(layer);

        // Merge sources with priority: sliderValues > exprConfig > commentConfig > textProps
        var settings = NOMRO.helpers.mergeSettings([
            sliderValues,
            exprConfig,
            commentConfig,
            textProps
        ]);

        settings = NOMRO.helpers.reassembleLargeValues(settings);

        var layerRef = NOMRO.helpers.getLayerRef(layer);
        settings.layerName = layerRef.layerName;
        settings.layerIndex = layerRef.layerIndex;
        if (layerRef.layerId !== undefined) {
            settings.layerId = layerRef.layerId;
        }
        settings.frameRate = comp.frameRate;

        if (!settings.counterType) {
            settings.counterType = NOMRO.helpers.detectLayerType(layer);
        }

        var markersList = NOMRO.helpers.readMarkers(layer);
        if (markersList.length > 0) {
            settings.markers = markersList;
        }

        return JSON.stringify(settings);

    } catch (e) {
        return JSON.stringify(null);
    }
}

/**
 * Update existing NOMRO layer with new settings
 * @param {string|Object} data - { layerName|layerId|layerIndex, settings }
 * @returns {string} JSON result
 */
function updateLayer(data) {
    try {
        if (typeof data === 'string') {
            data = NOMRO.helpers.safeParse(data, {});
        }

        var comp = NOMRO.validators.getActiveComp();
        var settings = data.settings || {};
        var layerRefRequest = {
            layerName: data.layerName || (data.layerRef ? data.layerRef.layerName : null),
            layerId: (data.layerId !== undefined && data.layerId !== null)
                ? data.layerId
                : (data.layerRef ? data.layerRef.layerId : null),
            layerIndex: (data.layerIndex !== undefined && data.layerIndex !== null)
                ? data.layerIndex
                : (data.layerRef ? data.layerRef.layerIndex : null)
        };
        var layer = NOMRO.validators.findLayerByReference(comp, layerRefRequest);
        var existingLayerType = NOMRO.helpers.detectLayerType(layer);

        NOMRO.helpers.assertUpdateTypeCompatibility(layer, settings);
        settings.counterType = existingLayerType;

        NOMRO.helpers.withUndoGroup('NOMRO Update Layer', function () {
            // 1. Update sliders
            NOMRO.helpers.updateLargeSlider(layer, NOMRO_CONSTANTS.SLIDER_NAMES.START, settings.start);
            NOMRO.helpers.updateLargeSlider(layer, NOMRO_CONSTANTS.SLIDER_NAMES.END, settings.end);
            NOMRO.helpers.updateSlider(layer, NOMRO_CONSTANTS.SLIDER_NAMES.DURATION, settings.duration);
            if (settings.easeStrength !== undefined) {
                NOMRO.helpers.updateSlider(layer, NOMRO_CONSTANTS.SLIDER_NAMES.EASE, settings.easeStrength);
            }

            // 2. Update metadata comment
            NOMRO.helpers.updateComment(layer, settings);

            // 3. Update Markers & Expression
            var expr = "";
            var isTimer = existingLayerType === NOMRO_CONSTANTS.LAYER_TYPES.TIMER;
            var isFreeMode = existingLayerType === NOMRO_CONSTANTS.LAYER_TYPES.FREE ||
                settings.counterType === NOMRO_CONSTANTS.LAYER_TYPES.FREE ||
                settings.useFreeExpression === true;

            if (isTimer) {
                if (settings.startAt !== undefined && settings.startAt !== null) {
                    var startAt = parseFloat(settings.startAt);
                    if (!isNaN(startAt)) {
                        layer.startTime = startAt;
                    }
                }
                if (settings.durationMode === 'markers') {
                    NOMRO.helpers.ensureMarkers(layer, settings.duration);
                }
                expr = NOMRO.expressions.generateCountdownEmbedded(settings);

            } else if (isFreeMode) {
                NOMRO.helpers.ensureFreeMarkers(layer, settings.duration);
                expr = NOMRO.expressions.generateFreeExpression(settings);

            } else if (settings.useMarkers) {
                NOMRO.helpers.ensureMarkers(layer, settings.duration);
                expr = NOMRO.expressions.generateEmbedded(settings);

            } else {
                NOMRO.helpers.clearMarkers(layer);
                expr = NOMRO.expressions.generateEmbedded(settings);
            }

            layer.property('Source Text').expression = expr;
            NOMRO.helpers.updateFont(layer, settings.monospace, settings.originalFont || settings.fontFamily);
        });

        var updatedLayerRef = NOMRO.helpers.getLayerRef(layer);
        return NOMRO.helpers.createResponse(true, {
            layerName: layer.name,
            layerIndex: updatedLayerRef.layerIndex,
            layerId: updatedLayerRef.layerId,
            layerRef: updatedLayerRef
        });

    } catch (e) {
        NOMRO.helpers.logError('Update Layer', e);
        return NOMRO.helpers.createResponse(false, null, e.message);
    }
}

function getCurrentCompTime() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return NOMRO.helpers.createResponse(false, null, NOMRO_CONSTANTS.ERRORS.NO_COMP);
        }
        return NOMRO.helpers.createResponse(true, { time: comp.time, fps: comp.frameRate });
    } catch (e) {
        NOMRO.helpers.logError('Get Current Comp Time', e);
        return NOMRO.helpers.createResponse(false, null, e.message);
    }
}
