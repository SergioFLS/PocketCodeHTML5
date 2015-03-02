/// <reference path="../../qunit/qunit-1.16.0.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/formula.js" />
'use strict';

QUnit.module("formula.js");


QUnit.test("Formula", function (assert) {

    var json = JSON.parse('{"type":"NUMBER","value":"500","right":null,"left":null}');
    var json2 = JSON.parse('{"type":"NUMBER","value":"20","right":null,"left":null}');

    var f = new PocketCode.Formula(undefined, undefined, json);

    assert.ok(f instanceof PocketCode.Formula, "instance check");
    assert.ok(typeof f.calculate === "function", "calculate created during ctr");
    assert.equal(f.calculate(), 500, "json parsed to method calculate");

    assert.equal(json, f.json, "json getter");
    f.json = json2;
    assert.equal(json2, f.json, "json setter");
    assert.equal(f.calculate(), 20, "json setter: calculate update");

    //internal methods: it's easier to check these methods directly (in this case)
    //round makes sure we are correct + - 1/1000 
    var result = Math.round(f._degree2radian(90.0 / Math.PI) * 1000) / 1000;
    assert.equal(result, 0.5, "helper: degree2radian");

    var result = Math.round(f._radian2degree(Math.PI / 90.0) * 1000) / 1000;
    assert.equal(result, 2.0, "helper: radian2degree");

    var result = Math.round(f._log10(10000000) * 1000)  / 1000;
    assert.equal(result, 7.0, "helper: log10");
/*
    json = JSON.parse('{"type":"NUMBER","value":"500","right":{"type":"NUMBER","value":"500","right":null,"left":null},"left":null}');
    assert.throws(function () { var f = new PocketCode.Formula(undefined, undefined, json); }, Error, "ERROR: formula parsing error detection");
*/
});
