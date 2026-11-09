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
        var presets = Storage.get(_storageKey, null);

        // Auto-seed factory presets if storage is uninitialized
        if (presets === null || !Array.isArray(presets) || presets.length === 0) {
            if (typeof PresetDefaults !== 'undefined' && PresetDefaults.getFactoryPresets) {
                presets = PresetDefaults.getFactoryPresets();
                Storage.set(_storageKey, presets);
                return presets;
            }
            return [];
        }

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
     * Reset factory presets while preserving custom user presets
     * @returns {Array} Updated presets list
     */
    function resetFactoryPresets() {
        var existing = getAll();
        var userPresets = [];
        for (var i = 0; i < existing.length; i++) {
            if (!existing[i].isFactory) {
                userPresets.push(existing[i]);
            }
        }

        var factory = (typeof PresetDefaults !== 'undefined' && PresetDefaults.getFactoryPresets)
            ? PresetDefaults.getFactoryPresets()
            : [];

        var combined = factory.concat(userPresets);
        Storage.set(_storageKey, combined);
        return combined;
    }

    /**
     * Duplicate an existing preset
     * @param {string} id - Preset ID
     * @returns {Object|null} Duplicated preset
     */
    function duplicate(id) {
        var original = getById(id);
        if (!original) return null;

        var presets = getAll();
        var cloned = JSON.parse(JSON.stringify(original));
        cloned.id = 'preset_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
        cloned.name = original.name + ' (Copy)';
        cloned.isFactory = false;
        cloned.createdAt = new Date().toISOString();
        cloned.updatedAt = new Date().toISOString();

        presets.push(cloned);
        Storage.set(_storageKey, presets);
        return cloned;
    }

    function _resolveCategory(p) {
        if (!p) return 'counter';
        if (p.category) return p.category;
        if (p.settings) {
            if (p.settings.counterType === 'timer') return 'timer';
            if (p.settings.counterType === 'nodes' || p.settings.nodes || p.settings.nodeSequence) return 'nodes';
        }
        return 'counter';
    }

    /**
     * Filter presets by category ('all', 'counter', 'timer', 'nodes', 'custom')
     * @param {string} category
     * @returns {Array} Filtered presets
     */
    function getByCategory(category) {
        var presets = getAll();
        if (!category || category === 'all') return presets;

        if (category === 'custom') {
            return presets.filter(function (p) {
                return !p.isFactory;
            });
        }

        return presets.filter(function (p) {
            return _resolveCategory(p) === category;
        });
    }

    /**
     * Search presets across name, description, and tags
     * @param {string} query
     * @param {string} [category='all']
     * @returns {Array} Matched presets
     */
    function search(query, category) {
        var pool = getByCategory(category);
        if (!query || typeof query !== 'string') return pool;
        var q = query.trim().toLowerCase();
        if (!q) return pool;

        return pool.filter(function (p) {
            var name = (p.name || '').toLowerCase();
            var desc = (p.description || '').toLowerCase();
            var type = _resolveCategory(p).toLowerCase();
            var sym = (p.settings && (p.settings.symbol || p.settings.suffix) ? (p.settings.symbol + ' ' + p.settings.suffix) : '').toLowerCase();
            return name.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || type.indexOf(q) !== -1 || sym.indexOf(q) !== -1;
        });
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
        getByCategory: getByCategory,
        search: search,
        save: save,
        update: update,
        duplicate: duplicate,
        remove: remove,
        clear: clear,
        resetFactoryPresets: resetFactoryPresets,
        exportJSON: exportJSON,
        importJSON: importJSON
    };
})();
