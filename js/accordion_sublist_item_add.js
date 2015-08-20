module.exports = function ($) {
    function addAccordionSublistItems (s, items) {
//mbp if (s.heading === "Climate Modely") {
//mbp     console.log(s.heading);
//mbp }
        var contents = $('<div class="layer"></div>');
//mbp //console.log('contents');
//mbp //console.log(contents[0].childElementCount);
        items.forEach(function(it) {
            contents.append($(it));
//mbp //console.log('  after it: ' + contents[0].childElementCount);
//mbp //console.log(contents.html());
        });
        //contents.append(items);
        var layer = {
            name : name,
            contentElement : contents
        };
        s.items.push(layer);
//mbp if (s.heading === "Climate Modely") {
//mbp     console.log('before');
//mbp     console.log(s.contentElement.html());
//mbp }
        s.contentElement.append(layer.contentElement);
//mbp if (s.heading === "Climate Modely") {
//mbp     console.log('after');
//mbp     console.log(s.contentElement.html());
//mbp }
    }

    return addAccordionSublistItems;
}
