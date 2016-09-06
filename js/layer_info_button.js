module.exports = function ($) {
  function LayerInfoButton(layer) {
    var dialogDiv = '<div id="layer'+layer.lid+'InfoDialog"><p>'+layer.description+'</p></div>';
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.onclick = function (event) {
      $(dialogDiv).dialog({
          title : layer.lid + ' Information'
      })
    }
  }

  return LayerInfoButton;
}
