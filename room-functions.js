import * as Discord from 'discord.js';
import request from 'request-promise-native';

import * as config from './secret/config';

const OPTIONS = config.requestOptions;

let botChannel;
let lastRoomInfo;

const updateRoomUsersMessage = (bc) => {
  botChannel = bc;
  getRoomUsersInfo()
      .then(checkAndSendMessage)
      .catch((error) => {
        console.error(error);
        botChannel.send('something broke OH NONONO');
      });
};

const checkAndSendMessage = (info) => {
  if (roomInfoChanged(info, lastRoomInfo)) {
    deleteBotMessages()
        .then(() => {
          sendRoomMembersMessages(info);
        });
    lastRoomInfo = info;
  }
};

const deleteBotMessages = () => {
  return botChannel.fetchMessages()
      .then((messages) => {
        return messages.filter((m) => {
          return m.author.id === config.botId;
        });
      })
      .then((filteredMessages) => {
        botChannel.bulkDelete(filteredMessages);
      }).then(() => {
        return Promise.resolve();
      })
      .catch(console.error);
};

const sendRoomMembersMessages = (roomsObject) => {
  const roomNames = Object.keys(roomsObject);
  roomNames.sort();
  roomNames.forEach((roomName) => {
    botChannel.send(buildRoomEmbed(roomName, roomsObject[roomName]));
  });
};

const buildRoomEmbed = (roomName, userList) => {
  const embed = new Discord.RichEmbed();

  // Build room title and link
  embed.setTitle(roomName);
  embed.setURL(config.jitsiServerBaseUrl + roomName);

  // Build description (list of names)
  let names = '';
  let first = true;
  userList.sort();
  userList.forEach((nickName) => {
    if (!first) {
      names += '\n';
    } else {
      first = false;
    }
    names += nickName;
  });
  embed.setDescription(names);

  return embed;
};

const getRoomUsersInfo = () => {
  return request(OPTIONS);
};

const roomInfoChanged = (oldRooms, newRooms) => {
  if (oldRooms === undefined && newRooms === undefined) {
    return false;
  } else if (oldRooms === undefined || newRooms === undefined) {
    return true;
  }

  if (Object.keys(oldRooms).length !== Object.keys(newRooms).length) {
    return true;
  }

  for (const roomName in oldRooms) {
    // If some of the room names differ
    if (!oldRooms.hasOwnProperty(roomName)
      || !newRooms.hasOwnProperty(roomName)) {
      return true;
    }
    // If the rooms have different people
    if (oldRooms[roomName].length !== newRooms[roomName].length) {
      return true;
    }
    for (const p in oldRooms[roomName]) {
      if (!newRooms[roomName].hasOwnProperty(p)
        || newRooms[roomName][p] === undefined) {
        return true;
      }
    }
  }
  return false;
};


module.exports = {
  updateRoomUsersMessage: updateRoomUsersMessage,
};
