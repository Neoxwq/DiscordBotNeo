// commands/mcstatus.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mcstatus')
    .setDescription('Memeriksa status server Minecraft')
    .addStringOption(option =>
      option.setName('ip')
        .setDescription('IP atau domain server Minecraft')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('port')
        .setDescription('Port server (default: 25565)')
        .setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    
    const serverIP = interaction.options.getString('ip');
    const serverPort = interaction.options.getString('port') || '25565';
    
    try {
      // Menggunakan API publik untuk mengecek status server Minecraft
      const response = await fetch(`https://api.mcsrvstat.us/2/${serverIP}:${serverPort}`);
      const data = await response.json();
      
      if (!data.online) {
        return interaction.editReply({
          content: `❌ Server Minecraft \`${serverIP}:${serverPort}\` sedang offline atau tidak ditemukan.`
        });
      }
      
      // Membuat embed dengan informasi server
      const statusEmbed = new EmbedBuilder()
        .setColor('#5cb85c')
        .setTitle(`Status Server: ${data.hostname || serverIP}`)
        .setDescription(`✅ Server sedang online dengan ${data.players.online} pemain dari maksimal ${data.players.max} pemain.`)
        .setThumbnail(`https://api.mcsrvstat.us/icon/${serverIP}:${serverPort}`)
        .addFields(
          { name: 'Versi', value: data.version || 'Tidak diketahui', inline: true },
          { name: 'Alamat', value: `\`${serverIP}:${serverPort}\``, inline: true },
          { name: 'MOTD', value: data.motd ? data.motd.clean.join('\n') : 'Tidak ada MOTD', inline: false }
        )
        .setTimestamp();
      
      // Jika ada daftar pemain dan tidak kosong
      if (data.players.online > 0 && data.players.list) {
        const playersList = data.players.list.slice(0, 15).join(', ');
        const extraPlayers = data.players.online > 15 ? `dan ${data.players.online - 15} pemain lainnya...` : '';
        
        statusEmbed.addFields({
          name: `Pemain Online (${data.players.online})`,
          value: `${playersList}${extraPlayers ? `\n${extraPlayers}` : ''}`
        });
      }
      
      // Jika ada mods
      if (data.mods && data.mods.names) {
        const modsCount = data.mods.names.length;
        const modsList = modsCount > 10 
          ? `${data.mods.names.slice(0, 10).join(', ')} dan ${modsCount - 10} mod lainnya...`
          : data.mods.names.join(', ');
        
        statusEmbed.addFields({
          name: `Mods (${modsCount})`,
          value: modsList
        });
      }
      
      // Jika server mendukung plugin dan ada daftar plugin
      if (data.plugins && data.plugins.names) {
        const pluginsCount = data.plugins.names.length;
        const pluginsList = pluginsCount > 10
          ? `${data.plugins.names.slice(0, 10).join(', ')} dan ${pluginsCount - 10} plugin lainnya...`
          : data.plugins.names.join(', ');
        
        statusEmbed.addFields({
          name: `Plugins (${pluginsCount})`,
          value: pluginsList
        });
      }
      
      await interaction.editReply({ embeds: [statusEmbed] });
    } catch (error) {
      console.error('Error fetching Minecraft server status:', error);
      await interaction.editReply({
        content: `Terjadi kesalahan saat memeriksa status server: ${error.message}`
      });
    }
  },
};