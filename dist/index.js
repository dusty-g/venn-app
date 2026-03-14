"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var path_1 = require("path");
var url_1 = require("url");
var db_js_1 = require("./db.js");
var analysis_js_1 = require("./analysis.js");
var __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/people', function (_req, res) {
    res.json((0, db_js_1.getPeople)());
});
app.post('/api/people', function (req, res) {
    var name = req.body.name;
    if (!(name === null || name === void 0 ? void 0 : name.trim()))
        return res.status(400).json({ error: 'Name required' });
    try {
        res.json((0, db_js_1.addPerson)(name.trim()));
    }
    catch (_a) {
        res.status(409).json({ error: 'Person already exists' });
    }
});
app.get('/api/facts', function (_req, res) {
    res.json((0, db_js_1.getFacts)());
});
app.post('/api/facts', function (req, res) {
    var _a = req.body, trait = _a.trait, personIds = _a.personIds;
    if (!(trait === null || trait === void 0 ? void 0 : trait.trim()))
        return res.status(400).json({ error: 'Trait required' });
    if (!(personIds === null || personIds === void 0 ? void 0 : personIds.length))
        return res.status(400).json({ error: 'At least one person required' });
    res.json((0, db_js_1.addFact)(trait.trim(), personIds));
});
app.get('/api/overlaps', function (_req, res) {
    res.json((0, analysis_js_1.computeOverlaps)());
});
app.get('/api/predictions', function (_req, res) {
    res.json((0, analysis_js_1.computePredictions)());
});
// In production, serve the built React app
var clientDist = path_1.default.join(__dirname, '..', 'client', 'dist');
app.use(express_1.default.static(clientDist));
app.get('*', function (_req, res) {
    res.sendFile(path_1.default.join(clientDist, 'index.html'));
});
var port = parseInt(process.env.PORT || '3001');
app.listen(port, function () {
    console.log("Server running on http://localhost:".concat(port));
});
