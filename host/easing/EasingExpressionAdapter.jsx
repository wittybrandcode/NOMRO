/**
 * NOMRO - Host Easing Expression Adapter
 * Unified API for easing expression generation.
 * @module easing/EasingExpressionAdapter
 */

NOMRO.easingAdapter = NOMRO.easingAdapter || {};

NOMRO.easingAdapter.getSingleExpression = function (curveId, legacyEasing, curveLibrary) {
    var resolvedId = curveId || legacyEasing || 'linear';

    if (NOMRO.easing && NOMRO.easing._curveExpression) {
        return NOMRO.easing._curveExpression(resolvedId, curveLibrary, 't');
    }

    if (NOMRO.easingRegistry && NOMRO.easingRegistry.has(resolvedId)) {
        return NOMRO.easingRegistry.get(resolvedId);
    }

    return 't';
};

NOMRO.easingAdapter.getDualExpression = function (dualConfig, curveLibrary) {
    if (NOMRO.easing && NOMRO.easing.getDualExpression) {
        return NOMRO.easing.getDualExpression(dualConfig || {}, curveLibrary);
    }

    return 't';
};

NOMRO.easingAdapter.getExpressionFromConfig = function (easingConfig, legacyEasing, curveLibrary) {
    if (NOMRO.easing && NOMRO.easing.getFromConfig) {
        return NOMRO.easing.getFromConfig(easingConfig, legacyEasing, curveLibrary);
    }

    if (easingConfig && easingConfig.mode === 'dual') {
        return NOMRO.easingAdapter.getDualExpression(easingConfig.dual || {}, curveLibrary);
    }

    var singleId = easingConfig && easingConfig.singleCurveId ? easingConfig.singleCurveId : legacyEasing;
    return NOMRO.easingAdapter.getSingleExpression(singleId, legacyEasing, curveLibrary);
};
