require("dotenv").config();
const path = require('path');
const fs = require('fs');
const wait = require('node:timers/promises').setTimeout;
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const deployCommands = require('./deploy/deployCommands');
// Load environment variables
const channelID = process.env.DISCORD_LLAMA2_BOT_CHANNEL_ID; 
const BOT_TOKEN = process.env.DISCORD_LLAMA2_BOT_TOKEN; 

const CONCURRENT_QUEUE_SIZE = 2;

let global_queue = [];


// Create an instance of Client and set the intents to listen for messages.
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


for (const folder of commandFolders) {
    console.log(folder)
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
        console.log(file)
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
            console.log("this is true")
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

//Register our commands
deployCommands();

// Once the WebSocket is connected, log a message to the console.
client.once(Events.ClientReady, () => {
    console.log('Bot is online!');
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
        if (interaction.commandName === "prompt"){
            global_queue.push(interaction);
            const processQueue = async (interaction) => {
                console.log(interaction)
                let currentPosition = global_queue.length;

                if (global_queue.length > CONCURRENT_QUEUE_SIZE){
                    //We have to wait for the 10th spot to open up
                    wait(2000)
                    await interaction.editReply(`There are ${currentPosition - CONCURRENT_QUEUE_SIZE} people in the queue. Please wait your turn...`);
                }
                else{
                    console.log(interaction)
                    await command.execute(interaction); 

                    const removedDoneFromQueue = global_queue.filter(e => e.id !== interaction.id);
                    global_queue = removedDoneFromQueue;

                    console.log(global_queue)

                    if (global_queue.length < 1){
                        return;
                    }
                    else if (global_queue.length >= CONCURRENT_QUEUE_SIZE){
                        processQueue(global_queue[CONCURRENT_QUEUE_SIZE - 1]);
                    }
                    else{
                        //Process the last element
                        processQueue(global_queue[0]);
                    }
                }
            }
            await interaction.deferReply();
            processQueue(interaction);
        }
        else{
            await command.execute(interaction);
        }
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Log in with the bot's token.
client.login(BOT_TOKEN);
