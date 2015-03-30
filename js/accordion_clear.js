module.exports = function ($) {
     function clearAccordionSections (accordionGroup) {
        $(accordionGroup).empty();
        $(accordionGroup).data('listAccordion').sections = [];
        $(accordionGroup).accordion('refresh');
    };

    return clearAccordionSections;
}
