/**
 * NOMRO - Preset Model
 * Single Responsibility: Preset data structure only
 * @module models/Preset
 */
var Preset = (function () {
    'use strict';

    /**
     * Create a new Preset from counter settings
     * @param {string} name - Preset name
     * @param {Object} settings - Counter settings
     * @returns {Object} Preset object
     */
    function create(name, settings) {
        var clonedSettings = {};
        try {
            clonedSettings = JSON.parse(JSON.stringify(settings || {}));
        } catch (e) {
            clonedSettings = {};
            for (var k in settings) {
                if (settings.hasOwnProperty(k)) clonedSettings[k] = settings[k];
            }
        }

        var category = 'counter';
        if (settings) {
            if (settings.counterType === 'timer') {
                category = 'timer';
            } else if (settings.counterType === 'nodes' || settings.nodes || settings.nodeSequence) {
                category = 'nodes';
            }
        }

        return {
            id: 'preset_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),
            name: name,
            category: category,
            isFactory: false,
            settings: clonedSettings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Update preset settings
     * @param {Object} preset - Existing preset
     * @param {Object} newSettings - New settings
     * @returns {Object} Updated preset
     */
    function update(preset, newSettings) {
        var key;
        for (key in newSettings) {
            if (newSettings.hasOwnProperty(key)) {
                preset.settings[key] = newSettings[key];
            }
        }
        preset.updatedAt = new Date().toISOString();
        return preset;
    }

    /**
     * Serialize preset to JSON string
     * @param {Object} preset - Preset object
     * @returns {string} JSON string
     */
    function toJSON(preset) {
        return JSON.stringify(preset);
    }

    /**
     * Deserialize JSON to preset object
     * @param {string} json - JSON string
     * @returns {Object|null} Preset object or null
     */
    function fromJSON(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    }

    /**
     * Public API
     */
    return {
        create: create,
        update: update,
        toJSON: toJSON,
        fromJSON: fromJSON
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Preset;
}


