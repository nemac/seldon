module.exports = function ($) {
    function addAccordionSublistItems (s, items, theme, accGp) {
        var collapsed = s.collapsible ? 'collapsed ' : ''
        var contents = $('<div class="'+collapsed+'layer-group"></div>');

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
