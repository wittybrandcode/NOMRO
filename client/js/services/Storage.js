/**
 * NOMRO - Storage Service
 * Single Responsibility: localStorage operations only
 * @module services/Storage
 */
var Storage = (function () {
    'use strict';

    /**
     * Storage prefix to avoid conflicts
     * @private
     */
    var _prefix = 'nomro_';

    /**
     * Check if localStorage is available
     * @private
     * @returns {boolean}
     */
    function _isAvailable() {
        try {
            var test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get full key with prefix
     * @private
     * @param {string} key
     * @returns {string}
     */
    function _getKey(key) {
        return _prefix + key;
    }

    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON stringified)
     * @returns {boolean} Success
     */
    function set(key, value) {
        if (!_isAvailable()) return false;

        try {
            localStorage.setItem(_getKey(key), JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage.set error:', e);
            return false;
        }
    }

    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or default
     */
    function get(key, defaultValue) {
        if (!_isAvailable()) return defaultValue;

        try {
            var item = localStorage.getItem(_getKey(key));
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (e) {
            console.error('Storage.get error:', e);
            return defaultValue;
        }
    }

    /**
     * Remove a value from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success
     */
    function remove(key) {
        if (!_isAvailable()) return false;

        try {
            localStorage.removeItem(_getKey(key));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get all keys with NOMRO prefix
     * @returns {Array} Array of keys (without prefix)
     */
    function keys() {
        if (!_isAvailable()) return [];

        var result = [];
        var i, key;

        for (i = 0; i < localStorage.length; i++) {
            key = localStorage.key(i);
            if (key && key.indexOf(_prefix) === 0) {
                result.push(key.substring(_prefix.length));
            }
        }

        return result;
    }

    /**
     * Clear all NOMRO storage
     * @returns {boolean} Success
     */
    function clear() {
        var allKeys = keys();
        var i;

        for (i = 0; i < allKeys.length; i++) {
            remove(allKeys[i]);
        }

        return true;
    }

    /**
     * Public API
     */
    return {
        set: set,
        get: get,
        remove: remove,
        keys: keys,
        clear: clear
    };
})();
