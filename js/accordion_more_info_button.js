module.exports = function ($) {
  function MoreInfoButton(el) {
    var dialogDiv = '<div class="more-info-dialog"><p>'+el.description+'</p></div>';
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.className = 'accordion-more-info-button';
    this.element.onclick = function (event) {
      $(dialogDiv).dialog({
          title : (el.label || el.name) + ' Info'
      })
    }
  }

  return MoreInfoButton;
}
