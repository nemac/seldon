function setAccordionGroup (accordionGroup) {
    this.currentAccordionGroup = accordionGroup;
    this.emit("accordiongroupchange");
}

module.exports = setAccordionGroup;
