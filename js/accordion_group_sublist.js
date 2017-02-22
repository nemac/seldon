function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.sid = settings.sid
    this.type   = settings.type;
    this.description = settings.description
    this.collapsible = settings.collapsible
}

module.exports = AccordionGroupSublist;
