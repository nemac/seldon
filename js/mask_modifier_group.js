module.exports = function ($) {
    /**
     * When a mask grouper is enabled this function removes any modifiers from
     * its children. When a mask grouper is disabled the function re-enables any
     * modifiers that were disabled.
     */
    function handleMaskModifierGroup(parent, disabled) {
        var app = this;
        var children = $("[data-mask-parent='" + parent + "']");
        var child;
        var name;
        var index;
        var i;

        for (i = 0; i < children.length; i++) {
            child = children[i];
            if (disabled === true) {
                name = "";
            } else if ($(child).is(':checked')) {
                name = child.value;
            } else {
                name = "";
            }
            index = $(child).data("index");
            app.maskModifiers[index] = name;
        }
    }

    return handleMaskModifierGroup;
}

