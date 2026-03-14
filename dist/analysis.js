"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeOverlaps = computeOverlaps;
exports.computePredictions = computePredictions;
var db_js_1 = require("./db.js");
function computeOverlaps() {
    var _a = (0, db_js_1.getFactPeopleMatrix)(), people = _a.people, facts = _a.facts, has = _a.has;
    var overlaps = [];
    var _loop_1 = function (i) {
        var _loop_2 = function (j) {
            var shared = facts.filter(function (f) { return has(f.id, people[i].id) && has(f.id, people[j].id); });
            if (shared.length > 0) {
                overlaps.push({
                    person1: people[i],
                    person2: people[j],
                    sharedTraits: shared.map(function (f) { return f.trait; }),
                    count: shared.length,
                });
            }
        };
        for (var j = i + 1; j < people.length; j++) {
            _loop_2(j);
        }
    };
    for (var i = 0; i < people.length; i++) {
        _loop_1(i);
    }
    return overlaps.sort(function (a, b) { return b.count - a.count; });
}
function computePredictions() {
    var _a = (0, db_js_1.getFactPeopleMatrix)(), people = _a.people, facts = _a.facts, has = _a.has;
    // Build trait vectors per person
    var vectors = new Map();
    var _loop_3 = function (p) {
        vectors.set(p.id, new Set(facts.filter(function (f) { return has(f.id, p.id); }).map(function (f) { return f.id; })));
    };
    for (var _i = 0, people_1 = people; _i < people_1.length; _i++) {
        var p = people_1[_i];
        _loop_3(p);
    }
    // Cosine similarity between two people
    function similarity(a, b) {
        var va = vectors.get(a);
        var vb = vectors.get(b);
        if (va.size === 0 || vb.size === 0)
            return 0;
        var shared = 0;
        for (var _i = 0, va_1 = va; _i < va_1.length; _i++) {
            var id = va_1[_i];
            if (vb.has(id))
                shared++;
        }
        return shared / Math.sqrt(va.size * vb.size);
    }
    var predictions = [];
    var _loop_4 = function (target) {
        var targetTraits = vectors.get(target.id);
        for (var _c = 0, people_3 = people; _c < people_3.length; _c++) {
            var other = people_3[_c];
            if (other.id === target.id)
                continue;
            var sim = similarity(target.id, other.id);
            if (sim < 0.3)
                continue; // need meaningful similarity
            var otherTraits = vectors.get(other.id);
            var sharedCount = 0;
            for (var _d = 0, targetTraits_1 = targetTraits; _d < targetTraits_1.length; _d++) {
                var id = targetTraits_1[_d];
                if (otherTraits.has(id))
                    sharedCount++;
            }
            var _loop_5 = function (factId) {
                if (!targetTraits.has(factId)) {
                    var fact_1 = facts.find(function (f) { return f.id === factId; });
                    // Avoid duplicate predictions
                    if (!predictions.some(function (p) { return p.person.id === target.id && p.trait === fact_1.trait; })) {
                        predictions.push({
                            person: target,
                            trait: fact_1.trait,
                            confidence: sim,
                            basedOn: { person: other, sharedCount: sharedCount },
                        });
                    }
                }
            };
            // Find traits other has that target doesn't
            for (var _e = 0, otherTraits_1 = otherTraits; _e < otherTraits_1.length; _e++) {
                var factId = otherTraits_1[_e];
                _loop_5(factId);
            }
        }
    };
    for (var _b = 0, people_2 = people; _b < people_2.length; _b++) {
        var target = people_2[_b];
        _loop_4(target);
    }
    return predictions.sort(function (a, b) { return b.confidence - a.confidence; }).slice(0, 20);
}
