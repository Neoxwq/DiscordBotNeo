// commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of all commands or info about a specific command')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('The name of the command to get information about')
        .setRequired(false)),
  async execute(interaction) {
    const { commands } = interaction.client;
    const commandName = interaction.options.getString('command');
    
    if (!commandName) {
      // If no command is specified, show all commands
      const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Command List')
        .setDescription('Here is a list of all available commands:')
        .setFooter({ text: 'Use /help [command name] for more details' });
      
      // Categorize commands
      const generalCommands = [];
      const moderationCommands = [];
      const utilityCommands = [];
      
      commands.forEach(command => {
        if (command.data.name === 'mod') {
          moderationCommands.push(`\`${command.data.name}\`: ${command.data.description}`);
        } else if (['userinfo', 'ping', 'help'].includes(command.data.name)) {
          utilityCommands.push(`\`${command.data.name}\`: ${command.data.description}`);
        } else {
          generalCommands.push(`\`${command.data.name}\`: ${command.data.description}`);
        }
      });
      
      if (generalCommands.length > 0) {
        helpEmbed.addFields({ name: '📌 General', value: generalCommands.join('\n') });
      }
      
      if (moderationCommands.length > 0) {
        helpEmbed.addFields({ name: '🛡️ Moderation', value: moderationCommands.join('\n') });
      }
      
      if (utilityCommands.length > 0) {
        helpEmbed.addFields({ name: '🔧 Utility', value: utilityCommands.join('\n') });
      }
      
      return interaction.reply({ embeds: [helpEmbed] });
    }
    
    // If a command name is provided, show detailed info
    const command = commands.get(commandName);
    
    if (!command) {
      return interaction.reply({
        content: `There is no command with the name \`${commandName}\`!`,
        ephemeral: true
      });
    }
    
    const commandEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Command: /${command.data.name}`)
      .setDescription(command.data.description);
    
    // If the command has subcommands
    if (command.data.options && command.data.options.some(opt => opt.type === 1)) {
      const subcommands = command.data.options.filter(opt => opt.type === 1);
      const subCommandsList = subcommands.map(sub => `\`${sub.name}\`: ${sub.description}`).join('\n');
      commandEmbed.addFields({ name: 'Subcommands', value: subCommandsList });
    }
    
    // If the command has options
    if (command.data.options && command.data.options.some(opt => opt.type !== 1)) {
      const options = command.data.options.filter(opt => opt.type !== 1);
      const optionsList = options.map(opt => {
        const required = opt.required ? '(required)' : '(optional)';
        return `\`${opt.name}\`: ${opt.description} ${required}`;
      }).join('\n');
      
      if (optionsList) {
        commandEmbed.addFields({ name: 'Options', value: optionsList });
      }
    }
    
    interaction.reply({ embeds: [commandEmbed] });
  },
};
