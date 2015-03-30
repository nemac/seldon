module.exports = function ($) {
    function addAccordionSublistItems (s, items) {
        var contents = $('<div class="layer"></div>');
        contents.append(items);
        var layer = {
            name : name,
            contentElement : contents
        };
        s.items.push(layer);
        s.contentElement.append(layer.contentElement);
    }

    return addAccordionSublistItems;
}
