"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeople = getPeople;
exports.addPerson = addPerson;
exports.getFacts = getFacts;
exports.addFact = addFact;
exports.getFactPeopleMatrix = getFactPeopleMatrix;
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var url_1 = require("url");
var __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
var db = new better_sqlite3_1.default(path_1.default.join(__dirname, '..', 'venn.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec("\n  CREATE TABLE IF NOT EXISTS people (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    name TEXT NOT NULL UNIQUE,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n  );\n\n  CREATE TABLE IF NOT EXISTS facts (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    trait TEXT NOT NULL,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n  );\n\n  CREATE TABLE IF NOT EXISTS fact_people (\n    fact_id INTEGER REFERENCES facts(id) ON DELETE CASCADE,\n    person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,\n    PRIMARY KEY (fact_id, person_id)\n  );\n");
function getPeople() {
    return db.prepare('SELECT id, name FROM people ORDER BY name').all();
}
function addPerson(name) {
    var result = db.prepare('INSERT INTO people (name) VALUES (?)').run(name);
    return { id: result.lastInsertRowid, name: name };
}
function getFacts() {
    var facts = db.prepare('SELECT id, trait, created_at FROM facts ORDER BY created_at DESC').all();
    var stmtPeople = db.prepare("\n    SELECT p.id, p.name FROM people p\n    JOIN fact_people fp ON fp.person_id = p.id\n    WHERE fp.fact_id = ?\n  ");
    return facts.map(function (f) { return (__assign(__assign({}, f), { people: stmtPeople.all(f.id) })); });
}
function addFact(trait, personIds) {
    var insertFact = db.prepare('INSERT INTO facts (trait) VALUES (?)');
    var insertLink = db.prepare('INSERT INTO fact_people (fact_id, person_id) VALUES (?, ?)');
    var result = db.transaction(function () {
        var lastInsertRowid = insertFact.run(trait).lastInsertRowid;
        for (var _i = 0, personIds_1 = personIds; _i < personIds_1.length; _i++) {
            var pid = personIds_1[_i];
            insertLink.run(lastInsertRowid, pid);
        }
        return lastInsertRowid;
    })();
    var factId = result;
    var stmtPeople = db.prepare("\n    SELECT p.id, p.name FROM people p\n    JOIN fact_people fp ON fp.person_id = p.id\n    WHERE fp.fact_id = ?\n  ");
    return { id: factId, trait: trait, people: stmtPeople.all(factId) };
}
function getFactPeopleMatrix() {
    var people = getPeople();
    var facts = db.prepare('SELECT id, trait FROM facts').all();
    var links = db.prepare('SELECT fact_id, person_id FROM fact_people').all();
    var linkSet = new Set(links.map(function (l) { return "".concat(l.fact_id, "-").concat(l.person_id); }));
    return { people: people, facts: facts, has: function (factId, personId) { return linkSet.has("".concat(factId, "-").concat(personId)); } };
}
exports.default = db;
