/**
 * NOMRO - Creation Module
 * Handles counter/timer creation and layer updates
 * @module modules/creation
 */
var CreationModule = (function () {
    'use strict';

    var _elements = null;
    var _callbacks = {};
    var _isCreating = false;

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     * @param {Object} callbacks -
     * { getSettings, getLinkedLayer, getLinkedLayerInfo, switchTab, showError, showSuccess, showToast, handleError, hideLoading }
     */
    function init(elements, callbacks) {
        _elements = elements;
        _callbacks = callbacks || {};
        _initCreateButtons();
    }

    /**
     * Initialize tab-specific create buttons
     */
    function _initCreateButtons() {
        // Counter-specific button
        var btnCounter = document.getElementById('btn-create-counter');
        if (btnCounter) {
            btnCounter.addEventListener('click', function () {
                create('counter');
            });
        }

        // Timer-specific button
        var btnTimer = document.getElementById('btn-create-timer');
        if (btnTimer) {
            btnTimer.addEventListener('click', function () {
                create('timer');
            });
        }

        // Nodes-specific button
        var btnNodes = document.getElementById('btn-create-nodes');
        if (btnNodes) {
            btnNodes.addEventListener('click', function () {
                create('nodes');
            });
        }
    }

    /**
     * Normalize type to update families: counter | timer | nodes
     * @param {string} type
     * @returns {string}
     */
    function _normalizeType(type) {
        if (type === 'timer') return 'timer';
        if (type === 'nodes') return 'nodes';
        return 'counter';
    }

    /**
     * Report error through centralized handler (if available)
     * @param {Error|Object|string} error
     * @param {string} context
     * @param {string} fallbackMessage
     */
    function _reportError(error, context, fallbackMessage) {
        var message = fallbackMessage || 'Unexpected error';

        if (error) {
            if (typeof error === 'string') {
                message = error;
            } else if (error.message) {
                message = error.message;
            }
        }

        if (_callbacks.onStatus) {
            _callbacks.onStatus('error', message);
        }

        if (_callbacks.handleError) {
            _callbacks.handleError({ message: message, raw: error }, context || 'creation');
            return;
        }

        if (_callbacks.showError) {
            _callbacks.showError(message);
        }
    }

    /**
     * Show loading state
     */
    function _showLoading() {
        if (_elements.loading) {
            _elements.loading.style.display = 'flex';
        }
        // Hide all create buttons
        var btns = document.querySelectorAll('.btn-create');
        btns.forEach(function (btn) {
            btn.style.display = 'none';
        });
    }

    /**
     * Hide loading state
     */
    function hideLoading() {
        if (_elements.loading) {
            _elements.loading.style.display = 'none';
        }
        // Show all create buttons
        var btns = document.querySelectorAll('.btn-create');
        btns.forEach(function (btn) {
            btn.style.display = 'flex';
        });
    }

    /**
     * Create counter or timer layer
     * @param {string} type - 'counter' or 'timer'
     * @param {boolean} [forceCreate=false] - If true, force new layer creation regardless of linked layer
     * @param {Object} [overrideSettings=null] - Optional settings payload
     */
    function create(type, forceCreate, overrideSettings) {
        if (_isCreating) return;
        _isCreating = true;

        try {
            type = _normalizeType(type || 'counter');
            var settings = overrideSettings || (_callbacks.getSettings ? _callbacks.getSettings(type) : {});
            var linkedLayer = _callbacks.getLinkedLayer ? _callbacks.getLinkedLayer() : null;
            var linkedLayerInfo = _callbacks.getLinkedLayerInfo ? _callbacks.getLinkedLayerInfo() : null;

            if (!linkedLayerInfo && linkedLayer) {
                linkedLayerInfo = { layerName: linkedLayer };
            }

            // Force type based on button clicked
            if (type === 'timer') {
                settings.counterType = 'timer';
            } else if (type === 'nodes') {
                settings.counterType = 'nodes';
            } else {
                settings.counterType = 'basic';
            }

            if (typeof EasingValidator !== 'undefined') {
                settings = EasingValidator.sanitizeSettings(settings);
                var validation = EasingValidator.validateStrict(settings);
                if (!validation.valid) {
                    _reportError(
                        { message: 'Invalid easing configuration: ' + validation.errors.join(' | ') },
                        'creation.validation'
                    );
                    _isCreating = false;
                    return;
                }
            }

            // Check if we're in update mode
            var layerRef = (!forceCreate) ? (linkedLayerInfo || linkedLayer) : null;
            if (layerRef) {
                var linkedType = linkedLayerInfo && linkedLayerInfo.counterType
                    ? _normalizeType(linkedLayerInfo.counterType)
                    : null;

                // Only update if the linked layer matches the requested type
                if (linkedType === type) {
                    if (typeof Logger !== 'undefined') {
                        Logger.log('Creation', 'Updating layer:', layerRef);
                    }
                    updateLayer(layerRef, settings, linkedLayerInfo);
                    return;
                }

                // If linked layer does NOT match the requested type (e.g. Counter is selected in AE,
                // but user clicked "Create Timer" or a Timer preset), this is an intentional request
                // to CREATE a new layer of the requested type rather than an invalid update.
                // We proceed to create a new layer without blocking.
            }

            if (typeof Logger !== 'undefined') {
                Logger.log('Creation', 'Creating ' + type + ':', settings);
            }
            _showLoading();
            if (_callbacks.onStatus) _callbacks.onStatus('busy', 'Creating ' + type + '...');

            if (typeof Bridge !== 'undefined' && Bridge.createCounter) {
                Bridge.createCounter(settings, function (err, result) {
                    hideLoading();
                    _isCreating = false;
                    if (err) {
                        _reportError(err, 'creation.create', 'Error creating ' + type);
                    } else {
                        var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                        if (_callbacks.showSuccess) _callbacks.showSuccess(typeLabel + ' created successfully!');
                        if (_callbacks.onStatus) _callbacks.onStatus('ready', typeLabel + ' created');
                    }
                });
            } else {
                // Browser preview mode
                setTimeout(function () {
                    hideLoading();
                    _isCreating = false;
                    var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                    if (_callbacks.showSuccess) _callbacks.showSuccess('Preview mode - ' + typeLabel + ' created!');
                    if (_callbacks.showToast) _callbacks.showToast(typeLabel + ' created!', 'success');
                    if (_callbacks.onStatus) _callbacks.onStatus('ready', 'Preview mode - Ready');
                }, 1500);
            }
        } catch (e) {
            hideLoading();
            _isCreating = false;
            _reportError(e, 'creation.create', 'Unexpected error creating ' + type);
        }
    }

    /**
     * Update existing layer
     * @param {string|Object} layerRef - Layer name or layer reference object
     * @param {Object} settings - New settings
     * @param {Object|null} linkedLayerInfo - Selected layer metadata
     */
    function updateLayer(layerRef, settings, linkedLayerInfo) {
        _showLoading();
        if (_callbacks.onStatus) _callbacks.onStatus('busy', 'Updating layer...');

        try {
            if (typeof Bridge !== 'undefined' && Bridge.updateLayer) {
                Bridge.updateLayer(layerRef, settings, function (err, result) {
                    hideLoading();
                    _isCreating = false;

                    if (err) {
                        _reportError(err, 'creation.update', 'Error updating layer');
                        console.error('[CreationModule] Update error:', err);
                        return;
                    }

                    if (_callbacks.showToast) _callbacks.showToast('Layer updated!', 'success');
                    if (_callbacks.onStatus) _callbacks.onStatus('ready', 'Layer updated');
                });
            } else {
                // Browser preview mode
                setTimeout(function () {
                    hideLoading();
                    _isCreating = false;
                    if (_callbacks.showToast) _callbacks.showToast('Preview - Layer updated!', 'success');
                    if (_callbacks.onStatus) _callbacks.onStatus('ready', 'Preview - Layer updated');
                }, 500);
            }
        } catch (e) {
            hideLoading();
            _isCreating = false;
            _reportError(e, 'creation.update', 'Unexpected error updating layer');
        }
    }

    // Public API
    return {
        init: init,
        create: create,
        updateLayer: updateLayer,
        hideLoading: hideLoading
    };
})();
