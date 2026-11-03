/**
 * NOMRO - Logger Service
 * Single Responsibility: Centralized logging with production silence
 * @module services/Logger
 */
var Logger = (function () {
    'use strict';

    /**
     * Check if debug mode is enabled.
     * Enable via: window.NOMRO_DEBUG = true
     * @returns {boolean}
     */
    function _isDebug() {
        return !!(typeof window !== 'undefined' && window.NOMRO_DEBUG);
    }

    /**
     * Format a log message with a consistent prefix.
     * @param {string} level - Log level tag
     * @param {string} module - Module name
     * @param {*} args - Additional arguments
     * @returns {Array} Formatted arguments array
     */
    function _format(level, module, args) {
        var prefix = '[NOMRO]';
        if (module) {
            prefix += '[' + module + ']';
        }
        var out = [prefix];
        for (var i = 0; i < args.length; i++) {
            out.push(args[i]);
        }
        return out;
    }

    /**
     * General log (debug-only).
     * @param {string} module - Module name (optional, pass '' to omit)
     * @param {...*} args - Values to log
     */
    function log(module) {
        if (!_isDebug()) return;
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var formatted = _format('LOG', module, args);
        console.log.apply(console, formatted);
    }

    /**
     * Info log (debug-only).
     */
    function info(module) {
        if (!_isDebug()) return;
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var formatted = _format('INFO', module, args);
        if (console.info) {
            console.info.apply(console, formatted);
        } else {
            console.log.apply(console, formatted);
        }
    }

    /**
     * Warning log (always visible).
     */
    function warn(module) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var formatted = _format('WARN', module, args);
        if (console.warn) {
            console.warn.apply(console, formatted);
        } else {
            console.log.apply(console, formatted);
        }
    }

    /**
     * Error log (always visible).
     */
    function error(module) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var formatted = _format('ERROR', module, args);
        if (console.error) {
            console.error.apply(console, formatted);
        } else {
            console.log.apply(console, formatted);
        }
    }

    return {
        log: log,
        info: info,
        warn: warn,
        error: error
    };
})();
