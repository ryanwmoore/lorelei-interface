var debug = require('debug')('lorelei-interface:user');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    debug("Letting player select their monitoried IDs...");
    res.render('monitored-ids');    
});

module.exports = router;
