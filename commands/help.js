// commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar semua perintah atau info tentang perintah tertentu')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Nama perintah yang ingin ditampilkan informasinya')
        .setRequired(false)),
  async execute(interaction) {
    const { commands } = interaction.client;
    const commandName = interaction.options.getString('command');
    
    if (!commandName) {
      // Jika tidak ada command yang disebutkan, tampilkan semua command
      const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Daftar Perintah')
        .setDescription('Berikut adalah daftar semua perintah yang tersedia:')
        .setFooter({ text: 'Gunakan /help [nama perintah] untuk informasi lebih detail' });
      
      // Kelompokkan command berdasarkan kategori
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
        helpEmbed.addFields({ name: '🛡️ Moderasi', value: moderationCommands.join('\n') });
      }
      
      if (utilityCommands.length > 0) {
        helpEmbed.addFields({ name: '🔧 Utilitas', value: utilityCommands.join('\n') });
      }
      
      return interaction.reply({ embeds: [helpEmbed] });
    }
    
    // Jika nama command disebutkan, tampilkan info detail
    const command = commands.get(commandName);
    
    if (!command) {
      return interaction.reply({
        content: `Tidak ada perintah dengan nama \`${commandName}\`!`,
        ephemeral: true
      });
    }
    
    const commandEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Command: /${command.data.name}`)
      .setDescription(command.data.description);
    
    // Jika command memiliki subcommand
    if (command.data.options && command.data.options.some(opt => opt.type === 1)) {
      const subcommands = command.data.options.filter(opt => opt.type === 1);
      const subCommandsList = subcommands.map(sub => `\`${sub.name}\`: ${sub.description}`).join('\n');
      commandEmbed.addFields({ name: 'Subcommand', value: subCommandsList });
    }
    
    // Jika command memiliki opsi
    if (command.data.options && command.data.options.some(opt => opt.type !== 1)) {
      const options = command.data.options.filter(opt => opt.type !== 1);
      const optionsList = options.map(opt => {
        const required = opt.required ? '(wajib)' : '(opsional)';
        return `\`${opt.name}\`: ${opt.description} ${required}`;
      }).join('\n');
      
      if (optionsList) {
        commandEmbed.addFields({ name: 'Opsi', value: optionsList });
      }
    }
    
    interaction.reply({ embeds: [commandEmbed] });
  },
};