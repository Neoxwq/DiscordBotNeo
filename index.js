const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Using environment variables for tokens
const token = process.env.TOKEN;

// Create a Discord client with the required intent
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Set up a collection for commands
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Read all command files
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] Command in ${filePath} does not have "data" or "execute" property.`);
  }
}

// Event when the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Register global slash commands
  const rest = new REST({ version: '10' }).setToken(token);
  
  try {
    console.log('Starting refresh of application (/) commands globally.');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    console.log('Successfully registered application (/) commands globally.');
    console.log(`Bot is active in ${client.guilds.cache.size} servers!`);
  } catch (error) {
    console.error(error);
  }
  
  // Set bot status
  client.user.setActivity(`${client.guilds.cache.size} servers | /help`, { type: 'WATCHING' });
});

// Event when an interaction is received
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = `An error occurred while executing the command: ${error.message}`;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Event when the bot is added to a new server
client.on('guildCreate', guild => {
  console.log(`Bot added to a new server: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`${client.guilds.cache.size} servers | /help`, { type: 'WATCHING' });
  
  // Find a channel to send a welcome message
  const systemChannel = guild.systemChannel || 
                       guild.channels.cache.find(channel => 
                         channel.type === 'GUILD_TEXT' && 
                         channel.permissionsFor(guild.me).has('SEND_MESSAGES')
                       );
  
  if (systemChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Thank you for adding me!')
      .setDescription('Use `/help` to see the list of available commands.')
      .addFields(
        { name: 'Initial Setup', value: 'For the best experience, please create a `welcome` channel for new member notifications and a `logs` channel for logging.', inline: false }
      )
      .setFooter({ text: `This bot is running on ${client.guilds.cache.size} servers` });
    
    systemChannel.send({ embeds: [welcomeEmbed] });
  }
});

// Event when a new member joins
client.on('guildMemberAdd', async member => {
  const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
  if (!welcomeChannel) return;
  
  const welcomeEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('New Member!')
    .setDescription(`Welcome to the server, ${member}! We're glad to have you here.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setFooter({ text: `Member #${member.guild.memberCount}` });
  
  welcomeChannel.send({ embeds: [welcomeEmbed] });
});

// Simple logging system
client.on('messageDelete', async message => {
  if (message.author.bot) return;
  
  const logChannel = message.guild.channels.cache.find(ch => ch.name === 'logs');
  if (!logChannel) return;
  
  const deleteEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Message Deleted')
    .setDescription(`A message from ${message.author} was deleted from ${message.channel}`)
    .addFields(
      { name: 'Content', value: message.content || 'No text content' }
    )
    .setTimestamp();
  
  logChannel.send({ embeds: [deleteEmbed] });
});

// Bot login
client.login(token);