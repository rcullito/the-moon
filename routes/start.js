var _ = require('lodash'),
  express = require('express');
var router = express.Router();

var determineStartingRoomId = function (startingRoom) {
  if (startingRoom) {
    return startingRoom.roomId;
  }
  // borrowing convention established from documenation for "order". assume -1 is equivalent to not valid
  return -1;
};

router.get('/', function(req, res, next) {

  // find the first ordered room, and assume that this is the entrance to the labyrinth
  var startingRoom = _.find(req.app.locals.rooms, function(room) {
    return room.order == 1;
  });

  var initialState = {
    // start with room whose order was 1
    roomId: determineStartingRoomId(startingRoom),
    drones: req.app.locals.availableDrones
  };

  res.send(initialState);
});

module.exports = router;
