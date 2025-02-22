const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mcstatus')
    .setDescription('Check the status of a Minecraft server')
    .addStringOption(option =>
      option.setName('ip')
        .setDescription('IP or domain of the Minecraft server')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('port')
        .setDescription('Server port (default: 25565)')
        .setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();

    const serverIP = interaction.options.getString('ip');
    const serverPort = interaction.options.getString('port') || '25565';

    try {
      // Using a public API to check Minecraft server status
      const response = await fetch(`https://api.mcsrvstat.us/2/${serverIP}:${serverPort}`);
      const data = await response.json();

      if (!data.online) {
        return interaction.editReply({
          content: `❌ The Minecraft server \`${serverIP}:${serverPort}\` is offline or not found.`
        });
      }

      // Create an embed with server information
      const statusEmbed = new EmbedBuilder()
        .setColor('#5cb85c')
        .setTitle(`Server Status: ${data.hostname || serverIP}`)
        .setDescription(`✅ The server is online with ${data.players.online} players out of a maximum of ${data.players.max}.`)
        .setThumbnail(`https://api.mcsrvstat.us/icon/${serverIP}:${serverPort}`)
        .addFields(
          { name: 'Version', value: data.version || 'Unknown', inline: true },
          { name: 'Address', value: `\`${serverIP}:${serverPort}\``, inline: true },
          { name: 'MOTD', value: data.motd ? data.motd.clean.join('\n') : 'No MOTD available', inline: false }
        )
        .setTimestamp();

      // If there are online players and the list is available
      if (data.players.online > 0 && data.players.list) {
        const playersList = data.players.list.slice(0, 15).join(', ');
        const extraPlayers = data.players.online > 15 ? `and ${data.players.online - 15} more players...` : '';

        statusEmbed.addFields({
          name: `Online Players (${data.players.online})`,
          value: `${playersList}${extraPlayers ? `\n${extraPlayers}` : ''}`
        });
      }

      // If the server has mods
      if (data.mods && data.mods.names) {
        const modsCount = data.mods.names.length;
        const modsList = modsCount > 10
          ? `${data.mods.names.slice(0, 10).join(', ')} and ${modsCount - 10} more mods...`
          : data.mods.names.join(', ');

        statusEmbed.addFields({
          name: `Mods (${modsCount})`,
          value: modsList
        });
      }

      // If the server supports plugins and has a plugin list
      if (data.plugins && data.plugins.names) {
        const pluginsCount = data.plugins.names.length;
        const pluginsList = pluginsCount > 10
          ? `${data.plugins.names.slice(0, 10).join(', ')} and ${pluginsCount - 10} more plugins...`
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
        content: `An error occurred while checking the server status: ${error.message}`
      });
    }
  },
};
