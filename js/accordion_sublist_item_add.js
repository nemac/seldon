module.exports = function ($) {
    function addAccordionSublistItems (s, items) {
        var collapseThreshold = 30;
        var contents = $('<div class="layer-group"></div>');
        for (var i=0, l=items.length; i<l; i++) {
            contents.append($('<div class="layer"></div>').append(items[i]));
        }
        var layer = {
            name : name,
            contentElement : contents
        };
        s.items.push(layer);
        s.contentElement.append(layer.contentElement);

        if (items.length > collapseThreshold) {
            contents.addClass('showLessSublist');
            contents.after(
                '<div class="sublist-buttons ui-buttonset">'+
                    '<button class="show-more-layers">More</button>' +
                    '<button disabled class="show-less-layers">Less' +
                    '<button class="show-all-layers">All ('+items.length+')</button>'+
                '</div>'
            );
        }
    }

    return addAccordionSublistItems;
}
