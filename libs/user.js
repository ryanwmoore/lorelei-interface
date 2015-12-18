var debug = require('debug')('lorelei-interface:user');
var express = require('express');
var router = express.Router();
var util = require('util');
var _ = require('underscore');

var valid_player_id_regexp = /^[0-9]+$/;

var ids_set_url = "ids";

function all_ids_are_valid(ids) {
    return ids != null && ids != undefined && _.every(ids, function (item) { return String(item).match(valid_player_id_regexp) != null; });
}

function saveIDsInSession(ids, req) {
    req.session.ids = ids;
}

function getSessionIDs(req) {
    var ids = req.session.ids;

    if (ids != null && ids != undefined) {
        return ids;
    } else {
        return [];
    }
}

router.get('/', function (req, res) {
    debug("Letting player select their monitoried IDs...");
    res.render('monitored-ids', {
        ids_set_url: ids_set_url
    });    
});

router.get('/ids', function (req, res) {
    debug("Getting selected player IDs...");
    res.send(getSessionIDs(req));
});

router.post('/ids', function (req, res) {
    debug("Setting selected player IDs...");
    var ids = req.body.ids;
    
    if (all_ids_are_valid(ids)) {
        debug("Will remember IDs: " + util.inspect(ids));
        saveIDsInSession(ids, req);
        res.send(ids);
    } else {
        throw new Error("Usage: POST numeric_ids_as_list");
    }
});

module.exports = router;
