/*global describe, it, beforeEach, expect, xit, jasmine */

describe("Seldon", function () {
    "use strict";

    var fcav = window.fcav;

    beforeEach(function () {
        //...
    });


    describe("ShareUrlInfo", function () {

        describe("constructor", function () {
            it("should be able to create an ShareUrlInfo object", function () {
                var info = new fcav.ShareUrlInfo();
                expect(info).not.toBeUndefined();
                expect(info instanceof fcav.ShareUrlInfo).toBe(true);
            });
            it("constructed object should have some expected properties", function () {
                var info = new fcav.ShareUrlInfo();
                expect(info.layerLids.length).toBe(0);
                expect(info.layerAlphas.length).toBe(0);
            });
        });

        describe("parseUrl", function () {
            var url1 = 'http://www.example.com/foo/bar?theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE',
                url2 = 'theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE',
                url3 = 'http://www.example.com/foo/bar?theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE&extent=5,6,7,8&layers=a,b,c&alphas=d,e,f',
                url4 = 'theme=MYTHEME&accgp=MYACCGP&basemap=MYBASE&extent=5,6,7,8&layers=a,b,c&alphas=d,e,f';

            it("should work correctly on the url '" + url1 + "'", function () {
                var info = fcav.ShareUrlInfo.parseUrl(url1);
                expect(info.themeName).toEqual("MYTHEME");
                expect(info.accordionGroupGid).toEqual("MYACCGP");
                expect(info.baseLayerName).toEqual("MYBASE");
                expect(info.layerLids.length).toBe(0);
                expect(info.layerAlphas.length).toBe(0);
            });

            it("should work correctly on the url '" + url2 + "'", function () {
                var info = fcav.ShareUrlInfo.parseUrl(url2);
                expect(info.themeName).toEqual("MYTHEME");
                expect(info.accordionGroupGid).toEqual("MYACCGP");
                expect(info.baseLayerName).toEqual("MYBASE");
                expect(info.layerLids.length).toBe(0);
                expect(info.layerAlphas.length).toBe(0);
            });

            it("should work correctly on the url '" + url3 + "'", function () {
                var info = fcav.ShareUrlInfo.parseUrl(url3);
                expect(info.themeName).toEqual("MYTHEME");
                expect(info.accordionGroupGid).toEqual("MYACCGP");
                expect(info.baseLayerName).toEqual("MYBASE");
                expect(info.extent.left).toEqual('5');
                expect(info.extent.bottom).toEqual('6');
                expect(info.extent.right).toEqual('7');
                expect(info.extent.top).toEqual('8');
                expect(info.layerLids.length).toBe(3);
                expect(info.layerAlphas.length).toBe(3);
            });

            it("should work correctly on the url '" + url4 + "'", function () {
                var info = fcav.ShareUrlInfo.parseUrl(url4);
                expect(info.themeName).toEqual("MYTHEME");
                expect(info.accordionGroupGid).toEqual("MYACCGP");
                expect(info.baseLayerName).toEqual("MYBASE");
                expect(info.extent.left).toEqual('5');
                expect(info.extent.bottom).toEqual('6');
                expect(info.extent.right).toEqual('7');
                expect(info.extent.top).toEqual('8');
                expect(info.layerLids.length).toBe(3);
                expect(info.layerAlphas.length).toBe(3);
            });


        });

    });


});
