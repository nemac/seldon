function AccordionGroupSublist (settings) {
    if (!settings) { return; }
    this.layers = [];
    this.label  = settings.label;
    this.sid = settings.sid
    this.type   = settings.type;
    if (settings.description) this.description = settings.description
}

module.exports = AccordionGroupSublist;
