module.exports = function ($) {
    function addAccordionSublistItems (s, items, theme, accGp) {
        var contents = $('<div class="layer-group"></div>');
        // For FCAV: 
        // If the accordion section we are considering is
        // 'Archived ForWarn Change Maps' (in the "Archived..." theme)
        // then make a few modifications to the sublist:
        //  - collapse the sublist by default
        //  - if the sublist is non-empty,
        //    add a triangle icon to the left of the header
        //    indicating collapse/expand interaction
        if (theme.label === 'Archived Near-Real-Time Change Maps (MODIS NDVI)' &&
              accGp.label === 'Archived ForWarn Change Maps') {
            var $header = s.contentElement.children('h4');
            if (items.length === 0) {
                $header.addClass('collapsible empty');
            } else {
                $header.addClass('collapsible')
                    .prepend('<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span>')
                contents.addClass('collapsible collapsed');
            }
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
