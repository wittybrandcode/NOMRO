/**
 * NOMRO - CEP Bridge
 * Separation of Concerns: CEP communication only
 * @module bridge/Bridge
 */
var Bridge = (function () {
    'use strict';

    /**
     * CSInterface instance
     * @private
     */
    var _csInterface = null;

    /**
     * Initialize bridge
     */
    function init() {
        if (typeof CSInterface !== 'undefined') {
            _csInterface = new CSInterface();
        } else {
            console.warn('CSInterface not available - running in browser mode');
        }
    }

    /**
     * Check if running in CEP environment
     * @returns {boolean}
     */
    function isCEP() {
        return _csInterface !== null;
    }

    /**
     * Execute ExtendScript
     * @param {string} script - Script to execute
     * @param {Function} callback - Callback(err, result)
     */
    function evalScript(script, callback) {
        callback = callback || function () { };
        if (!_csInterface) {
            // Browser mock mode
            console.log('[Bridge] Mock evalScript:', script);
            setTimeout(function () {
                callback(null, 'success');
            }, 500);
            return;
        }

        _csInterface.evalScript(script, function (result) {
            if (result === 'EvalScript error.' || result === 'undefined') {
                callback(new Error('Script execution failed'), null);
            } else if (result && result.indexOf('Error:') === 0) {
                callback(new Error(result), null);
            } else {
                callback(null, result);
            }
        });
    }

    /**
     * Create a counter in After Effects
     * @param {Object} settings - Counter settings
     * @param {Function} callback - Callback(err, result)
     */
    function createCounter(settings, callback) {
        callback = callback || function () { };
        // Call the global createCounter function in index.jsx
        var script = 'createCounter(' + JSON.stringify(settings) + ')';

        evalScript(script, function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            try {
                var parsed = JSON.parse(result);
                if (parsed && parsed.success === false) {
                    callback({ message: parsed.error || 'Create failed' }, null);
                } else {
                    callback(null, parsed || result);
                }
            } catch (e) {
                callback(null, result);
            }
        });
    }

    /**
     * Check if a composition is active
     * @param {Function} callback - Callback(err, hasComp)
     */
    function hasActiveComp(callback) {
        var script = 'NOMRO.utils.hasActiveComp()';

        evalScript(script, function (err, result) {
            if (err) {
                callback(err, false);
            } else {
                callback(null, result === 'true');
            }
        });
    }

    /**
     * Get playhead time in seconds from active composition
     * @param {Function} callback - Callback(err, timeInSeconds)
     */
    function getCompPlayheadTime(callback) {
        callback = callback || function () { };
        var script = 'NOMRO.utils.getCompPlayheadTime()';

        evalScript(script, function (err, result) {
            if (err) {
                callback(err, 0);
            } else {
                callback(null, parseFloat(result) || 0);
            }
        });
    }

    /**
     * Update an existing NOMRO layer
     * @param {string|Object} layerRef - Layer name or layer reference
     * @param {Object} settings - New settings
     * @param {function} callback - Callback(err, result)
     */
    function updateLayer(layerRef, settings, callback) {
        callback = callback || function () { };

        var data = { settings: settings || {} };
        if (typeof layerRef === 'string') {
            data.layerName = layerRef;
        } else if (layerRef && typeof layerRef === 'object') {
            data.layerName = layerRef.layerName || null;
            if (layerRef.layerId !== undefined && layerRef.layerId !== null) {
                data.layerId = layerRef.layerId;
            }
            if (layerRef.layerIndex !== undefined && layerRef.layerIndex !== null) {
                data.layerIndex = layerRef.layerIndex;
            }
        }

        var script = 'updateLayer(' + JSON.stringify(data) + ')';
        evalScript(script, function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                try {
                    var parsed = JSON.parse(result);
                    if (parsed && parsed.success === false) {
                        callback({ message: parsed.error || 'Update failed' }, null);
                    } else {
                        callback(null, parsed);
                    }
                } catch (e) {
                    callback(null, result);
                }
            }
        });
    }

    /**
     * Get host environment info
     * @returns {Object|null} Host info or null
     */
    function getHostInfo() {
        if (!_csInterface) return null;

        try {
            var env = (typeof _csInterface.getHostEnvironment === 'function')
                ? _csInterface.getHostEnvironment()
                : _csInterface.hostEnvironment;

            if (!env) return null;

            return {
                appName: env.appName || 'AEFT',
                appVersion: env.appVersion || '0'
            };
        } catch (e) {
            console.warn('[Bridge] getHostInfo error:', e);
            return null;
        }
    }

    /**
     * Get theme colors
     * @returns {Object|null} Theme colors or null
     */
    function getThemeColors() {
        if (!_csInterface) return null;

        var info = _csInterface.getHostEnvironment();
        if (!info || !info.appSkinInfo) return null;

        return {
            panelBackground: info.appSkinInfo.panelBackgroundColor
        };
    }

    // Initialize on load
    init();

    /**
     * Public API
     */
    return {
        init: init,
        isCEP: isCEP,
        evalScript: evalScript,
        createCounter: createCounter,
        updateLayer: updateLayer,
        hasActiveComp: hasActiveComp,
        getCompPlayheadTime: getCompPlayheadTime,
        getHostInfo: getHostInfo,
        getThemeColors: getThemeColors
    };
})();

