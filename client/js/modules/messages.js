/**
 * NOMRO - Messages Module
 * Handles error, success, and toast messages
 * @module modules/messages
 */
var MessagesModule = (function () {
    'use strict';

    var _elements = null;

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     */
    function init(elements) {
        _elements = elements;
    }

    /**
     * Show error message
     * @param {string} message - Error text
     */
    function showError(message) {
        if (_elements.errorMessage && _elements.errorText) {
            _elements.errorText.textContent = message;
            _elements.errorMessage.style.display = 'flex';
            setTimeout(function () {
                _elements.errorMessage.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Show success message
     * @param {string} message - Success text
     */
    function showSuccess(message) {
        if (_elements.successMessage && _elements.successText) {
            _elements.successText.textContent = message;
            _elements.successMessage.style.display = 'flex';
            setTimeout(function () {
                _elements.successMessage.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast text
     * @param {string} type - 'success' or 'error'
     */
    function showToast(message, type) {
        if (!_elements.toastContainer) return;

        var toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'success');

        var iconHTML = (type === 'error')
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';

        toast.insertAdjacentHTML('beforeend', iconHTML);

        var label = document.createElement('span');
        label.textContent = message || '';
        toast.appendChild(label);

        var maxToasts = 3;
        while (_elements.toastContainer.children.length >= maxToasts) {
            _elements.toastContainer.removeChild(_elements.toastContainer.firstChild);
        }

        _elements.toastContainer.appendChild(toast);

        setTimeout(function () {
            toast.remove();
        }, 3000);
    }

    // Public API
    return {
        init: init,
        showError: showError,
        showSuccess: showSuccess,
        showToast: showToast
    };
})();

