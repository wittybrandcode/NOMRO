/**
 * NOMRO - Composition Utilities
 * @module utils/CompUtils
 */

NOMRO.utils = NOMRO.utils || {};

/**
 * Check if there's an active composition
 * @returns {string} 'true' or 'false'
 */
NOMRO.utils.hasActiveComp = function () {
    return (app.project.activeItem && app.project.activeItem instanceof CompItem) ? 'true' : 'false';
};

/**
 * Get the active composition
 * @returns {CompItem|null}
 */
NOMRO.utils.getActiveComp = function () {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        return comp;
    }
    return null;
};

/**
 * Get current playhead time in active composition
 * @returns {number} Time in seconds
 */
NOMRO.utils.getCompPlayheadTime = function () {
    var comp = NOMRO.utils.getActiveComp();
    if (comp) {
        return comp.time;
    }
    return 0;
};

/**
 * Log message to console
 * @param {string} message
 */
NOMRO.utils.log = function (message) {
    $.writeln('[NOMRO] ' + message);
};
