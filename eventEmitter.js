// To inherit from EventEmitter:
//
//    function MyObject() {
//        EventEmitter.call(this);
//    };
//    EventEmitter.declare(MyObject);

//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//MIT License

(function () {
    "use strict";

    //var EventEmitter = function() {
    function EventEmitter() {
        this._listeners = {};
    };

    EventEmitter.declare = function (Type) {
        Type.prototype = new EventEmitter();
        Type.prototype.constructor = Type;
    };

    EventEmitter.prototype = {

        constructor: EventEmitter,

        addListener: function(type, listener){
            // initialize the listener list for this event type, if it's not yet initialized
            if (typeof this._listeners[type] == "undefined"){
                this._listeners[type] = [];
            }
            // check to see if this listener is already registered for this event type,
            // and if so, return without adding it again
            var listeners = this._listeners[type];
            for (var i=0, len=listeners.length; i < len; i++){
                if (listener == listeners[i]) {
                    return this;
                }
            }
            // if we get this far, add the listener to the list for this event type
            this._listeners[type].push(listener);

            return this;
        },

        emit: function(event) {
            if (typeof event == "string"){
                event = { type: event };
            }
            if (!event.target){
                event.target = this;
            }

            if (!event.type){  //falsy
                throw new Error("Event object missing 'type' property.");
            }

            if (this._listeners[event.type] instanceof Array){
                var listeners = this._listeners[event.type];
                for (var i=0, len=listeners.length; i < len; i++){
                    listeners[i].call(this, event);
                }
            }
            return this;
        },

        removeListener: function(type, listener) {
            if (this._listeners[type] instanceof Array){
                var listeners = this._listeners[type];
                for (var i=0, len=listeners.length; i < len; i++){
                    if (listeners[i] === listener){
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
            return this;
        },

        removeAllListeners: function(type) {
            this._listeners[type] = [];
            return this;
        }

    };

    window.EventEmitter = EventEmitter;


}());
