/*global describe, it, beforeEach, expect, xit, jasmine */

describe("EventEmitter", function () {
    "use strict";

    var EventEmitter = window.EventEmitter;

    var MyObject = function() {
        EventEmitter.call(this);
    };
    EventEmitter.declare(MyObject);

    beforeEach(function () {
        //...
    });

    describe("constructor", function () {
        it("should be able to create an EventEmitter instance", function () {
            var ee = new EventEmitter();
            expect(ee instanceof EventEmitter).toBe(true);
        });
        it("EventEmitter instance should have an addListener method", function () {
            var ee = new EventEmitter();
            expect(typeof(ee.addListener)).toEqual('function');
        });
        it("EventEmitter instance should have an removeListener method", function () {
            var ee = new EventEmitter();
            expect(typeof(ee.removeListener)).toEqual('function');
        });
        it("EventEmitter instance should have an emit method", function () {
            var ee = new EventEmitter();
            expect(typeof(ee.emit)).toEqual('function');
        });
    });

    describe("inheritance", function () {
        var m = new MyObject();
        it("should be able to create an instance of an EventEmitter subclass", function () {
            expect(m instanceof MyObject).toBe(true);
        });
        it("EventEmitter subclass instance should also be an instance of EventEmitter", function () {
            expect(m instanceof EventEmitter).toBe(true);
        });
        it("EventEmitter subclass instance should have an addListener method", function () {
            expect(typeof(m.addListener)).toEqual('function');
        });
        it("EventEmitter subclass instance should have an removeListener method", function () {
            expect(typeof(m.removeListener)).toEqual('function');
        });
        it("EventEmitter subclass instance should have an emit method", function () {
            expect(typeof(m.emit)).toEqual('function');
        });
    });


    describe("listener management", function () {
        var m;
        beforeEach(function() {
            m = new MyObject();
        });

        it("should be able to add an event listener", function () {
            var handler = function() {};
            expect(function() {
                m.addListener('foo', handler);
            }).not.toThrow();
            expect(m._listeners['foo'].length).toEqual(1);
            expect(m._listeners['foo'][0]).toEqual(handler);
        });

        it("should be able to add two event listeners", function () {
            var handler1 = function() {};
            var handler2 = function() {};
            expect(function() {
                m.addListener('foo', handler1);
                m.addListener('foo', handler2);
            }).not.toThrow();
            expect(m._listeners['foo'].length).toEqual(2);
            expect(m._listeners['foo'][0]).toEqual(handler1);
            expect(m._listeners['foo'][0]).not.toEqual(handler2);
            expect(m._listeners['foo'][1]).toEqual(handler2);
            expect(m._listeners['foo'][1]).not.toEqual(handler1);
        });

        it("adding the same listener twice for the same event type should only register it once", function () {
            var handler = function() {};
            expect(function() {
                m.addListener('foo', handler);
                m.addListener('foo', handler);
            }).not.toThrow();
            expect(m._listeners['foo'].length).toEqual(1);
            expect(m._listeners['foo'][0]).toEqual(handler);
        });

        it("should be able to add two event listeners, then remove the second, and still have the first", function () {
            var handler1 = function() {};
            var handler2 = function() {};
            expect(function() {
                m.addListener('foo', handler1);
                m.addListener('foo', handler2);
                m.removeListener('foo', handler2);
            }).not.toThrow();
            expect(m._listeners['foo'].length).toEqual(1);
            expect(m._listeners['foo'][0]).toEqual(handler1);
            expect(m._listeners['foo'][0]).not.toEqual(handler2);
        });

        it("should be able to add two event listeners, then remove the first, and still have the second", function () {
            var handler1 = function() {};
            var handler2 = function() {};
            expect(function() {
                m.addListener('foo', handler1);
                m.addListener('foo', handler2);
                m.removeListener('foo', handler1);
            }).not.toThrow();
            expect(m._listeners['foo'].length).toEqual(1);
            expect(m._listeners['foo'][0]).toEqual(handler2);
            expect(m._listeners['foo'][0]).not.toEqual(handler1);
        });

    });

    describe("event emitting", function () {
        var m, m1, m2,
            lastEvent,
            fooHandlerCount,
            fooHandler = function(e) {
                ++fooHandlerCount;
                lastEvent = e;
            },
            bar1HandlerCount,
            bar1Handler = function(e) {
                ++bar1HandlerCount;
                lastEvent = e;
            },
            bar2HandlerCount,
            bar2Handler = function(e) {
                ++bar2HandlerCount;
                lastEvent = e;
            };

        beforeEach(function() {
            lastEvent = undefined;
            fooHandlerCount = 0;
            bar1HandlerCount = 0;
            bar2HandlerCount = 0;
            m = new MyObject();
            m1 = new MyObject();
            m2 = new MyObject();
        });
        it("emitting an event should call the corresponding listener", function() {
            m.addListener("foo", fooHandler);
            expect(fooHandlerCount).toEqual(0);
            m.emit("foo");
            expect(fooHandlerCount).toEqual(1);
        });
        it("emitting an event with two listeners should call each listener once", function() {
            m.addListener("bar", bar1Handler);
            m.addListener("bar", bar2Handler);
            expect(bar1HandlerCount).toEqual(0);
            expect(bar2HandlerCount).toEqual(0);
            m.emit("bar");
            expect(bar1HandlerCount).toEqual(1);
            expect(bar2HandlerCount).toEqual(1);
        });
        it("emitting an event with the same listener registered twice should only call the listener once", function() {
            m.addListener("foo", fooHandler);
            m.addListener("foo", fooHandler);
            expect(fooHandlerCount).toEqual(0);
            m.emit("foo");
            expect(fooHandlerCount).toEqual(1);
        });
        it("two objects emitting the same event type, with separate listeners, should call each listener separately", function() {
            m1.addListener("bar", bar1Handler);
            m2.addListener("bar", bar2Handler);
            expect(bar1HandlerCount).toEqual(0);
            expect(bar2HandlerCount).toEqual(0);
            m1.emit("bar");
            expect(bar1HandlerCount).toEqual(1);
            expect(bar2HandlerCount).toEqual(0);
            m2.emit("bar");
            expect(bar1HandlerCount).toEqual(1);
            expect(bar2HandlerCount).toEqual(1);
        });
        it("event object should get passed to listener function", function() {
            m.addListener("foo", fooHandler);
            m.emit({ type : 'foo',
                     myvalue : 3.14 });
            expect(fooHandlerCount).toEqual(1);
            expect(lastEvent.myvalue).toEqual(3.14);
        });


    });


});
