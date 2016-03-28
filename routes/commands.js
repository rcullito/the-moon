var _ = require('lodash'),
  express = require('express'),
  router = express.Router();

var commandTypes = ['explore', 'read'];

// helper function to retrieve room info given its id
var findRoomById = function (roomId, rooms) {
  return _.find(rooms, function (room) {
    return room.roomId === roomId;
  });
};

// return writing and order information about a given room
var readRoom = function (roomId, rooms) {
  var currentRoom = findRoomById(roomId, rooms);
  var writing = currentRoom.writing;
  var order = currentRoom.order;

  return {
    writing: writing,
    order: order,
  };
};

// return information on a given room's connected passages
var exploreRoom = function (roomId, rooms) {
  var currentRoom = findRoomById(roomId, rooms);
  var connectedRooms = currentRoom.passages;
  return {
    connectedRooms: connectedRooms
  };
};

// determine the next course of actoin upon entering a room
var enterRoom = function (commandType, roomId, rooms) {
  if (commandType === 'explore') {
    return exploreRoom(roomId, rooms);
  }

  return readRoom(roomId, rooms);
};

// main route for handling drone commands
router.post('/drone/:droneId/commands', function (req, res, next) {

  var droneId = req.params.droneId;
  var rooms = req.app.locals.rooms;

  // if droneId is not included in array of known drowns, throw an error
  if (!_.includes(req.app.locals.availableDrones, droneId)) {
    var droneNotFound = new Error('droneId is invalid');
    droneNotFound.status = 404;
    return next(droneNotFound);
  }

  // ensure request body conforms to expected format
  var commands = req.body.commands;
  if (!commands) {
    var invalidCommands = new Error('invalid request body');
    invalidCommands.status = 400;
    return next(invalidCommands);
  }

  // examine each command and validate nested request structure
  // if all looks good, started responding to commands one at a time and
  // build up the results object

  var results = {};

  _.each(commands, function (command, commandId) {

    // validate that each command Id contains only one action
    var commandKeys =  _.keys(command);
    if (commandKeys.length !== 1) {
      var invalidCommandCount = new Error('invalid command count');
      invalidCommandCount.status = 400;
      return next(invalidCommandCount);
    }

    // validate command type
    var requestedCommandType = commandKeys[0];
    if (!_.includes(commandTypes, requestedCommandType)) {
      var invalidCommandType = new Error('invalid command type');
      invalidCommandType.status = 400;
      return next(invalidCommandType);
    }

    // at this point request body is valid. enter the room and take the appropriate action
    var singleCommandResponse = enterRoom(requestedCommandType, command[requestedCommandType], rooms);
    //store each command response in a results object that we'll return once
    // all commands have been processed
    results[commandId] = singleCommandResponse;

  });

  res.send({ results: results });

});

module.exports = router;
