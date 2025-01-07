const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prompt')
		.setDescription('Send a prompt to our uncensored llama2')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The prompt to send')
                .setRequired(true)),
	async execute(interaction) {

        return new Promise((resolve, reject) => {

        // if (numberInQueue >= 10){
        //     await interaction.reply(`There are currently ${numberInQueue - CONCURRENT_QUEUE_SIZE} prompts in the queue. Please wait your turn...`);
        // }

        console.log(interaction.options.getString("input"))
        // Log the channel ID and message content to the console
        console.log(`User ${interaction.user.id} with prompt: ${interaction.options.getString("input")}`);

        const url = "http://localhost:11434/api/generate"

        const data = {
            "prompt": interaction.options.getString("input"),
            "model": "llama2-uncensored:latest",
            "stream": true
        }

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(data)
        })
        .then((response) => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const TOKENS_TO_EDIT = 10;
            let tokens = 1;
            let result = "";
            return new ReadableStream({
                start(controller) {
                    return pump();
                    function pump() {
                        return reader.read().then(async ({ done, value }) => {
                            // When no more data needs to be consumed, close the stream
                            if (done) {
                                await interaction.editReply(result);
                                resolve("text");
                                controller.close();
                                return;
                            }
                            if (tokens % TOKENS_TO_EDIT === 0){
                                
                                await interaction.editReply(result);
                            }
                            
                            result += JSON.parse(decoder.decode(value)).response;
                            tokens++;
                           
                            // Enqueue the next data chunk into our target stream
                            controller.enqueue(value);
                            return pump();
                        });
                    }
                },
            });
        })
        .catch(async (error) => {
            console.error('Error:', error);
            await interaction.editReply("An error occured. Please try again later.")
            reject("ERROR");
        });
	},
    )}
};