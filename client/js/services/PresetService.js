/**
 * NOMRO - Preset Service
 * Single Responsibility: Preset management only
 * @module services/PresetService
 */
var PresetService = (function () {
    'use strict';

    /**
     * Storage key for presets
     * @private
     */
    var _storageKey = 'presets';

    function _normalizeSettings(settings) {
        settings = settings || {};
        if (typeof EasingValidator !== 'undefined') {
            return EasingValidator.sanitizeSettings(settings);
        }
        return settings;
    }

    function _normalizePreset(preset) {
        if (!preset || typeof preset !== 'object') return preset;
        if (!preset.settings || typeof preset.settings !== 'object') return preset;

        preset.settings = _normalizeSettings(preset.settings);
        return preset;
    }

    /**
     * Get all saved presets
     * @returns {Array} Array of preset objects
     */
    function getAll() {
        var presets = Storage.get(_storageKey, []);
        if (!Array.isArray(presets)) return [];

        var changed = false;
        for (var i = 0; i < presets.length; i++) {
            var before = JSON.stringify(presets[i] && presets[i].settings ? presets[i].settings : {});
            _normalizePreset(presets[i]);
            var after = JSON.stringify(presets[i] && presets[i].settings ? presets[i].settings : {});
            if (before !== after) changed = true;
        }

        if (changed) {
            Storage.set(_storageKey, presets);
        }

        return presets;
    }

    /**
     * Get a preset by ID
     * @param {string} id - Preset ID
     * @returns {Object|null} Preset object or null
     */
    function getById(id) {
        var presets = getAll();
        for (var i = 0; i < presets.length; i++) {
            if (presets[i].id === id) {
                return presets[i];
            }
        }
        return null;
    }

    /**
     * Save a new preset
     * @param {string} name - Preset name
     * @param {Object} settings - Counter settings
     * @returns {Object} Created preset
     */
    function save(name, settings) {
        var presets = getAll();
        var normalizedSettings = _normalizeSettings(settings);
        var newPreset = Preset.create(name, normalizedSettings);
        presets.push(newPreset);
        Storage.set(_storageKey, presets);
        return newPreset;
    }

    /**
     * Update an existing preset
     * @param {string} id - Preset ID
     * @param {Object} newSettings - New settings
     * @returns {Object|null} Updated preset or null
     */
    function update(id, newSettings) {
        var presets = getAll();
        var normalizedSettings = _normalizeSettings(newSettings);

        for (var i = 0; i < presets.length; i++) {
            if (presets[i].id === id) {
                presets[i] = Preset.update(presets[i], normalizedSettings);
                _normalizePreset(presets[i]);
                Storage.set(_storageKey, presets);
                return presets[i];
            }
        }
        return null;
    }

    /**
     * Delete a preset by ID
     * @param {string} id - Preset ID
     * @returns {boolean} Success
     */
    function remove(id) {
        var presets = getAll();
        var filtered = [];
        var found = false;

        for (var i = 0; i < presets.length; i++) {
            if (presets[i].id === id) {
                found = true;
            } else {
                filtered.push(presets[i]);
            }
        }

        if (found) {
            Storage.set(_storageKey, filtered);
        }

        return found;
    }

    /**
     * Clear all presets
     * @returns {boolean} Success
     */
    function clear() {
        return Storage.remove(_storageKey);
    }

    /**
     * Export presets as JSON string
     * @returns {string} JSON string
     */
    function exportJSON() {
        return JSON.stringify(getAll());
    }

    /**
     * Import presets from JSON string
     * @param {string} json - JSON string
     * @returns {boolean} Success
     */
    function importJSON(json) {
        try {
            var imported = JSON.parse(json);
            if (Array.isArray(imported)) {
                var existing = getAll();
                var normalizedImported = [];

                for (var i = 0; i < imported.length; i++) {
                    var item = imported[i];
                    if (!item || typeof item !== 'object' || !item.settings) {
                        continue;
                    }

                    if (typeof EasingValidator !== 'undefined' && item.settings) {
                        var validation = EasingValidator.validateStrict(
                            EasingValidator.sanitizeSettings(item.settings)
                        );
                        if (!validation.valid && typeof Logger !== 'undefined') {
                            Logger.warn('PresetImport', 'Preset "' + (item.name || 'unknown') + '" has easing issues: ' + validation.errors.join(', '));
                        }
                    }
                    normalizedImported.push(_normalizePreset(item));
                }

                var merged = existing.concat(normalizedImported);
                Storage.set(_storageKey, merged);
                return true;
            }
        } catch (e) {
            console.error('PresetService.importJSON error:', e);
        }
        return false;
    }

    /**
     * Public API
     */
    return {
        getAll: getAll,
        getById: getById,
        save: save,
        update: update,
        remove: remove,
        clear: clear,
        exportJSON: exportJSON,
        importJSON: importJSON
    };
})();
