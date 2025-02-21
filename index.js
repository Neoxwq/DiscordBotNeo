const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Menggunakan environment variable untuk token
const token = process.env.TOKEN;

// Membuat client Discord dengan intent yang diperlukan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Menyiapkan collection untuk commands
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Membaca semua file command
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] Command di ${filePath} tidak memiliki property "data" atau "execute".`);
  }
}

// Event saat bot siap
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Mendaftarkan slash commands secara global
  const rest = new REST({ version: '10' }).setToken(token);
  
  try {
    console.log('Memulai refresh application (/) commands secara global.');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    console.log('Berhasil mendaftarkan application (/) commands secara global.');
    console.log(`Bot aktif di ${client.guilds.cache.size} server!`);
  } catch (error) {
    console.error(error);
  }
  
  // Set status bot
  client.user.setActivity(`${client.guilds.cache.size} server | /help`, { type: 'WATCHING' });
});

// Event saat interaksi diterima
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = `Terjadi kesalahan saat menjalankan command: ${error.message}`;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Event saat bot ditambahkan ke server baru
client.on('guildCreate', guild => {
  console.log(`Bot ditambahkan ke server baru: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`${client.guilds.cache.size} server | /help`, { type: 'WATCHING' });
  
  // Mencari channel untuk kirim pesan selamat datang
  const systemChannel = guild.systemChannel || 
                       guild.channels.cache.find(channel => 
                         channel.type === 'GUILD_TEXT' && 
                         channel.permissionsFor(guild.me).has('SEND_MESSAGES')
                       );
  
  if (systemChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Terima kasih telah menambahkan saya!')
      .setDescription('Gunakan `/help` untuk melihat daftar perintah yang tersedia.')
      .addFields(
        { name: 'Setup Awal', value: 'Untuk pengalaman terbaik, silakan buat channel `welcome` untuk pemberitahuan member baru dan `logs` untuk logging.', inline: false }
      )
      .setFooter({ text: `Bot ini berjalan di ${client.guilds.cache.size} server` });
    
    systemChannel.send({ embeds: [welcomeEmbed] });
  }
});

// Event saat anggota baru bergabung
client.on('guildMemberAdd', async member => {
  const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
  if (!welcomeChannel) return;
  
  const welcomeEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Anggota Baru!')
    .setDescription(`Selamat datang di server, ${member}! Kami senang kamu bergabung.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setFooter({ text: `Member #${member.guild.memberCount}` });
  
  welcomeChannel.send({ embeds: [welcomeEmbed] });
});

// Sistem logging sederhana
client.on('messageDelete', async message => {
  if (message.author.bot) return;
  
  const logChannel = message.guild.channels.cache.find(ch => ch.name === 'logs');
  if (!logChannel) return;
  
  const deleteEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Pesan Dihapus')
    .setDescription(`Pesan dari ${message.author} dihapus dari ${message.channel}`)
    .addFields(
      { name: 'Konten', value: message.content || 'Tidak ada konten text' }
    )
    .setTimestamp();
  
  logChannel.send({ embeds: [deleteEmbed] });
});

// Login bot
client.login(token);