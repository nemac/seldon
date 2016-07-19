module.exports = function ($) {
    function addAccordionSublistItems (s, items, theme, accGp) {
        var contents = $('<div class="layer-group"></div>');
        // For FCAV: 
        // If the accordion section we are considering is
        // 'Archived ForWarn Change Maps' (in the "Archived..." theme)
        // then make a few modifications to the sublist:
        //  - collapse the sublist by default
        //  - add a triangle icon to the left of the sublist heading
        //    indicating collapse/expand interaction
        //  - remove the top margin of the sublist header
        //  - add padding to the left of the layer group
        var FCAV_ARCHIVED_LAYER_GROUP_PADDING_LEFT = '12px';
        var FCAV_ARCHIVED_SUBLIST_HEADER_MARGIN = '.7em 0'
        if (items.length &&
              theme.label === 'Archived Near-Real-Time Change Maps (MODIS NDVI)' &&
              accGp.label === 'Archived ForWarn Change Maps') {
            contents.addClass('collapsed');
            s.contentElement
                .children('h4')
                .prepend('<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span>')
                .css('margin', FCAV_ARCHIVED_SUBLIST_HEADER_MARGIN)
            contents.css('padding-left', FCAV_ARCHIVED_LAYER_GROUP_PADDING_LEFT)
        } 
        for (var i=0, l=items.length; i<l; i++) {
            contents.append($('<div class="layer"></div>').append(items[i]));
        }
        var layer = {
            name : name,
            contentElement : contents
        };
        s.items.push(layer);
        s.contentElement.append(layer.contentElement);

    }

    return addAccordionSublistItems;
}
