module.exports = function ($) {
    function setupCollapsibleSublists () {
        var app = this;

        // Set a click handler on accordion section sublist headers
        $('.ui-accordion-content h4').on('click', function (event) {
            var $this = $(this);
            // Only trigger a collapse on a specific accordion section within the archived themen
            // The section we want is always the fifth accordion section;
            // we use its seldon-generated id attribute.
            if (app.currentTheme.label === 'Archived Near-Real-Time Change Maps (MODIS NDVI)' &&
                $this.parent().parent().attr('id') === 'ui-accordion-layerPickerAccordion-panel-4') {
                // Class toggle triggers css change. A 'collapsed' layer-group div
                // has a height of 0px and overflow set to hidden.
                $this.siblings('.layer-group').toggleClass('collapsed');
            }

        })
    }
    return setupCollapsibleSublists;
}