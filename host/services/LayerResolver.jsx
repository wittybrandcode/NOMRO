/**
 * NOMRO - Layer & Composition Resolver Service
 * Handles active comp validation, layer resolution, matching, and type detection
 * @module services/LayerResolver
 */

NOMRO.validators = NOMRO.validators || {};
NOMRO.helpers = NOMRO.helpers || {};

/**
 * Get stable layer identifier when host supports it
 */
NOMRO.helpers.getLayerId = function (layer) {
    try {
        if (layer && layer.id !== undefined && layer.id !== null) {
            return layer.id;
        }
    } catch (e) {
        NOMRO.helpers.logError('Get Layer ID', e);
    }
    return null;
};

/**
 * Build layer reference payload for UI <-> Host synchronization
 */
NOMRO.helpers.getLayerRef = function (layer) {
    var ref = {
        layerName: layer ? layer.name : null,
        layerIndex: layer ? layer.index : null
    };

    var id = NOMRO.helpers.getLayerId(layer);
    if (id !== null) {
        ref.layerId = id;
    }

    return ref;
};

/**
 * Validate and get active composition
 */
NOMRO.validators.getActiveComp = function () {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        throw new Error(NOMRO_CONSTANTS.ERRORS.NO_COMP);
    }
    return comp;
};

/**
 * Validate and get selected layer
 */
NOMRO.validators.getSelectedLayer = function (comp) {
    if (!comp) {
        comp = NOMRO.validators.getActiveComp();
    }

    if (comp.selectedLayers.length === 0) {
        throw new Error(NOMRO_CONSTANTS.ERRORS.NO_LAYER);
    }

    var layer = comp.selectedLayers[0];

    if (layer.locked) {
        throw new Error(NOMRO_CONSTANTS.ERRORS.LAYER_LOCKED);
    }

    return layer;
};

/**
 * Check if layer is NOMRO layer
 */
NOMRO.validators.isNOMROLayer = function (layer) {
    if (!layer) return false;

    // 1. Name prefix check
    if (layer.name && layer.name.indexOf(NOMRO_CONSTANTS.PREFIX) === 0) {
        return true;
    }

    // 2. NOMRO_CONFIG comment in Source Text expression check
    try {
        var srcText = layer.property("Source Text");
        if (srcText && srcText.expression && srcText.expression.indexOf(NOMRO_CONSTANTS.CONFIG_MARKER) !== -1) {
            return true;
        }
    } catch (e) {}

    // 3. NOMRO slider controls check
    try {
        if (layer.effect(NOMRO_CONSTANTS.SLIDER_NAMES.START) !== null ||
            layer.effect('NOMRO_Start') !== null) {
            return true;
        }
    } catch (e) {}

    return false;
};

/**
 * Validate marker index
 */
NOMRO.validators.validateMarkerIndex = function (layer, keyIndex) {
    var markers = layer.property('Marker');
    if (keyIndex < 1 || keyIndex > markers.numKeys) {
        throw new Error(NOMRO_CONSTANTS.ERRORS.INVALID_MARKER);
    }
    return markers;
};

/**
 * Find layer by name in composition
 */
NOMRO.validators.findLayerByName = function (comp, layerName) {
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name === layerName) {
            return comp.layer(i);
        }
    }
    throw new Error(NOMRO_CONSTANTS.ERRORS.LAYER_NOT_FOUND + ': ' + layerName);
};

/**
 * Find layer by host layer id if available
 */
NOMRO.validators.findLayerById = function (comp, layerId) {
    if (layerId === undefined || layerId === null || layerId === '') {
        return null;
    }

    var normalizedId = String(layerId);
    for (var i = 1; i <= comp.numLayers; i++) {
        var candidate = comp.layer(i);
        var candidateId = NOMRO.helpers.getLayerId(candidate);
        if (candidateId !== null && String(candidateId) === normalizedId) {
            return candidate;
        }
    }

    return null;
};

/**
 * Find layer by reference object
 */
NOMRO.validators.findLayerByReference = function (comp, ref) {
    ref = ref || {};

    var layer = NOMRO.validators.findLayerById(comp, ref.layerId);
    if (layer) {
        return layer;
    }

    if (ref.layerIndex !== undefined && ref.layerIndex !== null) {
        var index = parseInt(ref.layerIndex, 10);
        if (!isNaN(index) && index >= 1 && index <= comp.numLayers) {
            layer = comp.layer(index);
            if (layer) {
                if (!ref.layerName || layer.name === ref.layerName) {
                    return layer;
                }
            }
        }
    }

    if (ref.layerName) {
        return NOMRO.validators.findLayerByName(comp, ref.layerName);
    }

    throw new Error(NOMRO_CONSTANTS.ERRORS.LAYER_NOT_FOUND + ': unknown reference');
};

/**
 * Normalize counter type into update family (counter | timer)
 */
NOMRO.helpers.normalizeTypeFamily = function (counterType) {
    if (counterType === NOMRO_CONSTANTS.LAYER_TYPES.TIMER) {
        return NOMRO_CONSTANTS.LAYER_TYPES.TIMER;
    }
    return NOMRO_CONSTANTS.LAYER_TYPES.COUNTER;
};

/**
 * Detect persisted layer type from config or fallback naming convention
 */
NOMRO.helpers.detectLayerType = function (layer) {
    var exprConfig = NOMRO.helpers.readExpressionConfig ? NOMRO.helpers.readExpressionConfig(layer) : {};
    var commentConfig = NOMRO.helpers.readCommentConfig ? NOMRO.helpers.readCommentConfig(layer) : {};
    var declaredType = exprConfig.counterType || commentConfig.counterType;

    if (declaredType) {
        return declaredType;
    }

    return layer.name.indexOf('Countdown') !== -1
        ? NOMRO_CONSTANTS.LAYER_TYPES.TIMER
        : NOMRO_CONSTANTS.LAYER_TYPES.COUNTER;
};

/**
 * Enforce type-safe updates (counter-family cannot update timer-family and vice versa)
 */
NOMRO.helpers.assertUpdateTypeCompatibility = function (layer, settings) {
    if (!settings || settings.counterType === undefined || settings.counterType === null || settings.counterType === '') {
        return;
    }

    var requestedFamily = NOMRO.helpers.normalizeTypeFamily(settings.counterType);
    var actualFamily = NOMRO.helpers.normalizeTypeFamily(NOMRO.helpers.detectLayerType(layer));

    if (requestedFamily !== actualFamily) {
        throw new Error(
            NOMRO_CONSTANTS.ERRORS.TYPE_MISMATCH +
            ': expected ' + actualFamily +
            ', got ' + settings.counterType
        );
    }
};
