var _ = require('lodash'),
  express = require('express'),
  router = express.Router();

// construct the actual labyrinth message to compare against the submitted response
var genreateLabyrinthMessage = function (rooms) {
  return  _.reduce(rooms, function (concatenatedMessage, room) {
      var roomWriting = room.writing || '';
      return concatenatedMessage + ' ' + roomWriting;
  }, "");
};

router.post('/', function(req, res, next) {

  var finalAnswer;
  var droneReport = req.body.message;
  var rooms = req.app.locals.rooms;
  var labyrinthMessage = genreateLabyrinthMessage(rooms);

  // whitespace shouldnt' preclude anyone from the truth
  if (droneReport.trim() === labyrinthMessage.trim()) {
    finalAnswer = 'Well done, commander.';
  } else {
    finalAnswer = 'That is not the correct message. But have hope. May you ever appear where you are most needed and least expected!';
  }

  res.send({ validation: finalAnswer, originalMessage: droneReport });
});

module.exports = router;
