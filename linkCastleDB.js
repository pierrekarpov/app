/*
d8888b. d888888b .d8888.  .o88b. db       .d8b.  d888888b .88b  d88. d88888b d8888b.
88  `8D   `88'   88'  YP d8P  Y8 88      d8' `8b   `88'   88'YbdP`88 88'     88  `8D
88   88    88    `8bo.   8P      88      88ooo88    88    88  88  88 88ooooo 88oobY'
88   88    88      `Y8b. 8b      88      88~~~88    88    88  88  88 88~~~~~ 88`8b
88  .8D   .88.   db   8D Y8b  d8 88booo. 88   88   .88.   88  88  88 88.     88 `88.
Y8888D' Y888888P `8888Y'  `Y88P' Y88888P YP   YP Y888888P YP  YP  YP Y88888P 88   YD
We dont check that castle and game are correctly linked
*/

var mongoose = require('mongoose');
var models = require('./models');
var userIDs = [];
var gameIDs = [];
var questuserIDs = [];
var castleLength = 0;

getRandomUserIDs = function() {
    var memberCount = Math.random() * userIDs.length + 1;
    var shuffled = userIDs.sort(function(){return .5 - Math.random()});
    var selected =shuffled.slice(0,memberCount);
    return selected;
}

getQuestIDs = function(memberArr) {
  var questIDs = [];

  memberArr.forEach(function(m){
    questuserIDs.forEach(function(q){
      if (m.toString() == q.userID.toString()) {
        questIDs.push(q.questID);
      }
    });
  });

  return questIDs;
}

//Before-grading URI
var mongoldb_uri = 'mongodb://heroku_1vr3s51g:9s5cs0ivlt4ineh760d7ndfa4u@ds155097.mlab.com:55097/heroku_1vr3s51g';
//Press-start URI
//var mongoldb_uri = 'mongodb://heroku_gc5bsfx7:75str8ep8qk1q7e55eiof8pmln@ds155097.mlab.com:55097/heroku_gc5bsfx7';
mongoose.Promise = global.Promise;
mongoose.connect(mongoldb_uri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {

    //get user IDs
    models.User
        .find({}, function(err, users) {
            users.forEach(function(u) {
                userIDs.push(u._id);
            });
            getGameIDs();
        });

    //get game IDs
    getGameIDs = function() {
      models.Game
          .find({}, function(err, games) {
              games.forEach(function(g) {
                  gameIDs.push(g._id);
              });
              getQuestuserIDs();
          });
    }

    //get task/user IDs
    getQuestuserIDs = function() {
      models.Quest
          .find({}, function(err, quests) {
              quests.forEach(function(q) {
                  questuserIDs.push({
                    "questID": q._id,
                    "userID": q.takenBy
                  });
              });
              updateQuests();
          });
    }

    //update quests to have user id linked to it
    updateQuests = function() {
        models.Castle
            .find()
            .exec(function(err, castles) {
                castleLength = castles.length;
                var i = 0;
                castles.forEach(function(c) {
                    //get random users
                    var memberArr = getRandomUserIDs();
                    var questArr = getQuestIDs(memberArr);
                    models.Castle.update({
                        _id: c._id
                    }, {
                        $set: {
                            game: gameIDs[i],
                            admin: memberArr[0],
                            members: memberArr,
                            quests: questArr
                        }
                    }, function(err, raw) {
                        if (err) console.log(err);
                        checkCloseDB();
                    });
                    i++;
                });
            });
    }

    //close db
    checkCloseDB = function() {
        castleLength--;
        console.log("Castles left to link: " + castleLength);
        if (castleLength <= 0) {
            printCastles();
        }
    }

    printCastles = function() {
        console.log("Printing linked castles");
        models.Castle.find()
            // .populate('game admin members quests',
            //           populate('takenBy'))
            .populate({
              path: 'game admin members quests',
              populate: {
                path: 'takenBy',
                model: 'User'
              }
            })
            .exec(function(err, castles) {
                if(castles == null) {
                  console.log("No castles");
                } else {
                  castles.forEach(function(castle){
                    console.log("------------------------------------");
                    if(castle.admin == null) {
                      console.log(castle.name + " has no admin");
                    } else {
                      console.log(castle.name + "'s admin is " + castle.admin.username);
                    }
                    if(castle.members == null) {
                      console.log(castle.name + " has no memebers");
                    } else {
                      console.log(castle.name + "'s members are:");
                      castle.members.forEach(function(m){
                        console.log(m.username);
                      });
                    }
                    if(castle.quests == null) {
                      console.log(castle.name + " has no quests");
                    } else {
                      console.log(castle.name + "'s quests are:");
                      castle.quests.forEach(function(q){
                        console.log(q.title + " taken by: " + q.takenBy.username);
                      });
                    }
                    if(castle.game == null) {
                      console.log(castle.name + " has no game lol");
                    } else {
                      console.log(castle.name + "'s hp " + castle.game.castleHealth);
                      console.log(castle.name + "'s monster's hp " + castle.game.monsterHealth );
                    }
                  });
                  console.log("------------------------------------");
                }
                closeDB();
            });
    }

    closeDB = function() {
        console.log("closing db");
        mongoose.connection.close();
    }
});
