function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.sid = settings.sid
    this.type   = settings.type;
    this.info = settings.info
    this.collapsible = settings.collapsible
    this.break = settings.break
}

module.exports = AccordionGroupSublist;
