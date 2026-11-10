/**
 * NOMRO - Sync Module
 * Handles synchronization between After Effects and UI
 * @module modules/sync
 */
var SyncModule = (function () {
    'use strict';

    var _elements = null;
    var _state = null;
    var _callbacks = {};

    function _toNumber(value, fallback) {
        var num = parseFloat(value);
        return isNaN(num) ? fallback : num;
    }



    function _applyTimerModeUI(mode) {
        if (typeof TimerDefaults !== 'undefined' && TimerDefaults.applyDurationModeUI) {
            TimerDefaults.applyDurationModeUI(_elements, mode);
        }
    }

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     * @param {Object} state - App state reference
     * @param {Object} callbacks - { switchTab, updatePreview, updateTimer, showUpdateMode }
     */
    function init(elements, state, callbacks) {
        _elements = elements;
        _state = state;
        _callbacks = callbacks || {};
    }

    /**
     * Handle layer selection from After Effects
     * @param {Object} settings - Layer settings from AE
     */
    function onLayerSelected(settings) {
        if (!settings) return;

        if (typeof Logger !== 'undefined') {
            Logger.log('Sync', 'Applying settings:', settings.counterType);
        }

        // Switch to correct tab based on counterType
        if (settings.counterType === 'timer') {
            if (_callbacks.switchTab) _callbacks.switchTab('timer');
        } else if (settings.counterType === 'nodes') {
            if (_callbacks.switchTab) _callbacks.switchTab('nodes');
        } else {
            if (_callbacks.switchTab) _callbacks.switchTab('counter');
        }

        // Apply settings to UI
        applyLayerSettingsToUI(settings);

        // Show update mode with layer metadata for type-safe updates
        if (_callbacks.showUpdateMode) {
            _callbacks.showUpdateMode({
                layerName: settings.layerName,
                counterType: settings.counterType || 'counter',
                layerId: settings.layerId,
                layerIndex: settings.layerIndex
            });
        }
    }

    /**
     * Apply layer settings to UI elements
     * @param {Object} settings - Settings to apply
     */
    function applyLayerSettingsToUI(settings) {
        settings = settings || {};
        if (typeof EasingValidator !== 'undefined') {
            settings = EasingValidator.sanitizeSettings(settings);
        }
        var easingConfig = settings.easingConfig || {
            mode: 'single',
            singleCurveId: settings.easing || 'linear'
        };

        // 1. Easing Configuration Application based on counterType
        if (settings.counterType === 'nodes') {
            if (_state.nodes) {
                if (settings.easing) _state.nodes.easing = settings.easing;
                if (settings.easeStrength !== undefined) _state.nodes.easeStrength = settings.easeStrength;
            }
        } else if (settings.counterType === 'timer') {
            if (_state.timer) {
                _state.timer.easing = easingConfig.mode === 'single' ? easingConfig.singleCurveId : (settings.easing || 'linear');
                _state.timer.easingConfig = easingConfig;
            }
        } else {
            _state.counter.easingConfig = easingConfig;
            _state.counter.curveLibrary = settings.curveLibrary || _state.counter.curveLibrary || [];

            var selectedCurve = easingConfig.mode === 'single'
                ? easingConfig.singleCurveId
                : (settings.easing || _state.counter.easing || 'linear');

            if (typeof UIControlsModule !== 'undefined' && UIControlsModule.applyEasingConfig) {
                UIControlsModule.applyEasingConfig(easingConfig, selectedCurve, _state.counter.curveLibrary);
            } else {
                _state.counter.easing = selectedCurve;
                if (_elements.singleEasingCurve) {
                    _elements.singleEasingCurve.value = selectedCurve;
                }
            }
        }

        // 2. Tab Settings Application
        if (settings.counterType === 'nodes') {
            if (typeof NodesModule !== 'undefined' && NodesModule.applySettings) {
                NodesModule.applySettings(settings);
            }
        } else if (settings.counterType === 'timer') {
            _applyTimerSettings(settings);
        } else {
            _applyCounterSettings(settings);
        }

        // Native Properties (Logging)
        if (typeof Logger !== 'undefined') {
            if (settings.fontFamily) Logger.log('Sync', 'Font:', settings.fontFamily);
            if (settings.fontSize) Logger.log('Sync', 'Size:', settings.fontSize);
            if (settings.fillColor) Logger.log('Sync', 'Color:', settings.fillColor);
        }

        // Update displays
        if (_callbacks.updatePreview) _callbacks.updatePreview();
        if (_callbacks.updateTimer) _callbacks.updateTimer();
    }

    /**
     * Apply counter-specific settings
     */
    function _applyCounterSettings(settings) {
        if (settings.start !== undefined && _elements.startValue) {
            _elements.startValue.value = settings.start;
            _state.counter.start = settings.start;
        }
        if (settings.end !== undefined && _elements.endValue) {
            _elements.endValue.value = settings.end;
            _state.counter.end = settings.end;
        }
        if (settings.duration !== undefined && _elements.durationValue) {
            _elements.durationValue.value = settings.duration;
            _state.counter.duration = settings.duration;
        }

        // Markers
        if (settings.useMarkers !== undefined) {
            _state.counter.useMarkers = settings.useMarkers;
            var toggleMarkersBtn = document.getElementById('toggle-markers-btn');
            if (toggleMarkersBtn) {
                toggleMarkersBtn.classList.toggle('active', settings.useMarkers);
            }
            if (_elements.durationValue) {
                _elements.durationValue.parentElement.style.opacity = settings.useMarkers ? '0.5' : '1';
                _elements.durationValue.disabled = settings.useMarkers;
            }
        }

        // Format
        if (settings.numberFormat) {
            _state.counter.format = settings.numberFormat;
            document.querySelectorAll('.segment-compact[data-format]').forEach(function (seg) {
                seg.classList.toggle('active', seg.getAttribute('data-format') === settings.numberFormat);
            });
        }

        // Decimals toggle/state
        if (settings.decimals !== undefined) {
            _state.counter.decimals = !!settings.decimals;
            if (_elements.toggleDecimalsBtn) {
                _elements.toggleDecimalsBtn.classList.toggle('active', _state.counter.decimals);
            }
        }

        // Separator + commas toggle/state
        if (settings.separator !== undefined) {
            _state.counter.separator = settings.separator;
            _state.counter.commas = settings.separator !== '';

            document.querySelectorAll('.segment-compact[data-separator]').forEach(function (seg) {
                seg.classList.toggle('active', seg.getAttribute('data-separator') === settings.separator);
            });

            if (_elements.toggleCommasBtn) {
                _elements.toggleCommasBtn.classList.toggle('active', _state.counter.commas);
            }
        }

        if (settings.commas !== undefined) {
            _state.counter.commas = !!settings.commas;
            if (_elements.toggleCommasBtn) {
                _elements.toggleCommasBtn.classList.toggle('active', _state.counter.commas);
            }
            if (!_state.counter.commas) {
                _state.counter.separator = '';
            }
        }

        // Prefix/Suffix
        if (settings.symbol !== undefined && _elements.prefixSymbol) {
            _elements.prefixSymbol.value = settings.symbol;
            _state.counter.prefix = settings.symbol;
        }
        if (settings.suffix !== undefined && _elements.suffixSymbol) {
            _elements.suffixSymbol.value = settings.suffix;
            _state.counter.suffix = settings.suffix;
        }

        // Monospace
        if (settings.monospace !== undefined) {
            _state.counter.monospace = settings.monospace;
            if (_elements.toggleMonospaceBtn) {
                _elements.toggleMonospaceBtn.classList.toggle('active', settings.monospace);
            }
        }

        // Symbol Position (formatPos)
        var formatPos = settings.formatPos || (settings.symbolPosition ? settings.symbolPosition : 'left');
        _state.counter.symbolPosition = formatPos;
        if (_elements.alignLeftBtn) {
            _elements.alignLeftBtn.classList.toggle('active', formatPos === 'left');
        }
        if (_elements.alignRightBtn) {
            _elements.alignRightBtn.classList.toggle('active', formatPos === 'right');
        }
    }

    /**
     * Apply timer-specific settings
     */
    function _applyTimerSettings(settings) {
        if (!_state.timer) return;

        var fps = _toNumber(settings.fps || settings.frameRate, _state.timer.fps || 30);
        _state.timer.fps = fps;

        if (settings.start !== undefined) {
            var startUnits = TimerDefaults.secondsToUnits(settings.start, fps);
            _state.timer.hours = startUnits.hours;
            _state.timer.mins = startUnits.mins;
            _state.timer.secs = startUnits.secs;
            _state.timer.frames = startUnits.frames;

            if (_elements.inputHours) _elements.inputHours.value = startUnits.hours;
            if (_elements.inputMins) _elements.inputMins.value = startUnits.mins;
            if (_elements.inputSecs) _elements.inputSecs.value = startUnits.secs;
            if (_elements.inputFrames) _elements.inputFrames.value = startUnits.frames;
        }

        if (settings.end !== undefined) {
            var endUnits = TimerDefaults.secondsToUnits(settings.end, fps);
            _state.timer.endHours = endUnits.hours;
            _state.timer.endMins = endUnits.mins;
            _state.timer.endSecs = endUnits.secs;
            _state.timer.endFrames = endUnits.frames;

            if (_elements.inputEndH) _elements.inputEndH.value = endUnits.hours;
            if (_elements.inputEndM) _elements.inputEndM.value = endUnits.mins;
            if (_elements.inputEndS) _elements.inputEndS.value = endUnits.secs;
            if (_elements.inputEndF) _elements.inputEndF.value = endUnits.frames;
        }

        if (settings.duration !== undefined && _elements.inputDuration) {
            var durationNum = _toNumber(settings.duration, _state.timer.duration || 10);
            var duration = Math.min(Math.max(durationNum, 0.1), 864000);
            _elements.inputDuration.value = duration;
            _state.timer.duration = duration;
        }

        if (settings.startAt !== undefined && _elements.inputStartAt) {
            var startAtNum = _toNumber(settings.startAt, _state.timer.startAt || 0);
            var startAt = Math.min(Math.max(startAtNum, 0), 864000);
            _elements.inputStartAt.value = startAt;
            _state.timer.startAt = startAt;
        }

        var formatCandidate = settings.format;
        if (formatCandidate === undefined && settings.displayFormat !== undefined) {
            formatCandidate = settings.displayFormat;
        }

        if (formatCandidate !== undefined) {
            var format = TimerDefaults.normalizeFormat(formatCandidate);
            _state.timer.format = format;
            if (_elements.selectCountdownFormat) {
                var hasOption = !!_elements.selectCountdownFormat.querySelector('option[value="' + format + '"]');
                _elements.selectCountdownFormat.value = hasOption ? format : 'hmsf';
                if (!hasOption) {
                    _state.timer.format = 'hmsf';
                }
            }
        }

        if (settings.monospace !== undefined) {
            _state.timer.monospace = !!settings.monospace;
            if (_elements.timerToggleMonospaceBtn) {
                _elements.timerToggleMonospaceBtn.classList.toggle('active', _state.timer.monospace);
            }
        }

        var mode = TimerDefaults.normalizeMode(settings.durationMode || _state.timer.durationMode);
        _state.timer.durationMode = mode;
        _applyTimerModeUI(mode);
    }

    // Public API
    return {
        init: init,
        onLayerSelected: onLayerSelected,
        applyLayerSettingsToUI: applyLayerSettingsToUI
    };
})();




