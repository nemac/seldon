module.exports = function ($) {
  function MoreInfoButton(el) {
    var dialogDiv = '<div><p class="more-info-content">'+el.description+'<div></p>';
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.className = 'accordion-more-info-button';
    this.element.onclick = function (event) {
      $(dialogDiv).dialog({
          'title' : (el.label || el.name),
          'dialogClass' : 'more-info-dialog'
      })
    }
  }

  return MoreInfoButton;
}
