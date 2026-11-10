/**
 * NOMRO - Validator Service (Enhanced)
 * Provides real-time validation with visual feedback
 * @module services/Validator
 */
var Validator = (function () {
    'use strict';

    var _limits = {
        // Keep values inside JS safe-integer range while allowing very large counters.
        largeNumber: 9007199254740991
    };

    function _getTimerLimits() {
        if (typeof TimerDefaults !== 'undefined' && TimerDefaults.LIMITS) {
            return TimerDefaults.LIMITS;
        }
        return {
            HOURS: { min: 0, max: 99 },
            MINS: { min: 0, max: 59 },
            SECS: { min: 0, max: 59 },
            FRAMES: { min: 0, max: 99 },
            DURATION: { min: 0.1, max: 864000 },
            START_AT: { min: 0, max: 864000 }
        };
    }

    var _rules = {
        start: { min: -_limits.largeNumber, max: _limits.largeNumber, required: true },
        end: { min: -_limits.largeNumber, max: _limits.largeNumber, required: true },
        counterDuration: { min: 0.01, max: 86400, required: true },

        get hours() { return { min: _getTimerLimits().HOURS.min, max: _getTimerLimits().HOURS.max, required: false }; },
        get mins() { return { min: _getTimerLimits().MINS.min, max: _getTimerLimits().MINS.max, required: false }; },
        get secs() { return { min: _getTimerLimits().SECS.min, max: _getTimerLimits().SECS.max, required: false }; },
        get frames() { return { min: _getTimerLimits().FRAMES.min, max: _getTimerLimits().FRAMES.max, required: false }; },
        get timerDuration() { return { min: _getTimerLimits().DURATION.min, max: _getTimerLimits().DURATION.max, required: true }; },
        get startAt() { return { min: _getTimerLimits().START_AT.min, max: _getTimerLimits().START_AT.max, required: false }; }
    };

    var _messages = {
        required: 'This field is required',
        min: 'Value must be greater than or equal to {min}',
        max: 'Value must be less than or equal to {max}',
        sameValue: 'Start and end cannot be the same for basic counter',
        invalidNumber: 'Enter a valid number'
    };

    var _cssClasses = {
        invalid: 'input-invalid',
        valid: 'input-valid',
        errorMessage: 'validation-error'
    };

    function _toArray(value) {
        if (!value) return [];
        if (Object.prototype.toString.call(value) === '[object Array]') return value;
        return [value];
    }

    function _isManualTimerMode() {
        var checked = document.querySelector('input[name="duration-mode"]:checked');
        if (!checked) return true;
        return checked.value === 'manual';
    }

    /**
     * Validate a single number value
     * @param {*} value - Value to validate
     * @param {Object} rule - Validation rule
     * @returns {string|null} Error message or null
     */
    function validateNumber(value, rule) {
        if (!rule) return null;

        var num = parseFloat(value);

        // Required check
        if (rule.required && (value === '' || value === null || value === undefined)) {
            return _messages.required;
        }

        // NaN check
        if (value !== '' && value !== null && value !== undefined && isNaN(num)) {
            return _messages.invalidNumber;
        }

        // Optional empty value is allowed
        if (!rule.required && (value === '' || value === null || value === undefined)) {
            return null;
        }

        // Min check
        if (rule.min !== undefined && num < rule.min) {
            return _messages.min.replace('{min}', rule.min);
        }

        // Max check
        if (rule.max !== undefined && num > rule.max) {
            return _messages.max.replace('{max}', rule.max);
        }

        return null;
    }

    /**
     * Validate nodes sequence settings
     * @param {Object} settings - Nodes settings with sequence
     * @returns {Array} Array of error objects [{field, message}]
     */
    function validateNodes(settings) {
        var errors = [];
        if (!settings) {
            errors.push({ field: 'nodes', message: 'Settings payload is missing' });
            return errors;
        }

        var seq = settings.nodes || [];
        if (!Array.isArray(seq) || seq.length < 2) {
            errors.push({ field: 'nodes', message: 'At least 2 waypoint nodes are required' });
            return errors;
        }

        var lastTime = -1;
        for (var i = 0; i < seq.length; i++) {
            var n = seq[i];
            if (!n) {
                errors.push({ field: 'node_' + i, message: 'Invalid node object' });
                continue;
            }
            var t = parseFloat(n.time);
            if (isNaN(t) || t < 0) {
                errors.push({ field: 'node_' + i + '_time', message: 'Node time must be a non-negative number' });
            } else if (t < lastTime) {
                errors.push({ field: 'node_' + i + '_time', message: 'Nodes must be ordered chronologically' });
            }
            lastTime = Math.max(lastTime, isNaN(t) ? 0 : t);

            if (n.hold !== undefined && n.hold !== null && n.hold !== '') {
                var h = parseFloat(n.hold);
                if (isNaN(h) || h < 0) {
                    errors.push({ field: 'node_' + i + '_hold', message: 'Hold duration must be non-negative' });
                }
            }

            if (n.value === undefined || n.value === null || String(n.value).trim() === '') {
                errors.push({ field: 'node_' + i + '_value', message: 'Node value cannot be empty' });
            }
        }

        return errors;
    }

    /**
     * Validate all counter settings
     * @param {Object} settings - Counter settings
     * @returns {Array} Array of error objects [{field, message}]
     */
    function validate(settings) {
        if (!settings) return [{ field: 'settings', message: 'Settings missing' }];

        if (settings.counterType === 'nodes') {
            return validateNodes(settings);
        }

        var errors = [];
        var error;

        // Validate start
        error = validateNumber(settings.start, _rules.start);
        if (error) {
            errors.push({ field: 'start', message: error });
        }

        // Validate end
        error = validateNumber(settings.end, _rules.end);
        if (error) {
            errors.push({ field: 'end', message: error });
        }

        // Validate duration based on counterType
        var isTimer = (settings && settings.counterType === 'timer');
        var durationRule = isTimer ? _rules.timerDuration : _rules.counterDuration;
        error = validateNumber(settings.duration, durationRule);
        if (error) {
            errors.push({ field: 'duration', message: error });
        }

        // Check start !== end for basic counter
        if (settings && settings.counterType === 'basic') {
            if (parseFloat(settings.start) === parseFloat(settings.end)) {
                errors.push({ field: 'end', message: _messages.sameValue });
            }
        }

        return errors;
    }

    /**
     * Check if settings are valid
     * @param {Object} settings - Counter settings
     * @returns {boolean} True if valid
     */
    function isValid(settings) {
        return validate(settings).length === 0;
    }

    /**
     * Get first error message
     * @param {Object} settings - Counter settings
     * @returns {string|null} First error message or null
     */
    function getFirstError(settings) {
        var errors = validate(settings);
        if (errors.length > 0) {
            return errors[0].message;
        }
        return null;
    }

    /**
     * Show visual error on input
     * @param {HTMLElement} input - Input element
     * @param {string} message - Error message
     */
    function showError(input, message) {
        if (!input || !input.parentElement) return;

        input.classList.add(_cssClasses.invalid);
        input.classList.remove(_cssClasses.valid);

        // Remove existing error message
        var existingError = input.parentElement.querySelector('.' + _cssClasses.errorMessage);
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        if (message) {
            var errorSpan = document.createElement('span');
            errorSpan.className = _cssClasses.errorMessage;
            errorSpan.textContent = message;
            input.parentElement.appendChild(errorSpan);
        }
    }

    /**
     * Clear visual error from input
     * @param {HTMLElement} input - Input element
     */
    function clearError(input) {
        if (!input || !input.parentElement) return;

        input.classList.remove(_cssClasses.invalid);
        input.classList.add(_cssClasses.valid);

        var existingError = input.parentElement.querySelector('.' + _cssClasses.errorMessage);
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Validate input in real-time
     * @param {HTMLElement} input - Input element
     * @param {string} ruleKey - Key from _rules
     * @returns {boolean} True if valid
     */
    function validateInput(input, ruleKey) {
        if (!input || !_rules[ruleKey]) return true;

        var error = validateNumber(input.value, _rules[ruleKey]);
        if (error) {
            showError(input, error);
            return false;
        }

        clearError(input);
        return true;
    }

    /**
     * Attach real-time validation to input
     * @param {HTMLElement} input - Input element
     * @param {string} ruleKey - Key from _rules
     * @param {Function} onValidate - Callback (isValid) => void
     */
    function attachRealtime(input, ruleKey, onValidate) {
        if (!input) return;

        input.addEventListener('input', function () {
            var isInputValid = validateInput(input, ruleKey);
            if (onValidate) onValidate(isInputValid);
        });

        input.addEventListener('blur', function () {
            var isInputValid = validateInput(input, ruleKey);
            if (onValidate) onValidate(isInputValid);
        });
    }

    /**
     * Update Create button state based on validity
     * @param {HTMLElement|Array} button - Create button(s)
     * @param {boolean} isAllValid - Whether settings are valid
     */
    function updateButtonState(button, isAllValid) {
        var buttons = _toArray(button);

        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            if (!btn) continue;

            if (isAllValid) {
                btn.disabled = false;
                btn.classList.remove('btn-disabled');
            } else {
                btn.disabled = true;
                btn.classList.add('btn-disabled');
            }
        }
    }

    /**
     * Initialize real-time validation for counter + timer inputs
     * @param {Object} elements - DOM elements cache
     * @param {HTMLElement|Array} createButton - Legacy/fallback create button(s)
     */
    function initRealtimeValidation(elements, createButton) {
        var counterValid = {
            start: true,
            end: true,
            duration: true
        };

        var timerValid = {
            hours: true,
            mins: true,
            secs: true,
            frames: true,
            endHours: true,
            endMins: true,
            endSecs: true,
            endFrames: true,
            duration: true,
            startAt: true
        };

        var counterButtons = [];
        var timerButtons = [];
        var fallbackButtons = [];

        if (elements && elements.btnCreateCounter) {
            counterButtons.push(elements.btnCreateCounter);
        }
        if (elements && elements.btnCreateTimer) {
            timerButtons.push(elements.btnCreateTimer);
        }

        if (counterButtons.length === 0 && timerButtons.length === 0) {
            fallbackButtons = _toArray(createButton);
            if (fallbackButtons.length === 0 && elements && elements.btnCreate) {
                fallbackButtons.push(elements.btnCreate);
            }
        }

        function checkAllValid() {
            var counterAllValid = counterValid.start && counterValid.end && counterValid.duration;

            var timerDurationValid = _isManualTimerMode() ? timerValid.duration : true;
            var timerAllValid = timerValid.hours && timerValid.mins && timerValid.secs && timerValid.frames &&
                timerValid.endHours && timerValid.endMins && timerValid.endSecs && timerValid.endFrames &&
                timerDurationValid && timerValid.startAt;

            if (!_isManualTimerMode() && elements && elements.inputDuration) {
                clearError(elements.inputDuration);
            }

            if (counterButtons.length > 0) {
                updateButtonState(counterButtons, counterAllValid);
            }
            if (timerButtons.length > 0) {
                updateButtonState(timerButtons, timerAllValid);
            }

            if (fallbackButtons.length > 0) {
                var currentTab = (window.NOMRO_App && window.NOMRO_App.currentTab)
                    ? window.NOMRO_App.currentTab
                    : 'counter';
                updateButtonState(fallbackButtons, currentTab === 'timer' ? timerAllValid : counterAllValid);
            }
        }

        // Counter inputs
        if (elements.startValue) {
            attachRealtime(elements.startValue, 'start', function (valid) {
                counterValid.start = valid;
                checkAllValid();
            });
        }

        if (elements.endValue) {
            attachRealtime(elements.endValue, 'end', function (valid) {
                counterValid.end = valid;
                checkAllValid();
            });
        }

        if (elements.durationValue) {
            attachRealtime(elements.durationValue, 'counterDuration', function (valid) {
                counterValid.duration = valid;
                checkAllValid();
            });
        }

        // Timer start fields
        if (elements.inputHours) {
            attachRealtime(elements.inputHours, 'hours', function (valid) {
                timerValid.hours = valid;
                checkAllValid();
            });
        }

        if (elements.inputMins) {
            attachRealtime(elements.inputMins, 'mins', function (valid) {
                timerValid.mins = valid;
                checkAllValid();
            });
        }

        if (elements.inputSecs) {
            attachRealtime(elements.inputSecs, 'secs', function (valid) {
                timerValid.secs = valid;
                checkAllValid();
            });
        }

        if (elements.inputFrames) {
            attachRealtime(elements.inputFrames, 'frames', function (valid) {
                timerValid.frames = valid;
                checkAllValid();
            });
        }

        // Timer end fields
        if (elements.inputEndH) {
            attachRealtime(elements.inputEndH, 'hours', function (valid) {
                timerValid.endHours = valid;
                checkAllValid();
            });
        }

        if (elements.inputEndM) {
            attachRealtime(elements.inputEndM, 'mins', function (valid) {
                timerValid.endMins = valid;
                checkAllValid();
            });
        }

        if (elements.inputEndS) {
            attachRealtime(elements.inputEndS, 'secs', function (valid) {
                timerValid.endSecs = valid;
                checkAllValid();
            });
        }

        if (elements.inputEndF) {
            attachRealtime(elements.inputEndF, 'frames', function (valid) {
                timerValid.endFrames = valid;
                checkAllValid();
            });
        }

        // Timer config fields
        if (elements.inputDuration) {
            attachRealtime(elements.inputDuration, 'timerDuration', function (valid) {
                timerValid.duration = valid;
                checkAllValid();
            });
        }

        if (elements.inputStartAt) {
            attachRealtime(elements.inputStartAt, 'startAt', function (valid) {
                timerValid.startAt = valid;
                checkAllValid();
            });
        }

        // Re-check when duration mode changes (manual/non-manual)
        document.querySelectorAll('input[name="duration-mode"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                checkAllValid();
            });
        });

        // Initial state
        checkAllValid();
    }

    return {
        validate: validate,
        validateNodes: validateNodes,
        isValid: isValid,
        getFirstError: getFirstError,
        validateNumber: validateNumber,
        showError: showError,
        clearError: clearError,
        validateInput: validateInput,
        attachRealtime: attachRealtime,
        updateButtonState: updateButtonState,
        initRealtimeValidation: initRealtimeValidation
    };
})();
