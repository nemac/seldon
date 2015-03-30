function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.type   = settings.type;
}

module.exports = AccordionGroupSublist;
