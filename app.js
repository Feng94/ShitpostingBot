import * as Discord from 'discord.js';
import request from 'request-promise-native';

import * as tokenJson from './secret/token.json';
import * as config from './secret/config.json';

const client = new Discord.Client();
const MS_PER_SECOND = 1000;
const POLL_INTERVAL = config.pollInterval * MS_PER_SECOND;
const OPTIONS = config.requestOptions;

let botChannel = undefined;
let lastRoomInfo = {'initial': 'lol'};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  botChannel = client.channels.get(config.channelId);

  setInterval(updateRoomUsersMessage, POLL_INTERVAL);
});

client.login(tokenJson.token);

const updateRoomUsersMessage = () => {
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
          sendMessage(info);
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

const sendMessage = (info) => {
  const embed = new Discord.RichEmbed();

  Object.keys(info).forEach((roomname) => {
    let names = '';
    let first = true;
    const room = info[roomname];
    room.sort();
    room.forEach((nickName) => {
      if (!first) {
        names += ', ';
      } else {
        first = false;
      }
      names += nickName;
    });
    embed.addField(roomname, names);
  });
  botChannel.send(embed);
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
      if (!newRooms[roomName].hasOwnProperty(p) || newRooms[roomName][p] === undefined) {
        return true;
      }
    }
  }
  return false;
};
