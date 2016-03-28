var _ = require('lodash'),
  async = require('async'),
  request = require('supertest'),
  app = require('./app'),
  nasa = require('./nasa.js');

// this will be populated once the /start api returns
var availableDrones = [];

var deployDrone = function (droneId, roomId, callback) {
  // take advantage of existing functionality to deploy drones and proccess room data
  // but handle response in custom callback so that we can evaluate the results
  // of our concurrent search and decide whether to launch another deploy
  sendDroneToRoom(null, droneId, roomId, function (err, roomData) {
    if (!err) {
      nasa.saveRoomData(null, roomData, roomId, function (err, nextRooms, exploredRooms) {
        // this data represents individual persepctives
        // from each drone returning from its deploy

        // roll data into single object as async.map only takes one argument for its response
        var roomInfo = {
          nextRooms: nextRooms,
          exploredRooms: exploredRooms
        };

        return callback(null, roomInfo);
      })
    } else {
      return callback(err);
    }
  });
};

var assignDroneToRoom = function (roomId, callback) {
  // assume at start of all round trips batches, that each droid is available
  // but can only make one roundtrip at a time
  // available drones are loaded once the /start api returns
  var droneId = availableDrones.pop();

  if (!droneId) {
    // throw an error 409 Conflict if all drones are busy
    var droneBusy = new Error('all drones are currently busy');
    droneBusy.status = 409;
    return callback(droneBusy);
  }

  deployDrone(droneId, roomId, callback);

};

// this function is invoked first by saveRoomData in the helper module
// and is then called recursively from within the function itself
var newRoomSearch = function (err, newRooms, exploredRooms) {
  if (err) {
    console.log(err);
    return;
  }
  // use async map to send concurrent requests and only return once all
  // responses have come back
  async.map(newRooms, assignDroneToRoom, function (err, res) {
    if (!err) {
      var potentiallyNewRooms = nasa.parseRoomData(res, 'nextRooms');
      var totalExploredRooms = nasa.parseRoomData(res, 'exploredRooms');
      var newRooms = _.difference(potentiallyNewRooms, totalExploredRooms);

      if (_.isEmpty(newRooms)) {
        // if there aren't any new rooms, then stop recursion and try hitting the /report route
        console.log('so you think you have the secret to Jupiters moon?');
        checkWriting();
      } else {
        console.log('launching another deploy...');
        newRoomSearch(null, newRooms, totalExploredRooms);
      };
    } else {
      console.log('Error: ' + err);
    }
  });
};


var sendDroneToRoom = function(err, droneId, roomId, callback) {
  if (err) {
    return callback(err);
  }
  // for a single drone, scaffold its command. more notes in helper module
  var initialCommand = nasa.generateNewRoomCommand(roomId);

  request(app)
    .post(['/drone', droneId, 'commands'].join('/'))
    .send(initialCommand)
    .set('Accept', 'application/json')
    .set('x-commander-email', 'rob.culliton@gmail.com')
    .end(function(err, res) {
      if (err) {
        return callback(err);
      }

      // make drone available again
      availableDrones.push(droneId);

      // callback here is invoking the helper function saveRoomData
      // once it has performed its save, it will call newRoomSearch above
      return callback(null, res.body, roomId, newRoomSearch);
    });
};

var landOnGanymede = function (callback) {

  // call start to get the intial state for ganymede
  request(app)
    .get('/start')
    .set('Accept', 'application/json')
    .set('x-commander-email', 'rob.culliton@gmail.com')
    .end(function(err, res) {
      if (err) {
        return callback(err);
      }

      var data = res.body;
      // our search begins with a single room
      var roomId = data.roomId;
      // since we only know about one room, we're just sending one drone to it in this deployment
      // - note, referring to roundtrip requests as 'deployments' throughout the app
      availableDrones = availableDrones.concat(data.drones);
      var droneId = _.first(availableDrones);
      // the below callback is invoking the sendDroneToRoom function
      // we'll use this for our initial scouting, and make use of it later
      // as a building block for multi-drone deployments
      return callback(null, droneId, roomId, nasa.saveRoomData);
    });
};

// this is called once the program thinks it has seen all the rooms
var checkWriting = function () {

  var completedMessage = nasa.generateMessage();

  request(app)
    .post('/report')
    .send({ message: completedMessage })
    .set('Accept', 'application/json')
    .set('x-commander-email', 'rob.culliton@gmail.com')
    .end(function(err, res) {
      if (!err) {
        console.log(res.body.validation);
        console.log('Submitted answer:')
        console.log(res.body.originalMessage);
      }
    });
};

// kick off the application by landing on Ganymede
// follow JS convention, callback as last arg
landOnGanymede(sendDroneToRoom);
