module.exports = function ($) {
    function setupCollapsibleSublists () {
        var app = this;

        var $sublists = $('.sublist.collapsible')
        // Set a click handler on accordion section sublist headers
        $sublists.children('.sublist-header').on('click', function (event) {
            var $this = $(this);
            var $sublist = $this.parent('.sublist')
            // If the sublist is collapsed, uncollapse it and set the header icon
            var $layerGroup = $sublist.children('.layer-group');
            var $icon = $this.children('.ui-accordion-header-icon')
            if ($layerGroup.hasClass('collapsed')) {
                $layerGroup.removeClass('collapsed');
                $icon.removeClass('ui-icon-triangle-1-e');
                $icon.addClass('ui-icon-triangle-1-s');
            } else {
            // If the sublist is uncollapse, collapse it and set the header icon
                $layerGroup.addClass('collapsed');
                $icon.removeClass('ui-icon-triangle-1-s');
                $icon.addClass('ui-icon-triangle-1-e');
            }
        })
    }
    return setupCollapsibleSublists;
}



