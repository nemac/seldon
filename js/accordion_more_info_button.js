module.exports = function ($) {
  function MoreInfoButton(el) {
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.className = 'accordion-more-info-button';
    // If el is a subgroup, use the sid prop; if layer, use lid prop
    var dialogClass = 'tooltip-for-' + (el.sid ? el.sid : el.lid)
    this.element.onclick = function (event) {
      var dialogOpen = $('.'+dialogClass).filter(':visible').length
      if (!dialogOpen) {
        var dialogDiv = ''
          +'<div>'
            +'<p class="tooltip-content">'+el.description+'</p>'
          +'</div>'
        $(dialogDiv).dialog({
          'title' : (el.label || el.name),
          'dialogClass' : 'tooltip-dialog ' + dialogClass,
        })
      }
    }
  }

  return MoreInfoButton;
}
