function Theme (settings) {
    this.accordionGroups = [];
    if (!settings) { return; }
    this.name  = settings.name;
    this.label = settings.label;
    this.index = settings.index;
    this.zoom = settings.zoom;
    this.xmin = settings.xmin;
    this.ymin = settings.ymin;
    this.xmax = settings.xmax;
    this.ymax = settings.ymax;
    this.getAccordionGroupIndex = function (accordionGroup) {
        // return the index of a given AccordionGroup in this theme's list,
        // or -1 if it is not in the list
        var i;
        for (i = 0; i < this.accordionGroups.length; ++i) {
            if (this.accordionGroups[i] === accordionGroup) {
                return i;
            }
        }
        return -1;
    };
}

module.exports = Theme;
