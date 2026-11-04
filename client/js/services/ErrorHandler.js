/**
 * NOMRO - Error Handler Service
 * Unified error handling
 * @module services/error-handler
 */
var ErrorHandler = (function () {
    'use strict';

    var _errors = [];
    var _callbacks = {};

    /**
     * Initialize error handler
     * @param {Object} callbacks - { onShowError, onShowToast }
     */
    function init(callbacks) {
        _callbacks = callbacks || {};
    }

    /**
     * Normalize any error input to a readable message
     * @param {Error|Object|string} error
     * @returns {string}
     */
    function _normalizeMessage(error) {
        if (!error) return 'Unknown error';
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        if (error.error) return error.error;
        return String(error);
    }

    /**
     * Handle error
     * @param {Error|Object|string} error - Error object or message
     * @param {string} context - Context where error occurred
     */
    function handle(error, context) {
        var errorObj = {
            message: _normalizeMessage(error),
            context: context || 'unknown',
            timestamp: Date.now(),
            stack: (error && error.stack) || (error && error.raw && error.raw.stack) || null
        };

        _errors.push(errorObj);
        _log(errorObj);
        _notify(errorObj);
    }

    /**
     * Log error to console
     * @param {Object} errorObj
     */
    function _log(errorObj) {
        console.error('[NOMRO Error]', errorObj.context, errorObj.message);
        if (errorObj.stack) {
            console.error(errorObj.stack);
        }
    }

    /**
     * Notify user of error
     * @param {Object} errorObj
     */
    function _notify(errorObj) {
        var userMessage = _getUserMessage(errorObj);

        if (_callbacks.onShowError) {
            _callbacks.onShowError(userMessage);
        } else if (_callbacks.onShowToast) {
            _callbacks.onShowToast(userMessage, 'error');
        }
    }

    /**
     * Get user-friendly message
     * @param {Object} errorObj
     * @returns {string}
     */
    function _getUserMessage(errorObj) {
        var messages = {
            'No composition': 'الرجاء فتح Composition أولاً',
            'No composition selected': 'الرجاء فتح Composition أولاً',
            'No layer selected': 'الرجاء تحديد طبقة في After Effects',
            'Layer is locked': 'الطبقة المحددة مقفلة، يرجى إلغاء قفلها أولاً',
            'Layer not found': 'لم يتم العثور على الطبقة المحددة',
            'Not a NOMRO layer': 'الطبقة المحددة ليست من طبقات NOMRO',
            'Invalid input': 'الرجاء التحقق من صحة المدخلات',
            'CEP not available': 'خطأ في الاتصال مع After Effects',
            'Script execution failed': 'فشل في تنفيذ السكربت',
            'Error parsing update response': 'خطأ في قراءة استجابة التحديث',
            'Error executing update script': 'خطأ في تنفيذ التحديث',
            'TYPE_MISMATCH': 'لا يمكن تحديث نوع مختلف من نفس الزر',
            'Cross-type update blocked': 'تم منع تحديث نوع غير متطابق'
        };

        for (var key in messages) {
            if (errorObj.message.indexOf(key) !== -1) {
                return messages[key];
            }
        }

        return 'حدث خطأ: ' + errorObj.message;
    }

    /**
     * Get all logged errors
     * @returns {Array}
     */
    function getErrors() {
        return _errors;
    }

    /**
     * Clear error log
     */
    function clear() {
        _errors = [];
    }

    /**
     * Wrap function with error handling
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context name
     * @returns {Function}
     */
    function wrap(fn, context) {
        return function () {
            try {
                return fn.apply(this, arguments);
            } catch (e) {
                handle(e, context);
            }
        };
    }

    // Public API
    return {
        init: init,
        handle: handle,
        getErrors: getErrors,
        clear: clear,
        wrap: wrap
    };
})();
