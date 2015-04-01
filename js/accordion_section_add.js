module.exports = function ($) {
    function addAccordionSection (accordionGroup, title) {
        var sectionObj = {
            title          : title,
            titleElement   : $('<h3>' + title + '</h3>'),
            contentElement : $('<div></div>'),
            sublists       : []
        };
        var $accordionGroup = $(accordionGroup);
        $accordionGroup.data('listAccordion').sections.push(sectionObj);
        $accordionGroup.append(sectionObj.titleElement)
            .append(sectionObj.contentElement);
        $accordionGroup.accordion('refresh');
        return sectionObj;
    }

    return addAccordionSection;
}
