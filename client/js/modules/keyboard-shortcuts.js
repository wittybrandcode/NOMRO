/**
 * NOMRO - Keyboard Shortcuts Module
 * Enhanced keyboard shortcuts with styled help modal
 * @module modules/keyboard-shortcuts
 */
var KeyboardShortcuts = (function () {
    'use strict';

    var _callbacks = {};
    var _isEnabled = true;
    var _activeModal = null;

    /**
     * Available shortcuts
     * @private
     */
    var _shortcuts = {
        // Tab switching
        '1': { action: 'switchTab', param: 'counter', desc: 'فتح تبويب Counter' },
        '2': { action: 'switchTab', param: 'timer', desc: 'فتح تبويب Timer' },
        '3': { action: 'switchTab', param: 'presets', desc: 'فتح تبويب Presets' },
        '4': { action: 'switchTab', param: 'nodes', desc: 'فتح تبويب Markers' },

        // Preview controls
        ' ': { action: 'playPreview', desc: 'تشغيل المعاينة' },
        'Escape': { action: 'stopPreview', desc: 'إيقاف المعاينة' },

        // Create/Update
        'Enter': { action: 'create', modifiers: ['ctrl'], desc: 'إنشاء أو تحديث العنصر الحالي' },

        // Reset
        'r': { action: 'reset', modifiers: ['ctrl'], desc: 'إعادة ضبط القيم' },

        // Help
        '?': { action: 'showHelp', desc: 'عرض نافذة الاختصارات' }
    };

    /**
     * Initialize keyboard shortcuts
     * @param {Object} callbacks - { onSwitchTab, onPlayPreview, onStopPreview, onCreate, onReset, onShowHelp }
     */
    function init(callbacks) {
        _callbacks = callbacks || {};

        document.addEventListener('keydown', _handleKeydown);
        if (typeof Logger !== 'undefined') {
            Logger.log('Shortcuts', 'Initialized');
        }
    }

    /**
     * Handle keydown event
     * @param {KeyboardEvent} e
     */
    function _handleKeydown(e) {
        // Skip if disabled or in text input field (unless invoking Ctrl+Enter / Cmd+Enter to create)
        if (!_isEnabled) return;
        var tag = e.target.tagName;
        var isInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
        var isCtrlEnter = isInput && e.key === 'Enter' && (e.ctrlKey || e.metaKey);

        if (isInput && !isCtrlEnter) return;

        // If a button is focused, allow global shortcuts (1, 2, 3, Ctrl+Enter, ?) but allow native Space click
        if (tag === 'BUTTON' && e.key === ' ') return;

        var key = e.key;
        var shortcut = _shortcuts[key];

        if (!shortcut) return;

        // Check modifiers
        if (shortcut.modifiers) {
            var hasCtrl = shortcut.modifiers.indexOf('ctrl') !== -1;
            var hasShift = shortcut.modifiers.indexOf('shift') !== -1;
            var hasAlt = shortcut.modifiers.indexOf('alt') !== -1;

            if (hasCtrl && !e.ctrlKey && !e.metaKey) return;
            if (hasShift && !e.shiftKey) return;
            if (hasAlt && !e.altKey) return;
        } else {
            // If no modifiers required, skip if modifiers are pressed
            if (e.ctrlKey || e.metaKey || e.altKey) return;
        }

        // Execute action
        e.preventDefault();
        _executeAction(shortcut.action, shortcut.param);
    }

    /**
     * Execute action
     * @param {string} action
     * @param {*} param
     */
    function _executeAction(action, param) {
        switch (action) {
            case 'switchTab':
                if (_callbacks.onSwitchTab) _callbacks.onSwitchTab(param);
                break;
            case 'playPreview':
                if (_callbacks.onPlayPreview) _callbacks.onPlayPreview();
                break;
            case 'stopPreview':
                if (_callbacks.onStopPreview) _callbacks.onStopPreview();
                break;
            case 'create':
                if (_callbacks.onCreate) _callbacks.onCreate();
                break;
            case 'reset':
                if (_callbacks.onReset) _callbacks.onReset();
                break;
            case 'showHelp':
                if (_callbacks.onShowHelp) _callbacks.onShowHelp();
                else showHelp();
                break;
        }
    }

    function _getKeyLabel(key, shortcut) {
        var keyDisplay = key === ' ' ? 'Space' : key;

        if (shortcut.modifiers && shortcut.modifiers.length > 0) {
            keyDisplay = shortcut.modifiers.map(function (m) {
                if (m === 'ctrl') return 'Ctrl';
                if (m === 'shift') return 'Shift';
                if (m === 'alt') return 'Alt';
                return m;
            }).join(' + ') + ' + ' + keyDisplay;
        }

        return keyDisplay;
    }

    function _closeHelpModal() {
        if (_activeModal) {
            document.removeEventListener('keydown', _handleModalKeydown);
            _activeModal.remove();
            _activeModal = null;
        }
    }

    function _handleModalKeydown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            _closeHelpModal();
        }
    }

    /**
     * Show help dialog with all shortcuts
     */
    function showHelp() {
        _closeHelpModal();

        var modal = document.createElement('div');
        modal.className = 'shortcuts-modal';

        var dialog = document.createElement('div');
        dialog.className = 'shortcuts-dialog';
        dialog.setAttribute('dir', 'rtl');

        var title = document.createElement('h3');
        title.className = 'shortcuts-title';
        title.textContent = 'اختصارات لوحة المفاتيح';

        var subtitle = document.createElement('p');
        subtitle.className = 'shortcuts-subtitle';
        subtitle.textContent = 'استخدم هذه الاختصارات لتسريع العمل داخل اللوحة.';

        var list = document.createElement('div');
        list.className = 'shortcuts-list';

        Object.keys(_shortcuts).forEach(function (key) {
            var shortcut = _shortcuts[key];
            var row = document.createElement('div');
            row.className = 'shortcuts-row';

            var desc = document.createElement('span');
            desc.className = 'shortcuts-desc';
            desc.textContent = shortcut.desc;

            var kbd = document.createElement('kbd');
            kbd.className = 'shortcuts-kbd';
            kbd.textContent = _getKeyLabel(key, shortcut);

            row.appendChild(desc);
            row.appendChild(kbd);
            list.appendChild(row);
        });

        var closeBtn = document.createElement('button');
        closeBtn.className = 'btn-primary shortcuts-close-btn';
        closeBtn.type = 'button';
        closeBtn.textContent = 'إغلاق';
        closeBtn.addEventListener('click', _closeHelpModal);

        dialog.appendChild(title);
        dialog.appendChild(subtitle);
        dialog.appendChild(list);
        dialog.appendChild(closeBtn);

        modal.appendChild(dialog);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                _closeHelpModal();
            }
        });

        document.body.appendChild(modal);
        document.addEventListener('keydown', _handleModalKeydown);
        _activeModal = modal;
    }

    /**
     * Enable/disable shortcuts
     * @param {boolean} enabled
     */
    function setEnabled(enabled) {
        _isEnabled = enabled;
    }

    /**
     * Get all shortcuts for display
     * @returns {Object}
     */
    function getShortcuts() {
        return _shortcuts;
    }

    // Public API
    return {
        init: init,
        showHelp: showHelp,
        setEnabled: setEnabled,
        getShortcuts: getShortcuts
    };
})();
