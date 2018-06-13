function AccordionGroup (settings) {
    if (!settings) { return; }
    this.sublists         = [];
    this.gid              = settings.gid;
    this.name             = settings.name;
    this.label            = settings.label;
    //this.selectedInConfig = settings.selectedInConfig;
}

module.exports = AccordionGroup;
