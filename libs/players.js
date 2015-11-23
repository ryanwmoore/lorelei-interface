var _ = require('underscore')._;
var debug = require('debug')('lorelei:players');
var fs = require("fs");
var parseString = require('xml2js').parseString;
var path = require("path");
var players_in_tournament = require('lorelei-base/visualizers/players_in_tournament.js');

function getPlayersIn(tournament_file_name, fn){

  debug("Getting list of players from: " + tournament_file_name);

  fs.readFile(tournament_file_name, 'utf8', function(err, data) {
    if (err) {
      throw err;
    } else {
      parseString(data, function (err, json_dom) {
        if (err) {
          throw err;
        } else {
          var playersList = players_in_tournament.GetPlayerList(json_dom);
          fn(_.map(playersList, function(player) {
            return player.name;
          }));
        }
      });
    }
  });
};

module.exports = {
  getPlayersIn : getPlayersIn
};
