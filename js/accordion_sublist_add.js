module.exports = function ($) {
    function addAccordionSublists (g, items) {
        $(g.contentElement).append(items);
    }

    return addAccordionSublists;
}
