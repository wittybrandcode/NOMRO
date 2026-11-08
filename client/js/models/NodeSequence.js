/**
 * NOMRO - Node Sequence Model
 * Pure data model and validation for Multi-Waypoint Node Sequences
 * @module models/NodeSequence
 */
var NodeSequence = (function () {
    'use strict';

    var NODE_TYPES = {
        NUMBER: 'number',
        TIME: 'time',
        TEXT: 'text',
        DELTA: 'delta'
    };

    /**
     * Create a new unique node ID
     * @private
     */
    function _generateId() {
        return 'node_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }

    /**
     * Create a single node object
     * @param {Object} options
     * @returns {Object} Node object
     */
    function createNode(options) {
        options = options || {};
        var type = options.type || NODE_TYPES.NUMBER;
        if (type !== NODE_TYPES.NUMBER && type !== NODE_TYPES.TIME && type !== NODE_TYPES.TEXT && type !== NODE_TYPES.DELTA) {
            type = NODE_TYPES.NUMBER;
        }

        var defaultVal = 0;
        if (type === NODE_TYPES.TIME) defaultVal = '00:01:00';
        else if (type === NODE_TYPES.TEXT) defaultVal = 'GO!';
        else if (type === NODE_TYPES.DELTA) defaultVal = '+100';

        return {
            id: options.id || _generateId(),
            type: type,
            value: (options.value !== undefined) ? options.value : defaultVal,
            time: (typeof options.time === 'number' && !isNaN(options.time)) ? Math.max(0, options.time) : 0,
            hold: (typeof options.hold === 'number' && !isNaN(options.hold)) ? Math.max(0, options.hold) : 0,
            easing: options.easing || 'smoothOut',
            label: options.label || ''
        };
    }

    /**
     * Create initial default sequence for new layers
     * @returns {Array} Array of node objects
     */
    function getDefaultSequence() {
        return [
            createNode({ id: 'node_1', type: NODE_TYPES.NUMBER, value: 0, time: 0, hold: 0, label: 'Start' }),
            createNode({ id: 'node_2', type: NODE_TYPES.NUMBER, value: 500, time: 2, hold: 0.5, label: 'Midpoint' }),
            createNode({ id: 'node_3', type: NODE_TYPES.NUMBER, value: 1000, time: 4, hold: 0, label: 'Goal' })
        ];
    }

    /**
     * Sort nodes chronologically by time
     * @param {Array} nodes
     * @returns {Array}
     */
    function sortNodes(nodes) {
        if (!Array.isArray(nodes)) return [];
        return nodes.slice().sort(function (a, b) {
            return (a.time || 0) - (b.time || 0);
        });
    }

    /**
     * Validate and sanitize a sequence
     * @param {Array} nodes
     * @returns {Array} Sanitized nodes
     */
    function sanitizeSequence(nodes) {
        if (!Array.isArray(nodes) || nodes.length === 0) {
            return getDefaultSequence();
        }

        var sanitized = [];
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n && typeof n === 'object') {
                sanitized.push(createNode(n));
            }
        }

        if (sanitized.length === 0) {
            return getDefaultSequence();
        }

        return sortNodes(sanitized);
    }

    /**
     * Format node payload string for After Effects marker comments
     * @param {Object} node
     * @returns {string} Marker comment (e.g. NUM:500, TIME:120, TXT:GO)
     */
    function toMarkerComment(node) {
        if (!node) return 'NUM:0';
        var type = node.type || NODE_TYPES.NUMBER;
        var val = String(node.value !== undefined ? node.value : 0).trim();
        var hold = (node.hold && node.hold > 0) ? '|H:' + parseFloat(node.hold.toFixed(2)) : '';
        var ease = (node.easing && node.easing !== 'smoothOut') ? '|E:' + node.easing : '';

        if (type === NODE_TYPES.TIME) {
            return 'TIME:' + val + hold + ease;
        } else if (type === NODE_TYPES.TEXT) {
            return 'TXT:' + val + hold + ease;
        } else if (type === NODE_TYPES.DELTA) {
            return 'DELTA:' + val + hold + ease;
        } else {
            return 'NUM:' + val + hold + ease;
        }
    }

    /**
     * Parse marker comment back into node data
     * @param {string} comment
     * @param {number} time
     * @returns {Object} Node object
     */
    function fromMarkerComment(comment, time) {
        comment = (comment || '').trim();
        var hold = 0;
        var easing = 'smoothOut';

        // Check for options suffix e.g. |H:1.5|E:snappyOut
        if (comment.indexOf('|') !== -1) {
            var parts = comment.split('|');
            comment = parts[0];
            for (var p = 1; p < parts.length; p++) {
                var opt = parts[p].trim();
                if (opt.indexOf('H:') === 0) {
                    hold = parseFloat(opt.substring(2)) || 0;
                } else if (opt.indexOf('E:') === 0) {
                    easing = opt.substring(2);
                }
            }
        }

        if (comment.indexOf('TIME:') === 0) {
            return createNode({
                type: NODE_TYPES.TIME,
                value: comment.substring(5),
                time: time,
                hold: hold,
                easing: easing
            });
        } else if (comment.indexOf('TXT:') === 0) {
            return createNode({
                type: NODE_TYPES.TEXT,
                value: comment.substring(4),
                time: time,
                hold: hold,
                easing: easing
            });
        } else if (comment.indexOf('DELTA:') === 0) {
            return createNode({
                type: NODE_TYPES.DELTA,
                value: comment.substring(6),
                time: time,
                hold: hold,
                easing: easing
            });
        } else if (comment.indexOf('NUM:') === 0) {
            return createNode({
                type: NODE_TYPES.NUMBER,
                value: parseFloat(comment.substring(4)) || 0,
                time: time,
                hold: hold,
                easing: easing
            });
        } else {
            // Fallback: If numeric, treat as number; if colon in it, treat as time; else text
            if (/^-?\d+(\.\d+)?$/.test(comment)) {
                return createNode({ type: NODE_TYPES.NUMBER, value: parseFloat(comment), time: time, hold: hold, easing: easing });
            } else if (comment.indexOf(':') !== -1) {
                return createNode({ type: NODE_TYPES.TIME, value: comment, time: time, hold: hold, easing: easing });
            } else {
                return createNode({ type: NODE_TYPES.TEXT, value: comment, time: time, hold: hold, easing: easing });
            }
        }
    }

    return {
        NODE_TYPES: NODE_TYPES,
        createNode: createNode,
        getDefaultSequence: getDefaultSequence,
        sortNodes: sortNodes,
        sanitizeSequence: sanitizeSequence,
        toMarkerComment: toMarkerComment,
        fromMarkerComment: fromMarkerComment
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeSequence;
}

