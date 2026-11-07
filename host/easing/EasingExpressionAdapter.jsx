/**
 * NOMRO - Host Easing Expression Adapter
 * Unified, safe adapter for generating pure After Effects easing expressions with NOMRO_Ease support.
 * @module easing/EasingExpressionAdapter
 */

NOMRO.easingAdapter = NOMRO.easingAdapter || {};

NOMRO.easingAdapter.getSingleExpression = function (curveId, legacyEasing, curveLibrary, strength) {
    var resolvedId = curveId || legacyEasing || 'smoothOut';

    if (NOMRO.easing && NOMRO.easing.get) {
        return NOMRO.easing.get(resolvedId, strength);
    }

    if (NOMRO.easingRegistry && NOMRO.easingRegistry.has(resolvedId)) {
        return NOMRO.easingRegistry.get(resolvedId);
    }

    return 't';
};

NOMRO.easingAdapter.getDualExpression = function (dualConfig, curveLibrary, strength) {
    if (NOMRO.easing && NOMRO.easing.getDualExpression) {
        return NOMRO.easing.getDualExpression(dualConfig || {}, curveLibrary, strength);
    }
    return '(1 - Math.pow(1 - t, 3))';
};

NOMRO.easingAdapter.getExpressionFromConfig = function (easingConfig, legacyEasing, curveLibrary, strength) {
    if (NOMRO.easing && NOMRO.easing.getFromConfig) {
        return NOMRO.easing.getFromConfig(easingConfig, legacyEasing, curveLibrary, strength);
    }

    var singleId = (easingConfig && easingConfig.singleCurveId)
        ? easingConfig.singleCurveId
        : (legacyEasing || 'smoothOut');
    var str = (easingConfig && easingConfig.easeStrength !== undefined) ? easingConfig.easeStrength : strength;

    return NOMRO.easingAdapter.getSingleExpression(singleId, legacyEasing, curveLibrary, str);
};
