var debug = require('debug')('lorelei-interface:tournaments');
var fs = require("fs");
var path = require("path");
var util = require('util');

var tournament = require('lorelei-base/tournament.js');
var tournamentFileLoader = require('lorelei-base/tournamentFileLoader.js');

//TODO: Fix this
var players = require(path.join(process.cwd(), './libs/players'));

var express = require('express');
var router = express.Router();

var tournaments_storage_directory = "tournament-storage";
var tournaments_extension = ".tdf";

/* GET home page. */
router.get('/', function(req, res) {
  debug("Getting list of valid tournaments...");

  function callback(err, list_of_tournaments) {
    if (err) {
      throw err;
      return;
    }
    debug("Found: " + list_of_tournaments);
    res.render('tournaments-get', { tournaments: list_of_tournaments });
  }
  var loader = tournamentFileLoader.TournamentFileIteratoryFactory(tournaments_storage_directory, callback);
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
    var tournament_name = req.body.tournament_new_id;
    var password = req.body.tournament_new_password;

    var t = tournament.TournamentNew(tournament_name, password);

    var saveCallback = tournamentFileLoader.TournamentSaveCallbackFactory(tournaments_storage_directory);
    t.setSaveCallback(saveCallback);
    t.save();
    res.redirect('/tournaments/' + tournament_name + '/');
  }
});

router.get('/:tid/', function(req, res) {
  var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);

  console.log("Will load " + req.params.tid);

  var callback = function(err, tournament) {
    console.log("Callback invoked for " + req.params.tid);
    console.log(util.inspect(tournament));
    if (err != null) {
      console.log("About to render tournament-get");
      res.render('tournament-get', {tournament: tournament});
    } else {
      throw err;
    }
  }

  loader(req.params.tid, null, callback);
});

module.exports = router;
