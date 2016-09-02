module.exports = function ($) {
  function SublistInfoButton(sublist) {
    var dialogDiv = '<div class="sublistInfoDialog"><p>'+sublist.description+'</p></div>';
    this.element = document.createElement('button');
    this.element.textContent = '?';
    this.element.onclick = function (event) {
      $(dialogDiv).dialog({
          title : sublist.label + ' Information'
      })
    }
  }

  return SublistInfoButton;
}
