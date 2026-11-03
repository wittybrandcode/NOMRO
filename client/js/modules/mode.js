/**
 * NOMRO - Mode Module
 * Handles update/create mode switching and UI state
 * @module modules/mode
 */
var ModeModule = (function () {
    'use strict';

    var _elements = null;
    var _state = null;
    var _linkedLayer = null;
    var _linkedLayerInfo = null;
    var _callbacks = {};

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     * @param {Object} state - App state reference
     * @param {Object} callbacks - { showToast }
     */
    function init(elements, state, callbacks) {
        _elements = elements;
        _state = state;
        _callbacks = callbacks || {};
        _initUnlinkButton();
    }

    /**
     * Initialize unlink button
     */
    function _initUnlinkButton() {
        var btnUnlink = document.getElementById('btn-unlink');
        if (btnUnlink) {
            btnUnlink.addEventListener('click', function () {
                var prevLayer = _linkedLayer;
                var prevInfo = _linkedLayerInfo;
                showCreateMode();
                if (_callbacks.onUnlink) {
                    _callbacks.onUnlink(prevInfo || prevLayer);
                }
                if (_callbacks.showToast) {
                    _callbacks.showToast('Layer unlinked', 'success');
                }
            });
        }
    }

    /**
     * Get linked layer name
     * @returns {string|null}
     */
    function getLinkedLayer() {
        return _linkedLayer;
    }

    /**
     * Get linked layer metadata
     * @returns {Object|null}
     */
    function getLinkedLayerInfo() {
        return _linkedLayerInfo;
    }

    /**
     * Set linked layer
     * @param {string|Object|null} layerInfo
     */
    function setLinkedLayer(layerInfo) {
        if (!layerInfo) {
            _linkedLayer = null;
            _linkedLayerInfo = null;
            return;
        }

        if (typeof layerInfo === 'string') {
            _linkedLayer = layerInfo;
            _linkedLayerInfo = { layerName: layerInfo };
            return;
        }

        _linkedLayer = layerInfo.layerName || null;
        _linkedLayerInfo = {
            layerName: _linkedLayer,
            counterType: layerInfo.counterType,
            layerId: layerInfo.layerId,
            layerIndex: layerInfo.layerIndex
        };
    }

    /**
     * Show update mode UI
     * @param {string|Object} layerInfo - Layer name or metadata object
     * @param {string} layerType - counter|timer|free
     */
    function showUpdateMode(layerInfo, layerType) {
        var normalized = (typeof layerInfo === 'object' && layerInfo !== null)
            ? layerInfo
            : { layerName: layerInfo, counterType: layerType };

        _linkedLayer = normalized.layerName || null;
        _linkedLayerInfo = {
            layerName: _linkedLayer,
            counterType: normalized.counterType,
            layerId: normalized.layerId,
            layerIndex: normalized.layerIndex
        };

        var isTimerLayer = (normalized.counterType === 'timer');

        var btnCounter = document.getElementById('btn-create-counter');
        if (btnCounter) {
            var spanC = btnCounter.querySelector('span');
            if (spanC) spanC.textContent = isTimerLayer ? 'Create Counter' : 'Update Counter';
            btnCounter.classList.toggle('update-mode', !isTimerLayer);
        }

        var btnTimer = document.getElementById('btn-create-timer');
        if (btnTimer) {
            var spanT = btnTimer.querySelector('span');
            if (spanT) spanT.textContent = isTimerLayer ? 'Update Timer' : 'Create Timer';
            btnTimer.classList.toggle('update-mode', isTimerLayer);
        }

        var btnUnlink = document.getElementById('btn-unlink');
        if (btnUnlink) {
            btnUnlink.style.display = 'inline-flex';
        }

        if (typeof Logger !== 'undefined') {
            Logger.log('Mode', 'Update mode:', _linkedLayer);
        }
    }

    /**
     * Show create mode UI
     */
    function showCreateMode() {
        _linkedLayer = null;
        _linkedLayerInfo = null;

        // Reset Counter button
        var btnCounter = document.getElementById('btn-create-counter');
        if (btnCounter) {
            var spanC = btnCounter.querySelector('span');
            if (spanC) spanC.textContent = 'Create Counter';
            btnCounter.classList.remove('update-mode');
        }

        // Reset Timer button
        var btnTimer = document.getElementById('btn-create-timer');
        if (btnTimer) {
            var spanT = btnTimer.querySelector('span');
            if (spanT) spanT.textContent = 'Create Timer';
            btnTimer.classList.remove('update-mode');
        }

        var btnUnlink = document.getElementById('btn-unlink');
        if (btnUnlink) {
            btnUnlink.style.display = 'none';
        }

        if (typeof Logger !== 'undefined') {
            Logger.log('Mode', 'Create mode');
        }
    }

    // Public API
    return {
        init: init,
        getLinkedLayer: getLinkedLayer,
        getLinkedLayerInfo: getLinkedLayerInfo,
        setLinkedLayer: setLinkedLayer,
        showUpdateMode: showUpdateMode,
        showCreateMode: showCreateMode
    };
})();




