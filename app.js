import * as Discord from 'discord.js';
import request from 'request-promise-native';

import * as tokenJson from './secret/token.json';

const client = new Discord.Client();

const options = {
  uri: 'https://shitposting.hakunimu.com/get-info-rooms',
  headers: {
    'User-Agent': 'Request-Promise',
  },
  json: true,
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
  if (msg.content === 'whoson') {
    getRoomUsersInfo()
        .then((info) => {
          const embed = new Discord.RichEmbed()
              .setColor(0xFF0092);

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
          msg.channel.send(embed)
              .then((botMessage)=>{
                botMessage.delete(10000);
              });
        })
        .catch((error) => {
          console.error(error);
          msg.reply('Fuck something broke');
        });
  }
});

client.login(tokenJson.token);

const getRoomUsersInfo = () => {
  return request(options);
};
