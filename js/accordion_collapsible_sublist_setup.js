module.exports = function ($) {
  function setupCollapsibleSublists (ui) {
    var app = this;

    if (ui.newPanel.length === 0) {
      return
    }

    var $sublists = ui.newPanel.children('.sublist.collapsible')

    if ($sublists.length === 0) {
      return
    }

    // Set a click handler on accordion section sublist headers
    $sublistHeaders = $sublists.children('.sublist-header')

    $sublistHeaders.each(function () {
      var $header = $(this)
      if (!!$header[0].onclick) {
        return
      }
      $header[0].onclick = function (event) {
        var $this = $(this);
        var $sublist = $this.parent('.sublist')
        // If the sublist is collapsed, uncollapse it and set the header icon
        var $layerGroup = $sublist.children('.layer-group');
        var $icon = $this.children('.ui-accordion-header-icon')
        if ($layerGroup.hasClass('collapsed')) {
          $layerGroup.removeClass('collapsed');
          $icon.removeClass('ui-icon-triangle-1-e');
          $icon.addClass('ui-icon-triangle-1-s');
        } else {
        // If the sublist is uncollapsed, collapse it and set the header icon
          $layerGroup.addClass('collapsed');
          $icon.removeClass('ui-icon-triangle-1-s');
          $icon.addClass('ui-icon-triangle-1-e');
        }
      }

    })
    
  }
  return setupCollapsibleSublists;
}



