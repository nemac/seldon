module.exports = function ($) {
    //jdm: override of js remove function
    //This is very useful for removing items from array by value
    //See: http://michalbe.blogspot.com/2010/04/removing-item-with-given-value-from.html
    Array.prototype.remove = function(value) {
        if (this.indexOf(value)!==-1) {
           this.splice(this.indexOf(value), 1);
           return true;
       } else {
          return false;
       };
    }

    // jrf: Overrides OpenLayers.Map.getCurrentSize since by default it does not
    //      account for padding, and seldon requires padding on the top and bottom
    //      for its layout.
    OpenLayers.Map.prototype.getCurrentSize = function () {
        var size = new OpenLayers.Size(this.div.clientWidth,
                                       this.div.clientHeight);

        if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
            size.w = this.div.offsetWidth;
            size.h = this.div.offsetHeight;
        }
        if (size.w == 0 && size.h == 0 || isNaN(size.w) && isNaN(size.h)) {
            size.w = parseInt(this.div.style.width, 10);
            size.h = parseInt(this.div.style.height, 10);
        }

        // getCurrentSize now accounts for padding
        size.h = size.h - parseInt($(this.div).css("padding-top"), 10) - parseInt($(this.div).css("padding-bottom"), 10);

        return size;
    };

    // Override of offending jquery ui original method per ticket
    // https://github.com/nemac/seldon/issues/18
    // see http://bugs.jqueryui.com/ticket/9364
    // and http://www.markliublog.com/override-jquery-ui-widget.html
    $.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
        _moveToTop: function(arg) { //_methodName is the new method or override method
            if (arg) {
                if (arg.handleObj.type!="mousedown") {
                    var moved = !!this.uiDialog.nextAll(":visible").insertBefore( this.uiDialog ).length;
                    if ( moved && !silent ) {
                        this._trigger( "focus", event );
                    }
                    return moved;
                }
            }
        }
    }));
}
