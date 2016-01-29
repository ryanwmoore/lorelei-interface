var debug = require('debug')('lorelei-interface:tournaments');
var fs = require("fs");
var multer = require("multer");
var path = require("path");
var util = require('util');

var upload = multer({ dest: '/tmp/' });

var tournament = require('lorelei-base/tournament.js');
var tournamentFileLoader = require('lorelei-base/tournamentFileLoader.js');

//TODO: Fix this
var players = require(path.join(process.cwd(), './libs/players'));

var express = require('express');
var router = express.Router();

var tournaments_storage_directory = "tournament-storage";
var tournaments_extension = ".tdf";

var title_for_new_tournament_page = "Start a New Tournament";

var fullscreenExtension = "fullscreen";

function addContextExtraLinks(tournament, extra_links) {
  extra_links.push({url: "/tournaments/" + tournament.getId() + '/' + fullscreenExtension, text: "view fullscreen"});

  if (! tournament.passwordIsCorrect()) {
    extra_links.push({url: "/tournaments/" + tournament.getId() + "/login", text: "manage"});
  } else {
    extra_links.push({url: "/tournaments/" + tournament.getId() + "/upload", text: "upload new round for " + tournament.getId()});
  }
}

function getPasswordFor(req, tid) {
  if (req.session.logins && req.session.logins[tid]) {
    return req.session.logins[tid];
  } else {
    return null;
  }
}

/* GET home page. */
router.get('/', function(req, res) {
  debug("Getting list of valid tournaments...");

  function callback(err, list_of_tournaments) {
    if (err) {
      throw err;
      return;
    }
    debug("Found: " + list_of_tournaments);
    res.render('tournaments-get', { tournaments: list_of_tournaments, title: "Active Tournament Listing" });
  }
  var loader = tournamentFileLoader.TournamentFileIteratoryFactory(tournaments_storage_directory, callback);
});

router.get('/new', function(req, res) {
  res.render('tournaments-new', { form: { }, title: title_for_new_tournament_page });
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
                                },
                                title: title_for_new_tournament_page
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

function getLoginPageTitle(tid) {
  return "Login to Manage " + tid;
}

router.get('/:tid/login', function(req, res) {
  var tid = req.params.tid;
  var password = getPasswordFor(req, tid);

  var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);
  loader(tid, password, function(err, tournament) {
    if (err) { throw err; }

    var extra_links = [];
    addContextExtraLinks(tournament, extra_links);

    res.render('tournament-login', {tournament: tournament, extra_links: extra_links, title: getLoginPageTitle(tid)});
  });
});

router.post('/:tid/login', function(req, res) {
  var tid = req.params.tid;
  var password = req.body.tournament_password;

  if (! req.session.logins) {
    req.session.logins = {};
  }

  req.session.logins[tid] = password;

  var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);
  loader(tid, password, function(err, tournament) {
    if (err) { throw err; }

    if (tournament.passwordIsCorrect()) {
      res.redirect('/tournaments/' + tid + '/');
    } else {
      var password_warning = "Incorrect password";
      debug("Login to " + tid + " failed");
      res.render('tournament-login', {password_warning: password_warning, tournament: tournament, title: getLoginPageTitle(tid)});
    }
  });
});

function getPasswordFor(req, tid) {
  if (! req.session.logins) {
    return undefined;
  }

  return req.session.logins[tid];
}

function getTitleForUploadPage(tid) {
  return "Upload a new round for " + tid;
}

router.get('/:tid/upload', function(req, res) {
  var tid = req.params.tid;
  var password = getPasswordFor(req, tid);

  var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);
  loader(tid, password, function(err, tournament) {
    if (err) { throw err; }

    var extra_links = [];
    addContextExtraLinks(tournament, extra_links);

    res.render('tournament-upload', {tournament: tournament, title: getTitleForUploadPage(tid), extra_links: extra_links});
  });
});

router.post('/:tid/upload', upload.single('round_data'), function(req, res) {
  var tid = req.params.tid;
  var password = getPasswordFor(req, tid);

  var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);
  loader(tid, password, function(err, tournament) {
    if (err) { throw err; }

    var setToNewRound = req.body.set_to_new_round == 'on';
    var uploadAsString = fs.readFileSync(req.file.path, "utf-8");

    tournament.addUpload(uploadAsString, function(err, tournament) {
      if (! err) {
        tournament.save();
        res.redirect("/tournaments/#{tid}/");
      } else {
        var extra_links = [];
        addContextExtraLinks(tournament, extra_links);

        res.render('tournament-upload', {tournament: tournament, message: err.message, title: getTitleForUploadPage(tid)});
      }
    }, setToNewRound);

  });
});

function genericStadiumPage(req, res, destination, main_div_class) {
  var tid = req.params.tid;
  var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);

  if (main_div_class === undefined) {
    main_div_class = '';
  }

  var loaderCallback = function (err, t) {
      if (err) { throw err; }

        var extra_links = [];
        addContextExtraLinks(t, extra_links);

        res.render(destination, {
            ids_get_url: '/ids/ids',
            tournament: t,
            tid: tid,
            title: tid,
            extra_links: extra_links,
            main_div_class: main_div_class
        });
  };
  loader(tid, getPasswordFor(req, tid), loaderCallback);
}

router.get('/:tid/', function (req, res) {
  genericStadiumPage(req, res, 'tournament-get');
});

router.get('/:tid/' + fullscreenExtension, function(req, res) {
  genericStadiumPage(req, res, 'tournament-fullscreen', 'fullscreen');
});

router.get('/:tid/information', function (req, res) {
    var tid = req.params.tid;
    var loader = tournamentFileLoader.TournamentFileLoaderFactory(tournaments_storage_directory);

    var loaderCallback = function (err, t) {
        if (err) { throw err; }

        var buildJsonRepresentationCallback = function (err, jsonRepresentation) {
            if (err) { throw err; }

            res.format({
                json: function () {
                    res.send({ information: jsonRepresentation });
                },
                'default': function () {
                    res.status(406).send('Not Acceptable');
                }
            });
        }

        t.buildJsonRepresentation(buildJsonRepresentationCallback);
    }

    loader(req.params.tid, getPasswordFor(req, tid), loaderCallback);
});

module.exports = router;
