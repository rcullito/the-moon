var exports = module.exports = {};
var _ = require('lodash'),
  shortid = require('shortid');

// push individual writings from rooms to here as they are uncovered
var writingStore = [];
exports.writingStore = writingStore;

// push ids of rooms here as drones enter them
var exploredRooms =  [];

// helper function to sort and concatenate messages from all of the rooms
var generateMessage = function () {
  return _.chain(writingStore)
    .sortBy(function (roomMessage) {
      return roomMessage.order;
    })
    .reduce(function(concatenatedMessage, roomMessage) {
      return concatenatedMessage + ' ' + roomMessage.writing;
    }, '')
    .value();
};

exports.generateMessage = generateMessage;

// helper function to assist in processing data collected by concurrently deployed drones
var parseRoomData = function (data, roomType) {
  return _.chain(data)
  .map(roomType)
  .flatten()
  .uniq()
  .value();
};

exports.parseRoomData = parseRoomData;

// helper to ease handling deeply nested command response data
var parseResponse = function (inputData, attribute) {
  return _.chain(inputData)
    .filter(function (data) {
      return _.has(data, attribute);
    })
    .first()
    .value();
};

var updateWritingStore = function (messageContainer) {
  // there may not always be a message
  if (messageContainer) {
    var writing = messageContainer.writing || null;
    var order = messageContainer.order || null;
    if (writing && order) {
      writingStore.push({ order: order, writing: writing });
    }
  }
};

var generateNewRoomCommand = function (roomId) {
  var initialCommand = { 'commands': {} };
  // would a system for unique key names for commandId add value here?
  // given the limited scope of information contained within I opted for random strings
  // with business logic based off of those key's values.
  initialCommand.commands[ shortid.generate() ] = { 'explore': roomId };
  initialCommand.commands[ shortid.generate() ] = { 'read': roomId };
  return initialCommand;
};

exports.generateNewRoomCommand = generateNewRoomCommand;

var saveRoomData = function (err, data, roomId, callback) {
  if (err) {
    return callback(err);
  }
  // if we don't have it already, add to list of known rooms
  if (!_.includes(exploredRooms, roomId)) {
    exploredRooms.push(roomId);
  }

  // handle response data to make it easier to work with and apply business logic to
  var relevantData = _.values(data.results);
  var connectedRoomContainer = parseResponse(relevantData, 'connectedRooms');
  var connectedRooms = connectedRoomContainer.connectedRooms;
  var messageContainer = parseResponse(relevantData, 'writing');
  updateWritingStore(messageContainer);

  // the first time the below function is called, it is just with one drone, so the
  // newRooms are in fact correct

  // on subsequent calls of this function, with multiple drones, the new rooms will
  // only represent each drone's perspective on what has yet to be explored
  // we need to filter down back in the apollo module once all the drones from the current deploy have returned

  var newRoomsFromThisDronesPerspective = _.difference(connectedRooms, exploredRooms);
  // this callback will invoke newRoomSearch back in the apollo module
  // TODO this is being called every time. figure out how
  return callback(null, newRoomsFromThisDronesPerspective, exploredRooms);

};

exports.saveRoomData = saveRoomData;
