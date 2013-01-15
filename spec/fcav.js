/*global describe, it, beforeEach, expect, xit, jasmine */

describe("FCAV", function () {
    "use strict";

    var fcav = window.fcav;

    beforeEach(function () {
        //...
    });


    describe("FcavState", function () {

        describe("constructor", function () {
            it("should be able to create an FcavState object", function () {
                var state = new fcav.FcavState();
                expect(state).not.toBeUndefined();
                expect(state instanceof fcav.FcavState).toBe(true);
            });
            it("constructed object should have some expected properties", function () {
                var state = new fcav.FcavState();
                expect(state.layerLids.length).toBe(0);
                expect(state.layerAlphas.length).toBe(0);
            });
        });

        describe("createFromURL", function () {
            var url1 = 'http://www.example.com/foo/bar?theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE',
                url2 = 'theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE',
                url3 = 'http://www.example.com/foo/bar?theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE&extent=MYEXTENT&layers=a,b,c&alphas=d,e,f',
                url4 = 'theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE&extent=MYEXTENT&layers=a,b,c&alphas=d,e,f';

            it("should work correctly on the url '" + url1 + "'", function () {
                var state = fcav.FcavState.createFromURL(url1);
                expect(state.themeName).toEqual("MYTHEME");
                expect(state.accordionGroupGid).toEqual("MYACCGP");
                expect(state.baseLayerName).toEqual("MYBASE");
                expect(state.extent).toBeUndefined();
                expect(state.layerLids.length).toBe(0);
                expect(state.layerAlphas.length).toBe(0);
            });

            it("should work correctly on the url '" + url2 + "'", function () {
                var state = fcav.FcavState.createFromURL(url2);
                expect(state.themeName).toEqual("MYTHEME");
                expect(state.accordionGroupGid).toEqual("MYACCGP");
                expect(state.baseLayerName).toEqual("MYBASE");
                expect(state.extent).toBeUndefined();
                expect(state.layerLids.length).toBe(0);
                expect(state.layerAlphas.length).toBe(0);
            });

            it("should work correctly on the url '" + url3 + "'", function () {
                var state = fcav.FcavState.createFromURL(url3);
                expect(state.themeName).toEqual("MYTHEME");
                expect(state.accordionGroupGid).toEqual("MYACCGP");
                expect(state.baseLayerName).toEqual("MYBASE");
                expect(state.extent).toEqual("MYEXTENT");
                expect(state.layerLids.length).toBe(3);
                expect(state.layerAlphas.length).toBe(3);
            });

            it("should work correctly on the url '" + url4 + "'", function () {
                var state = fcav.FcavState.createFromURL(url4);
                expect(state.themeName).toEqual("MYTHEME");
                expect(state.accordionGroupGid).toEqual("MYACCGP");
                expect(state.baseLayerName).toEqual("MYBASE");
                expect(state.extent).toEqual("MYEXTENT");
                expect(state.layerLids.length).toBe(3);
                expect(state.layerAlphas.length).toBe(3);
            });


        });

    });


});
