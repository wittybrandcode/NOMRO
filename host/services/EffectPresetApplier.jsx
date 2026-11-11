/**
 * NOMRO - Effect Preset Applier Service
 * Universal native After Effects effect applier for Presets (Counter, Timer, Nodes)
 * Supports Drop Shadow, Glow, Fill, Gaussian Blur, and arbitrary effect matchNames
 * @module services/EffectPresetApplier
 */

NOMRO.effects = NOMRO.effects || {};

/**
 * Apply a list of effects to a layer safely
 * @param {Layer} layer - Target After Effects layer
 * @param {Array} effectsList - Array of effect definitions
 * @returns {number} Count of successfully applied effects
 */
NOMRO.effects.applyPresetEffects = function (layer, effectsList) {
    if (!layer || !effectsList || typeof effectsList.length !== 'number' || effectsList.length === 0) {
        return 0;
    }

    var appliedCount = 0;

    for (var i = 0; i < effectsList.length; i++) {
        var effDef = effectsList[i];
        if (!effDef) continue;

        try {
            var matchName = effDef.matchName || effDef.name;
            if (!matchName) continue;

            // Check if effect already exists by name or matchName to avoid duplicates
            var existingProp = null;
            if (layer.property('ADBE Effect Parade')) {
                var parade = layer.property('ADBE Effect Parade');
                for (var p = 1; p <= parade.numProperties; p++) {
                    var prop = parade.property(p);
                    if (prop.matchName === matchName || prop.name === (effDef.name || matchName)) {
                        existingProp = prop;
                        break;
                    }
                }
            }

            var effect = existingProp;
            if (!effect) {
                effect = layer.Effects.addProperty(matchName);
                if (effDef.name) {
                    try { effect.name = effDef.name; } catch (eName) { }
                }
            }

            if (!effect) continue;

            // Apply specific properties if defined
            if (effDef.properties && typeof effDef.properties === 'object') {
                for (var propKey in effDef.properties) {
                    if (effDef.properties.hasOwnProperty(propKey)) {
                        try {
                            var targetProp = effect.property(propKey);
                            if (targetProp && targetProp.setValue) {
                                targetProp.setValue(effDef.properties[propKey]);
                            }
                        } catch (eProp) {
                            // Non-critical if specific sub-property name differs by AE language
                        }
                    }
                }
            }

            // Convenience shortcuts for standard effects
            if (matchName === 'ADBE Drop Shadow') {
                if (effDef.opacity !== undefined) {
                    try { effect.property('ADBE Drop Shadow-0002').setValue(effDef.opacity); } catch (e) {
                        try { effect.property('Opacity').setValue(effDef.opacity); } catch (e2) { }
                    }
                }
                if (effDef.distance !== undefined) {
                    try { effect.property('ADBE Drop Shadow-0004').setValue(effDef.distance); } catch (e) {
                        try { effect.property('Distance').setValue(effDef.distance); } catch (e2) { }
                    }
                }
                if (effDef.softness !== undefined) {
                    try { effect.property('ADBE Drop Shadow-0005').setValue(effDef.softness); } catch (e) {
                        try { effect.property('Softness').setValue(effDef.softness); } catch (e2) { }
                    }
                }
                if (effDef.color && typeof effDef.color.length === 'number') {
                    try { effect.property('ADBE Drop Shadow-0001').setValue(effDef.color); } catch (e) {
                        try { effect.property('Shadow Color').setValue(effDef.color); } catch (e2) { }
                    }
                }
            } else if (matchName === 'ADBE Glo2') {
                if (effDef.threshold !== undefined) {
                    try { effect.property('ADBE Glo2-0001').setValue(effDef.threshold); } catch (e) {
                        try { effect.property('Glow Threshold').setValue(effDef.threshold); } catch (e2) { }
                    }
                }
                if (effDef.radius !== undefined) {
                    try { effect.property('ADBE Glo2-0002').setValue(effDef.radius); } catch (e) {
                        try { effect.property('Glow Radius').setValue(effDef.radius); } catch (e2) { }
                    }
                }
                if (effDef.intensity !== undefined) {
                    try { effect.property('ADBE Glo2-0003').setValue(effDef.intensity); } catch (e) {
                        try { effect.property('Glow Intensity').setValue(effDef.intensity); } catch (e2) { }
                    }
                }
            } else if (matchName === 'ADBE Fill') {
                if (effDef.color && typeof effDef.color.length === 'number') {
                    try { effect.property('ADBE Fill-0002').setValue(effDef.color); } catch (e) {
                        try { effect.property('Color').setValue(effDef.color); } catch (e2) { }
                    }
                }
            } else if (matchName === 'ADBE Gaussian Blur 2') {
                if (effDef.blurriness !== undefined) {
                    try { effect.property('ADBE Gaussian Blur 2-0001').setValue(effDef.blurriness); } catch (e) {
                        try { effect.property('Blurriness').setValue(effDef.blurriness); } catch (e2) { }
                    }
                }
            }

            appliedCount++;
        } catch (eEff) {
            if (NOMRO.helpers && NOMRO.helpers.logError) {
                NOMRO.helpers.logError('Apply Preset Effect (' + matchName + ')', eEff);
            }
        }
    }

    return appliedCount;
};
