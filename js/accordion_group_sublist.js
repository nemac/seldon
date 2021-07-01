function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.sid = settings.sid
    this.type   = settings.type;
    this.description = settings.description
    this.collapsible = settings.collapsible
    this.break = settings.break
}

module.exports = AccordionGroupSublist;
