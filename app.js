import * as Discord from 'discord.js';
import request from 'request-promise-native';

import * as tokenJson from './secret/token.json';
import * as config from './secret/config.json';
import {updateRoomUsersMessage} from './room-functions';

const client = new Discord.Client();
const MS_PER_SECOND = 1000;
const POLL_INTERVAL = config.pollInterval * MS_PER_SECOND;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const botChannel = client.channels.get(config.channelId);

  setInterval(() => {
    updateRoomUsersMessage(botChannel);
  }, POLL_INTERVAL);
});

client.login(tokenJson.token);

