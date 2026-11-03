/**
 * NOMRO - Preset View
 * Separation of Concerns: DOM manipulation only
 * @module views/PresetView
 */
var PresetView = (function () {
    'use strict';

    /**
     * DOM elements cache
     * @private
     */
    var _elements = null;

    /**
     * Initialize DOM element references
     * @private
     */
    function _initElements() {
        if (!_elements) {
            _elements = {
                container: document.getElementById('presets-container') || document.getElementById('panel-presets'),
                list: document.getElementById('presets-list'),
                saveBtn: document.getElementById('btn-save-preset'),
                nameInput: document.getElementById('input-preset-name')
            };
        }
    }

    /**
     * Render presets list
     * @param {Array} presets - Array of preset objects
     */
    function render(presets) {
        _initElements();

        if (!_elements.list) return;

        // Clear list
        _elements.list.innerHTML = '';

        if (presets.length === 0) {
            _elements.list.innerHTML = '<div class="preset-empty-compact">No saved presets</div>';
            return;
        }

        // Render each preset
        for (var i = 0; i < presets.length; i++) {
            var preset = presets[i];
            var item = document.createElement('div');
            item.className = 'preset-item-compact';
            item.setAttribute('data-id', preset.id);

            item.innerHTML =
                '<div class="preset-icon-compact"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>' +
                '<div class="preset-content-compact">' +
                '<span class="preset-name-compact">' + _escapeHtml(preset.name) + '</span>' +
                '</div>' +
                '<div class="preset-actions-compact">' +
                '<button class="preset-btn-compact preset-btn--load" title="Load Preset (تحميل القالب)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>' +
                '<button class="preset-btn-compact preset-btn--delete" title="Delete Preset (حذف القالب)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
                '</div>';

            _elements.list.appendChild(item);
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function _escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Bind event listeners
     * @param {Object} callbacks - Event callbacks
     */
    function bindEvents(callbacks) {
        _initElements();

        // Save button
        if (_elements.saveBtn && callbacks.onSave) {
            _elements.saveBtn.addEventListener('click', function () {
                var name = _elements.nameInput ? _elements.nameInput.value.trim() : '';
                if (name) {
                    callbacks.onSave(name);
                    if (_elements.nameInput) {
                        _elements.nameInput.value = '';
                    }
                }
            });
        }

        // List delegation for load/delete
        if (_elements.list) {
            _elements.list.addEventListener('click', function (e) {
                var target = e.target;
                // Handle click on SVG or button
                var loadBtn = target.closest('.preset-btn--load');
                var deleteBtn = target.closest('.preset-btn--delete');
                var item = target.closest('.preset-item-compact');
                if (!item) return;

                var id = item.getAttribute('data-id');

                if (loadBtn && callbacks.onLoad) {
                    callbacks.onLoad(id);
                }

                if (deleteBtn && callbacks.onDelete) {
                    callbacks.onDelete(id);
                }
            });
        }
    }

    /**
     * Show/hide presets container
     * @param {boolean} visible - Visibility state
     */
    function setVisible(visible) {
        _initElements();
        if (_elements.container) {
            _elements.container.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Public API
     */
    return {
        render: render,
        bindEvents: bindEvents,
        setVisible: setVisible
    };
})();
