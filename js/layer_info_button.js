module.exports = function ($) {
  function LayerInfoButton(layer) {
    var dialogDiv = '<div class="more-info-dialog"><p>'+layer.description+'</p></div>';
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.onclick = function (event) {
      $(dialogDiv).dialog({
          title : layer.lid + ' Info'
      })
    }
  }

  return LayerInfoButton;
}
