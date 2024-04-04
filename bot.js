const { Telegraf } = require('telegraf')
const { GameDig } = require('gamedig'); 
const fs = require("fs");
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.start((ctx) => ctx.reply('This bot only works after executing /notify [ip]:[port] [time to notify] and only works once.'))

function addUser(userId, ip, port, userTime) {
    let users = JSON.parse(fs.readFileSync('users.json'));

    if (users[userId]) {
        return null;
    }

    users[userId] = {
        timeToNotify: userTime,
        server: {
            ip: ip,
            port: port
        }
    };

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    return users[userId];
}

function getUser(userId) {
    const users = JSON.parse(fs.readFileSync('users.json'));

    if (!users[userId]) {
        return null;
    }

    return users[userId];
}

function removeUser(userId) {
    let users = JSON.parse(fs.readFileSync('users.json'));

    if (!users[userId]) {
        return null;
    }

    delete users[userId];

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    return true;
}

async function serverQuery(ip, port) {
    try {
        const state = await GameDig.query({
            type: "dayz",
            host: ip,
            port: port
        });
        return state;
    } catch (error) {
        console.log(`Server is offline, error: ${error}`);
        return null;
    }
}

bot.command("notify", async (ctx) => {
    if(ctx.args.length < 2) {
        return ctx.reply("You have to specify [ip]:[port] and [hour:minute].")
    }

    const ip = ctx.args[0].split(":")[0]
    const port = ctx.args[0].split(":")[1]
    const userTime = ctx.args[1].split(":")
    if(userTime.length != 2) {
        return ctx.reply("You have to specify time in the following format: [hour:minute].")
    }
    else if(userTime[0] < 0 || userTime[0] > 23 || userTime[1] < 0 || userTime[1] > 59) {
        return ctx.reply("Time must be in the following format: [hour:minute].")
    }

    let server = await serverQuery(ip, port)
    if(server == null) {
        return ctx.reply("Server is offline or unreachable. Try using query port instead of a game port.")
    }

    let user = addUser(ctx.update.message.from.id, ip, port, userTime)
    if(user == null) {
        return ctx.reply("You are already subscribed to the server. To delete it, use /unsubscribe.")
    }
    
    ctx.reply(`Server is online and you will be notified when ${userTime[0]}:${userTime[1]} is reached.`)
});

bot.command("unsubscribe", async (ctx) => {
    let user = removeUser(ctx.update.message.from.id)
    if(user == null) {
        return ctx.reply("You are not subscribed to any server.")
    }
    ctx.reply("You are unsubscribed from the server.")
});

setInterval(async () => {
    console.log('Checking users...');
    const users = JSON.parse(fs.readFileSync('users.json'));
    console.log(`Found ${Object.keys(users).length} users`);
    Object.entries(users).forEach(async ([userId, user]) => {
        console.log(`Checking user ${userId}`);
        const [serverHour, serverMinute] = await serverQuery(user.server.ip, user.server.port).then(s => {
            console.log(`Server time is ${s.raw.time}`);
            return s.raw.time.split(':');
        });
        const [notifyHour, notifyMinute] = user.timeToNotify;

        if(parseInt(serverHour) > parseInt(notifyHour) || (parseInt(serverHour) == parseInt(notifyHour) && parseInt(serverMinute) >= parseInt(notifyMinute))) {
            console.log(`Notifying user ${userId}`);
            const formattedTimeDiff = `${parseInt(serverHour) - parseInt(notifyHour)}:${(60 + parseInt(serverMinute) - parseInt(notifyMinute))%60}`;
            bot.telegram.sendMessage(parseInt(userId), `Server has reached ${notifyHour}:${notifyMinute}.\nServer time: ${serverHour}:${(serverMinute.length === 1 ? '0' : '') + serverMinute}\nBot was late by: ${formattedTimeDiff}`);

            console.log(`Removing user ${userId}`);
            removeUser(userId);
        }
    });
}, 60000)

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))