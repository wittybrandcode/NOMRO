/**
 * NOMRO - Timer Module
 * Handles timer initialization and display
 * @module modules/timer
 */
var TimerModule = (function () {
    'use strict';

    var _elements = null;
    var _state = null;
    
    var _previewRequest = null;
    var _previewStartTime = null;
    var _isPreviewPlaying = false;

    function _clamp(value, min, max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function _normalizeDurationMode(mode) {
        return TimerDefaults.normalizeMode(mode);
    }

    function _normalizeFormat(format) {
        return TimerDefaults.normalizeFormat(format);
    }

    function _sanitizeIntInput(input, min, max, fallback) {
        var val = (typeof UIControlsModule !== 'undefined' && UIControlsModule.evaluateMath)
            ? UIControlsModule.evaluateMath(input.value, fallback)
            : parseInt(input.value, 10);
        if (isNaN(val)) val = fallback;
        val = Math.round(val);

        var clamped = _clamp(val, min, max);
        if (input.value === '' || isNaN(val) || val !== clamped) {
            input.value = clamped;
        }

        return clamped;
    }

    function _sanitizeFloatInput(input, min, max, fallback) {
        var val = (typeof UIControlsModule !== 'undefined' && UIControlsModule.evaluateMath)
            ? UIControlsModule.evaluateMath(input.value, fallback)
            : parseFloat(input.value);
        if (isNaN(val)) val = fallback;

        var clamped = _clamp(val, min, max);
        if (input.value === '' || isNaN(val) || val !== clamped) {
            input.value = clamped;
        }

        return clamped;
    }

    function _applyDurationModeUI(mode) {
        TimerDefaults.applyDurationModeUI(_elements, mode);
    }

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     * @param {Object} state - App state reference
     */
    function init(elements, state) {
        _elements = elements;
        _state = state;

        _bindInputEvents();
        _bindDurationModeEvents();
        _bindTimeRowButtons();
        _bindPreviewControls();

        if (_state && _state.timer) {
            _state.timer.durationMode = _normalizeDurationMode(_state.timer.durationMode);
            _state.timer.format = _normalizeFormat(_state.timer.format);
            _applyDurationModeUI(_state.timer.durationMode);

            if (_elements.selectCountdownFormat) {
                _elements.selectCountdownFormat.value = _state.timer.format;
            }
            
            _updateFramesPreviewVisibility(_state.timer.format);
        }
    }

    /**
     * Bind time-row icon buttons to fetch time from timeline or focus inputs
     */
    function _bindTimeRowButtons() {
        var buttons = document.querySelectorAll('.time-icon-btn[data-time-focus]');
        if (!buttons || !buttons.forEach) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                var focusTarget = btn.getAttribute('data-time-focus');

                btn.classList.add('time-btn-capturing');
                setTimeout(function () {
                    btn.classList.remove('time-btn-capturing');
                }, 400);

                if (typeof Bridge !== 'undefined' && Bridge.getCompPlayheadInfo) {
                    Bridge.getCompPlayheadInfo(function (err, info) {
                        if (err || !info) {
                            console.error('Failed to get comp time', err);
                            if (typeof MessagesModule !== 'undefined') {
                                MessagesModule.showToast('Please open or select an active composition first', 'error');
                            }
                            _focusTimeInputs(focusTarget);
                            return;
                        }

                        var timeInSeconds = (typeof info.time === 'number') ? info.time : 0;
                        var fps = info.fps || 30;
                        if (_state && _state.timer) {
                            _state.timer.fps = fps;
                        }
                        var units = TimerDefaults.secondsToUnits(timeInSeconds, fps);

                        if (focusTarget === 'start') {
                            if (_elements.inputHours) _elements.inputHours.value = units.hours;
                            if (_elements.inputMins) _elements.inputMins.value = units.mins;
                            if (_elements.inputSecs) _elements.inputSecs.value = units.secs;
                            if (_elements.inputFrames) {
                                _elements.inputFrames.max = Math.max(1, Math.round(fps) - 1);
                                _elements.inputFrames.value = units.frames;
                            }
                        } else if (focusTarget === 'end') {
                            if (_elements.inputEndH) _elements.inputEndH.value = units.hours;
                            if (_elements.inputEndM) _elements.inputEndM.value = units.mins;
                            if (_elements.inputEndS) _elements.inputEndS.value = units.secs;
                            if (_elements.inputEndF) {
                                _elements.inputEndF.max = Math.max(1, Math.round(fps) - 1);
                                _elements.inputEndF.value = units.frames;
                            }
                        }

                        if (typeof MessagesModule !== 'undefined') {
                            var pad = TimerDefaults.pad2;
                            var formatted = pad(units.hours) + ':' + pad(units.mins) + ':' + pad(units.secs) + ':' + pad(units.frames);
                            var targetName = (focusTarget === 'start') ? 'Start time' : 'End time';
                            MessagesModule.showToast(targetName + ' captured from timeline (' + formatted + ')', 'success');
                        }

                        if (typeof updateDisplay === 'function') updateDisplay();
                    });
                } else {
                    _focusTimeInputs(focusTarget);
                }
            });
        });
    }

    function _focusTimeInputs(focusTarget) {
        if (focusTarget === 'start' && _elements.inputHours) {
            _elements.inputHours.focus();
            _elements.inputHours.select();
        } else if (focusTarget === 'end' && _elements.inputEndH) {
            _elements.inputEndH.focus();
            _elements.inputEndH.select();
        }
    }

    /**
     * Bind input event listeners
     */
    function _bindInputEvents() {
        // Start Time inputs
        if (_elements.inputHours) {
            _elements.inputHours.addEventListener('input', updateDisplay);
        }
        if (_elements.inputMins) {
            _elements.inputMins.addEventListener('input', updateDisplay);
        }
        if (_elements.inputSecs) {
            _elements.inputSecs.addEventListener('input', updateDisplay);
        }
        if (_elements.inputFrames) {
            _elements.inputFrames.addEventListener('input', updateDisplay);
        }

        // End Time inputs
        if (_elements.inputEndH) {
            _elements.inputEndH.addEventListener('input', updateDisplay);
        }
        if (_elements.inputEndM) {
            _elements.inputEndM.addEventListener('input', updateDisplay);
        }
        if (_elements.inputEndS) {
            _elements.inputEndS.addEventListener('input', updateDisplay);
        }
        if (_elements.inputEndF) {
            _elements.inputEndF.addEventListener('input', updateDisplay);
        }

        // Config inputs
        if (_elements.inputDuration) {
            _elements.inputDuration.addEventListener('input', function () {
                if (!_state || !_state.timer) return;
                _state.timer.duration = _sanitizeFloatInput(_elements.inputDuration, 0.1, 864000, _state.timer.duration || 10);
            });
        }

        if (_elements.inputStartAt) {
            _elements.inputStartAt.addEventListener('input', function () {
                if (!_state || !_state.timer) return;
                _state.timer.startAt = _sanitizeFloatInput(_elements.inputStartAt, 0, 864000, _state.timer.startAt || 0);
            });
        }

        if (_elements.selectCountdownFormat) {
            _elements.selectCountdownFormat.addEventListener('change', function () {
                if (!_state || !_state.timer) return;
                var format = _normalizeFormat(this.value);
                if (this.value !== format) this.value = format;
                _state.timer.format = format;
                _updateFramesPreviewVisibility(format);
                updateDisplay();
            });
        }

        if (_elements.timerToggleMonospaceBtn) {
            _elements.timerToggleMonospaceBtn.addEventListener('click', function () {
                if (!_state || !_state.timer) return;
                _state.timer.monospace = !_state.timer.monospace;
                this.classList.toggle('active', _state.timer.monospace);
            });
        }
    }

    /**
     * Bind duration mode events
     */
    function _bindDurationModeEvents() {
        if (!_elements.durationModeIcons || _elements.durationModeIcons.length === 0) {
            _elements.durationModeIcons = document.querySelectorAll('.mode-icon-btn-compact');
        }

        if (!_elements.durationModeIcons || !_elements.durationModeIcons.forEach) {
            return;
        }

        _elements.durationModeIcons.forEach(function (btn) {
            var radio = btn.querySelector('input[type="radio"]');
            if (!radio) return;

            radio.addEventListener('change', function () {
                if (!radio.checked) return;
                var mode = _normalizeDurationMode(radio.value);
                _state.timer.durationMode = mode;
                _applyDurationModeUI(mode);
            });

            btn.addEventListener('click', function () {
                radio.checked = true;
                var mode = _normalizeDurationMode(radio.value);
                _state.timer.durationMode = mode;
                _applyDurationModeUI(mode);
            });
        });

        var initialMode = 'manual';
        _elements.durationModeIcons.forEach(function (btn) {
            var radio = btn.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                initialMode = _normalizeDurationMode(radio.value);
            }
        });

        _state.timer.durationMode = initialMode;
        _applyDurationModeUI(initialMode);
    }

    function _bindPreviewControls() {
        if (_elements.previewPlayBtn) {
            _elements.previewPlayBtn.addEventListener('click', function(e) {
                e.preventDefault();
                startPreview();
            });
        }
        if (_elements.previewStopBtn) {
            _elements.previewStopBtn.addEventListener('click', function(e) {
                e.preventDefault();
                stopPreview();
            });
        }
        if (_elements.previewResetBtn) {
            _elements.previewResetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                resetPreview();
            });
        }
    }

    function startPreview() {
        if (_isPreviewPlaying) return;
        var settings = getSettings();
        if (settings.durationMode !== 'manual') return; // Preview only makes sense for manual duration currently
        
        _isPreviewPlaying = true;
        _previewStartTime = performance.now();
        
        if (_elements.previewPlayBtn) {
            _elements.previewPlayBtn.classList.add('active');
            _elements.previewPlayBtn.style.display = 'none';
        }
        if (_elements.previewStopBtn) {
            _elements.previewStopBtn.classList.remove('active');
            _elements.previewStopBtn.style.display = '';
        }
        
        _previewLoop();
    }
    
    function stopPreview() {
        _isPreviewPlaying = false;
        if (_previewRequest) cancelAnimationFrame(_previewRequest);
        
        if (_elements.previewPlayBtn) {
            _elements.previewPlayBtn.classList.remove('active');
            _elements.previewPlayBtn.style.display = '';
        }
        if (_elements.previewStopBtn) {
            _elements.previewStopBtn.classList.add('active');
            _elements.previewStopBtn.style.display = 'none';
        }
    }
    
    function resetPreview() {
        stopPreview();
        if (_elements.previewPlayBtn) _elements.previewPlayBtn.style.display = '';
        if (_elements.previewStopBtn) {
            _elements.previewStopBtn.classList.remove('active');
            _elements.previewStopBtn.style.display = 'none';
        }
        updateDisplay();
    }
    
    function _previewLoop() {
        if (!_isPreviewPlaying) return;
        
        var now = performance.now();
        var elapsed = (now - _previewStartTime) / 1000;
        
        var settings = getSettings();
        var totalDuration = Math.max(0.05, settings.duration);
        
        if (elapsed >= totalDuration) {
            stopPreview();
            _renderTime(settings.end); // Ensure it lands exactly on end time
            return;
        }
        
        // Evaluate easing for preview
        var progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);
        var easedProgress = (typeof EasingRuntime !== 'undefined')
            ? EasingRuntime.evaluateSettings(settings, progress)
            : progress;
        var currentSeconds = settings.start + (settings.end - settings.start) * easedProgress;
        
        _renderTime(currentSeconds);
        
        _previewRequest = requestAnimationFrame(_previewLoop);
    }
    
    function _renderTime(totalSeconds) {
        if (!_elements || !_state || !_state.timer) return;
        
        var format = _state.timer.format || 'hmsf';
        var fps = _state.timer.fps || 30;
        var displayStr = TimerDefaults.formatDisplayTime(totalSeconds, format, fps);
        
        var isNeg = totalSeconds < 0;
        var absVal = Math.abs(totalSeconds);
        var absSec = Math.floor(absVal);
        var frac = absVal - absSec;
        var f = Math.round(frac * fps);
        if (f >= fps) {
            f = 0;
            absSec += 1;
        }
        var h = Math.floor(absSec / 3600);
        var m = Math.floor((absSec % 3600) / 60);
        var s = absSec % 60;
        
        var isZero = (h === 0 && m === 0 && s === 0 && (format.indexOf('f') === -1 || f === 0));
        var showSign = isNeg && !isZero;

        var timerSignEl = (_elements && _elements.timerSign) || document.getElementById('timer-sign');
        if (timerSignEl) {
            timerSignEl.style.display = showSign ? 'inline-block' : 'none';
        }

        if (_elements.timerH) _elements.timerH.textContent = TimerDefaults.pad2(h);
        if (_elements.timerM) _elements.timerM.textContent = TimerDefaults.pad2(m);
        if (_elements.timerS) _elements.timerS.textContent = TimerDefaults.pad2(s);
        if (_elements.timerF) _elements.timerF.textContent = TimerDefaults.pad2(f);
        
        // If there's a single preview text element
        if (_elements.timerPreviewText) {
            _elements.timerPreviewText.textContent = displayStr;
        }
    }

    function getSettings() {
        if (!_state || !_state.timer) return TimerDefaults.validateSettings({});
        var fps = _state.timer.fps || 30;
        
        var startSecs = TimerDefaults.unitsToSeconds(_state.timer.hours, _state.timer.mins, _state.timer.secs, _state.timer.frames, fps);
        var endSecs = TimerDefaults.unitsToSeconds(_state.timer.endHours, _state.timer.endMins, _state.timer.endSecs, _state.timer.endFrames, fps);
        
        var settings = {
            counterType: 'timer',
            start: startSecs,
            end: endSecs,
            durationMode: _state.timer.durationMode,
            duration: _state.timer.duration,
            startAt: _state.timer.startAt,
            format: _state.timer.format,
            monospace: _state.timer.monospace,
            easing: _state.timer.easing || 'linear',
            easingConfig: _state.timer.easingConfig || { mode: 'single', singleCurveId: 'linear' },
            curveLibrary: _state.timer.curveLibrary || [],
            fps: fps
        };
        
        return TimerDefaults.validateSettings(settings);
    }

    /**
     * Update timer display and keep state in sync with sanitized values
     */
    function updateDisplay() {
        if (!_elements || !_state || !_state.timer) return;

        var fps = _state.timer.fps || 30;
        var maxFrames = Math.max(1, Math.round(fps) - 1);

        var startHours = _elements.inputHours
            ? _sanitizeIntInput(_elements.inputHours, 0, 99, _state.timer.hours || 0)
            : (_state.timer.hours || 0);
        var startMins = _elements.inputMins
            ? _sanitizeIntInput(_elements.inputMins, 0, 59, _state.timer.mins || 0)
            : (_state.timer.mins || 0);
        var startSecs = _elements.inputSecs
            ? _sanitizeIntInput(_elements.inputSecs, 0, 59, _state.timer.secs || 0)
            : (_state.timer.secs || 0);
        var startFrames = _elements.inputFrames
            ? _sanitizeIntInput(_elements.inputFrames, 0, maxFrames, _state.timer.frames || 0)
            : (_state.timer.frames || 0);

        var endHours = _elements.inputEndH
            ? _sanitizeIntInput(_elements.inputEndH, 0, 99, _state.timer.endHours || 0)
            : (_state.timer.endHours || 0);
        var endMins = _elements.inputEndM
            ? _sanitizeIntInput(_elements.inputEndM, 0, 59, _state.timer.endMins || 0)
            : (_state.timer.endMins || 0);
        var endSecs = _elements.inputEndS
            ? _sanitizeIntInput(_elements.inputEndS, 0, 59, _state.timer.endSecs || 0)
            : (_state.timer.endSecs || 0);
        var endFrames = _elements.inputEndF
            ? _sanitizeIntInput(_elements.inputEndF, 0, maxFrames, _state.timer.endFrames || 0)
            : (_state.timer.endFrames || 0);

        if (!_isPreviewPlaying) {
            var timerSignEl = (_elements && _elements.timerSign) || document.getElementById('timer-sign');
            if (timerSignEl) {
                timerSignEl.style.display = 'none';
            }
            if (_elements.timerH) _elements.timerH.textContent = TimerDefaults.pad2(startHours);
            if (_elements.timerM) _elements.timerM.textContent = TimerDefaults.pad2(startMins);
            if (_elements.timerS) _elements.timerS.textContent = TimerDefaults.pad2(startSecs);
            if (_elements.timerF) _elements.timerF.textContent = TimerDefaults.pad2(startFrames);
        }

        _state.timer.hours = startHours;
        _state.timer.mins = startMins;
        _state.timer.secs = startSecs;
        _state.timer.frames = startFrames;

        _state.timer.endHours = endHours;
        _state.timer.endMins = endMins;
        _state.timer.endSecs = endSecs;
        _state.timer.endFrames = endFrames;

        if (_elements.inputDuration) {
            _state.timer.duration = _sanitizeFloatInput(_elements.inputDuration, 0.1, 864000, _state.timer.duration || 10);
        }

        if (_elements.inputStartAt) {
            _state.timer.startAt = _sanitizeFloatInput(_elements.inputStartAt, 0, 864000, _state.timer.startAt || 0);
        }

        if (_elements.selectCountdownFormat) {
            var format = _normalizeFormat(_elements.selectCountdownFormat.value);
            if (_elements.selectCountdownFormat.value !== format) {
                _elements.selectCountdownFormat.value = format;
            }
            _state.timer.format = format;
            _updateFramesPreviewVisibility(format);
        }

        if (_elements.timerToggleMonospaceBtn) {
            _elements.timerToggleMonospaceBtn.classList.toggle('active', !!_state.timer.monospace);
        }

        _state.timer.durationMode = _normalizeDurationMode(_state.timer.durationMode);
        _applyDurationModeUI(_state.timer.durationMode);
    }

    /**
     * Show or hide frames preview display based on format
     */
    function _updateFramesPreviewVisibility(format) {
        var showFrames = (format === 'hmsf' || format === 'msf' || format === 'sf');
        if (_elements.timerF) _elements.timerF.style.display = showFrames ? '' : 'none';
        if (_elements.timerSepF) _elements.timerSepF.style.display = showFrames ? '' : 'none';
    }

    // Public API
    return {
        init: init,
        updateDisplay: updateDisplay,
        getSettings: getSettings
    };
})();
