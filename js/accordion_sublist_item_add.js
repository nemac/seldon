module.exports = function ($) {
    function addAccordionSublistItems (s, items, theme, accGp) {
        var contents = $('<div class="layer-group"></div>');
        // For FCAV: 
        // If the accordion section we are considering is
        // 'Archived ForWarn Change Maps' in the Archived theme,
        // make the sublist collapsed by default
        if (items.length &&
            theme.label === 'Archived Near-Real-Time Change Maps (MODIS NDVI)' &&
            accGp.label === 'Archived ForWarn Change Maps') {
            contents.addClass('collapsed');
            s.contentElement
                .children('h4')
                .prepend('<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span>')
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
