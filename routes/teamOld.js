var data = require("../data/castles.json");
var dataUsers = require("../data/users.json");

exports.view = function(req, res) {
    var castle = req.app.locals.currentCastle;
    var users = castle.members;
    var currentUser = req.app.locals.currentUser;

    var tmpUsers = [];

    users.forEach(function(e){
      var user = {
        'username': '',
        'image': '',
        'numCompleted': '',
        'taskList': [],
        'currUser': false
      };
      user.username = e.username;

      if(currentUser != null) {
        if(currentUser.username === e.username) {
          user.currUser = true;
        }
      }

      dataUsers.users.forEach(function(u){
        if(u.username === e.username) {
          user.image = u.imageURL;
        }
      });

      if(user.image === "") {
        user.image = "PersonalAccount-01-01.png";
      }
      user.numCompleted = e.numCompleted;

      castle.quests.forEach(function(q) {
        if(q.takenBy === e.username && !q.completed ) {
          user.taskList.push({'task': q.title});
        }
      });

      tmpUsers.push(user);
    });


    var achievements = [
      {
        'image' : 'TeamInfo-01-01.png',
        'name' : 'Killed a boss!'
      } ,
      {
        'image' : 'TeamInfo-01-01.png',
        'name' : 'Protected 10 towns!'
      } ,
      {
        'image' : 'TeamInfo-01-01.png',
        'name' : 'No damage in a week!'
      } ,
      {
        'image' : 'TeamInfo-01-01.png',
        'name' : '7 quests completed'
      }
    ];


    function compareCompleted(a,b) {
      if (a.numCompleted > b.numCompleted)
        return -1;
      if (a.numCompleted < b.numCompleted)
        return 1;
      return 0;
    }

    function compareName(a,b) {
      if (a.username < b.username)
        return -1;
      if (a.username > b.username)
        return 1;
      return 0;
    }

    users = tmpUsers.slice();
    users.sort(compareName);

    rankings = tmpUsers.slice();
    rankings.sort(compareCompleted);



    res.render('team', {
        'users': users,
        'castleName': castle.name,
        'rankings': rankings,
        'achievements' : achievements
    });
};
