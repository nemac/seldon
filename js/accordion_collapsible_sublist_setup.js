module.exports = function ($) {
    function setupCollapsibleSublists () {
        var app = this;

        var theme_labels = [
          'Archived Near-Real-Time Change Maps (MODIS NDVI)',
          'Duration Products'
        ];

        var acc_ids = [
          'ui-accordion-layerPickerAccordion-panel-5',
          'ui-accordion-layerPickerAccordion-panel-4'
        ];

        // Set a click handler on accordion section sublist headers
        $('.ui-accordion-content h4').on('click', function (event) {
            var $this = $(this);
            // Only trigger a collapse on a specific accordion section within the archived themen
            // The section we want is always the fifth accordion section;
            // we use its seldon-generated id attribute.
            if ($.inArray(app.currentTheme.label, theme_labels) !== -1 &&
                $.inArray($this.parent().parent().attr('id'), acc_ids) !== -1) {
                // If the sublist is collapsed, uncollapse it and set the header icon
                var $sublist = $this.siblings('.layer-group');
                var $icon = $this.children('.ui-icon')
                if ($sublist.hasClass('collapsed')) {
                    $sublist.removeClass('collapsed');
                    $icon.removeClass('ui-icon-triangle-1-e');
                    $icon.addClass('ui-icon-triangle-1-s');
                } else {
                // If the sublist is uncollapse, collapse it and set the header icon
                    $sublist.addClass('collapsed');
                    $icon.removeClass('ui-icon-triangle-1-s');
                    $icon.addClass('ui-icon-triangle-1-e');
                }
            }

        })
    }
    return setupCollapsibleSublists;
}
