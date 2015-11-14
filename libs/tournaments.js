var debug = require('debug')('lorelei-interface:tournaments');
var fs = require("fs");
var path = require("path");

var tournament = require('lorelei-base/tournament.js');

//TODO: Fix this
var players = require(path.join(process.cwd(), './libs/players'));

var express = require('express');
var router = express.Router();

var tournaments_storage_directory = "../examples/";
var tournaments_extension = ".tdf";

/* GET home page. */
router.get('/', function(req, res) {
  debug("Getting list of valid tournaments...");

  fs.readdir(tournaments_storage_directory, function (err, filesAndDirs) {
    if (err) {
        throw err;
    }

    var files = filesAndDirs.map(function (file) {
        return path.join(tournaments_storage_directory, file);
    }).filter(function (file) {
        //TODO: Should escape the extension so that "." doesn't match anything
        return fs.statSync(file).isFile() && file.match(tournaments_extension + "$");
    }).map(function (file) {
        return path.basename(file);
    });

    debug("Found: " + files);

    res.render('tournaments-get', { tournaments: files });
  });
});

router.get('/new', function(req, res) {
  res.render('tournaments-new', { form: { } });
});

router.post('/new', function(req, res) {
  warnings = {};
  if (req.body.tournament_new_password.length <= 0) {
    warnings['tournament_password_warning'] = 'Enter a password.'
  }
  else if (req.body.tournament_new_password != req.body.tournament_new_password_again) {
    warnings['tournament_password_warning'] = 'Passwords do not match.'
  }
  if (! tournament.TournamentNameIsValid(req.body.tournament_new_id)) {
    warnings['tournament_id_warning'] = 'Tournament ID must consist only of letters (non-accented latin alphabet) and/or numbers.';
  }

  if (Object.keys(warnings).length > 0) {
    var template_variables  = { warnings: warnings,
                                form: {
                                    tournament_new_id: req.body.tournament_new_id,
                                    tournament_new_password: req.body.tournament_new_password,
                                    tournament_new_password_again: req.body.tournament_new_password_again
                                }
    };
    debug(template_variables);
    res.render('tournaments-new',  template_variables);
  } else {
    debug("No problems");
    //TODO?
  }
});

router.get('/:tid/players', function(req, res) {
  load(req.params.tid, function(full_tournament_filename) {
    var playersNames = players.getPlayersIn(full_tournament_filename, function(playersNames) {
      debug("Player names are: " + playersNames);
      res.render('tournaments-players', { tournament: req.params.tid, players: playersNames })
    });
  });
});

function load(id, fn){
  debug("Was told to load tournament: " + id);
  var full_tournament_filename = path.join(tournaments_storage_directory, id + tournaments_extension);
  debug("Will look for tournament file in: " + full_tournament_filename);
  fn(full_tournament_filename);
}

module.exports = router;
