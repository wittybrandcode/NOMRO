/**
 * NOMRO - Counter Module
 * Handles counter creation and update logic
 * @module modules/counter
 */
var CounterModule = (function () {
    'use strict';

    var _elements = null;
    var _state = null;
    var _linkedLayer = null;

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     * @param {Object} state - App state reference
     */
    function init(elements, state) {
        _elements = elements;
        _state = state;
        window.addEventListener('resize', _applyAdaptivePreviewScale);
    }

    /**
     * Set linked layer for update mode
     * @param {string|null} layerName
     */
    function setLinkedLayer(layerName) {
        _linkedLayer = layerName;
    }

    /**
     * Get linked layer
     * @returns {string|null}
     */
    function getLinkedLayer() {
        return _linkedLayer;
    }

    /**
     * Get settings for current tab
     * @param {string} currentTab - 'counter' or 'timer'
     * @returns {Object} Settings object
     */
    function getSettings(currentTab) {
        var settings = {};

        if (currentTab === 'counter' || !currentTab) {
            settings.counterType = 'basic';
            settings.start = _state.counter.start;
            settings.end = _state.counter.end;
            settings.duration = _state.counter.duration;
            var easingSettings = {
                schemaVersion: 2,
                easing: _state.counter.easing,
                easingConfig: _state.counter.easingConfig,
                curveLibrary: _state.counter.curveLibrary
            };
            if (typeof EasingValidator !== 'undefined') {
                easingSettings = EasingValidator.sanitizeSettings(easingSettings);
            }
            settings.schemaVersion = easingSettings.schemaVersion || 2;
            settings.easingConfig = easingSettings.easingConfig || { mode: 'single', singleCurveId: _state.counter.easing || 'linear' };
            settings.curveLibrary = easingSettings.curveLibrary || [];
            settings.easing = easingSettings.easing || _state.counter.easing || 'linear';
            settings.numberFormat = _state.counter.format;
            settings.symbol = _state.counter.prefix;
            settings.suffix = _state.counter.suffix;
            // Respect "Separators" toggle
            settings.separator = _state.counter.commas ? _state.counter.separator : '';
            settings.formatPos = _state.counter.symbolPosition;
            settings.monospace = _state.counter.monospace;
            settings.decimals = _state.counter.decimals; // New: Pass decimals state
            settings.useMarkers = _state.counter.useMarkers || false;
        }

        return settings;
    }

    /**
     * Initialize counter inputs
     */
    function initInputs() {
        if (_elements.startValue) {
            _elements.startValue.addEventListener('input', function () {
                var val = parseFloat(this.value);
                if (!isNaN(val)) {
                    _state.counter.start = val;
                }
                updatePreview();
            });
        }

        if (_elements.endValue) {
            _elements.endValue.addEventListener('input', function () {
                var val = parseFloat(this.value);
                if (!isNaN(val)) {
                    _state.counter.end = val;
                }
                updatePreview();
            });
        }

        if (_elements.durationValue) {
            _elements.durationValue.addEventListener('input', function () {
                var val = parseFloat(this.value);
                if (!isNaN(val)) {
                    _state.counter.duration = val;
                }
            });
        }
    }

    /**
     * Update preview display
     */
    function updatePreview() {
        if (!_elements.previewNumber || _isAnimating) return;
        _renderPreviewValue(_state.counter.end);
    }

    /**
     * Format number according to settings
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    function formatNumber(num) {
        var isDec = !!_state.counter.decimals;
        var n = isDec ? Number(num).toFixed(2) : Math.round(num).toString();
        var parts = n.split('.');
        var intPart = parts[0];
        var decPart = parts.length > 1 ? '.' + parts[1] : '';

        var zeros = 1;
        if (_state.counter.format && _state.counter.format !== 'normal') {
            var parsedFmt = parseInt(_state.counter.format, 10);
            if (!isNaN(parsedFmt) && parsedFmt > 1) {
                zeros = parsedFmt;
            }
        }

        var str = Math.abs(parseInt(intPart, 10) || 0).toString();
        while (str.length < zeros) {
            str = '0' + str;
        }

        var sep = _state.counter.commas ? (_state.counter.separator || ',') : '';
        if (sep !== '') {
            str = str.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
        }

        var isNeg = num < 0 && Math.abs(num) >= (isDec ? 0.005 : 0.5);
        var sign = isNeg ? '-' : '';

        var pre = _state.counter.prefix || '';
        var suf = _state.counter.suffix || '';
        var pos = _state.counter.symbolPosition || 'left';

        return (pos === 'left') ? (sign + pre + str + decPart + suf) : (sign + suf + str + decPart + pre);
    }

    /**
     * Render preview value and keep large numbers readable.
     * @param {number} value
     */
    function _renderPreviewValue(value) {
        if (!_elements.previewNumber) return;

        var formatted = formatNumber(value);
        _elements.previewNumber.textContent = formatted;
        _elements.previewNumber.title = formatted;
        _applyAdaptivePreviewScale();
    }

    /**
     * Scale preview text dynamically when the number is too long for the card.
     */
    function _applyAdaptivePreviewScale() {
        if (!_elements.previewNumber) return;

        var textEl = _elements.previewNumber;
        var containerEl = textEl.parentElement;
        if (!containerEl) return;

        textEl.style.transform = 'scale(1)';
        textEl.classList.remove('is-overflowing');

        var containerWidth = containerEl.clientWidth || 0;
        var contentWidth = textEl.scrollWidth || 0;

        if (!containerWidth || !contentWidth || contentWidth <= containerWidth) {
            return;
        }

        var scale = (containerWidth / contentWidth) * 0.98;
        scale = Math.max(0.52, Math.min(1, scale));

        textEl.style.transform = 'scale(' + scale + ')';
        textEl.classList.add('is-overflowing');
    }

    // Animation state
    var _isAnimating = false;
    var _animationFrameId = null;

    /**
     * Initialize preview controls
     */
    function initPreview() {
        if (_elements.playPreview) {
            _elements.playPreview.addEventListener('click', startAnimation);
        }
        if (_elements.stopPreview) {
            _elements.stopPreview.addEventListener('click', stopAnimation);
        }
        if (_elements.resetPreview) {
            _elements.resetPreview.addEventListener('click', resetAnimation);
        }
    }

    /**
     * Start preview animation
     */
    function startAnimation() {
        if (_isAnimating) return;

        _togglePlayStopButtons(true);
        _isAnimating = true;
        if (_elements.previewNumber) {
            _elements.previewNumber.classList.add('counting');
        }

        var startTime = performance.now();
        var duration = _state.counter.duration * 1000;
        var startVal = _state.counter.start;
        var endVal = _state.counter.end;

        function step(currentTime) {
            if (!_isAnimating) return;

            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var easedProgress = _applyEasing(progress);
            var currentVal = startVal + (endVal - startVal) * easedProgress;

            if (_elements.previewNumber) {
                _renderPreviewValue(currentVal);
            }

            if (progress < 1) {
                _animationFrameId = requestAnimationFrame(step);
            } else {
                stopAnimation();
                _showToast('Preview completed!', 'success');
            }
        }

        _animationFrameId = requestAnimationFrame(step);
    }

    /**
     * Stop preview animation
     */
    function stopAnimation() {
        _isAnimating = false;
        if (_animationFrameId) {
            cancelAnimationFrame(_animationFrameId);
            _animationFrameId = null;
        }
        if (_elements.previewNumber) {
            _elements.previewNumber.classList.remove('counting');
        }
        _togglePlayStopButtons(false);
    }

    /**
     * Reset preview animation
     */
    function resetAnimation() {
        stopAnimation();
        if (_elements.previewNumber) {
            _renderPreviewValue(_state.counter.start);
        }
    }

    // Private: Toggle play/stop buttons
    function _togglePlayStopButtons(isPlaying) {
        if (_elements.playPreview) {
            _elements.playPreview.style.display = isPlaying ? 'none' : 'flex';
        }
        if (_elements.stopPreview) {
            _elements.stopPreview.style.display = isPlaying ? 'flex' : 'none';
        }
    }

    // Private: Evaluate easing via centralized runtime
    function _applyEasing(t) {
        if (typeof EasingRuntime !== 'undefined') {
            return EasingRuntime.evaluateCounterState(_state.counter, t);
        }
        return t;
    }

    // Private: Show toast message
    function _showToast(message, type) {
        if (typeof MessagesModule !== 'undefined' && MessagesModule.showToast) {
            MessagesModule.showToast(message, type);
        } else if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        }
    }

    // Public API (create/update removed - use CreationModule instead)
    return {
        init: init,
        initInputs: initInputs,
        initPreview: initPreview,
        getSettings: getSettings,
        setLinkedLayer: setLinkedLayer,
        getLinkedLayer: getLinkedLayer,
        updatePreview: updatePreview,
        formatNumber: formatNumber
    };
})();
