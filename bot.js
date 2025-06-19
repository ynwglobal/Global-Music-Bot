const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    token: 'YOUR_BOT_TOKEN_HERE',
    prefix: '!',
    maxQueueSize: 100,
    defaultVolume: 50,
    autoLeave: 300000, // 5 minutes in ms
    colors: {
        primary: '#00ff88',
        error: '#ff4444',
        warning: '#ffaa00',
        success: '#44ff44'
    }
};

class MusicBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ]
        });

        this.queues = new Map(); // Guild ID -> Queue object
        this.players = new Map(); // Guild ID -> Audio player
        this.connections = new Map(); // Guild ID -> Voice connection
        this.filters = new Map(); // Guild ID -> Active filters
        this.autoplay = new Map(); // Guild ID -> Autoplay status
        this.djRoles = new Map(); // Guild ID -> DJ role ID
        this.musicChannels = new Map(); // Guild ID -> Music channel ID

        this.setupEventListeners();
        this.registerCommands();
    }

    setupEventListeners() {
        this.client.once('ready', () => {
            console.log(`🎵 ${this.client.user.tag} is ready to play music!`);
            this.client.user.setActivity('🎵 Music in voice channels', { type: 'LISTENING' });
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot || !message.content.startsWith(config.prefix)) return;
            
            const args = message.content.slice(config.prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            await this.handleCommand(message, command, args);
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            }
        });

        this.client.on('voiceStateUpdate', (oldState, newState) => {
            this.handleVoiceStateUpdate(oldState, newState);
        });
    }

    async registerCommands() {
        const commands = [
            new SlashCommandBuilder()
                .setName('play')
                .setDescription('Play a song')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Song name or YouTube URL')
                        .setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('skip')
                .setDescription('Skip the current song'),
            
            new SlashCommandBuilder()
                .setName('queue')
                .setDescription('Show the music queue'),
            
            new SlashCommandBuilder()
                .setName('volume')
                .setDescription('Set the volume')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Volume level (1-100)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)),
            
            new SlashCommandBuilder()
                .setName('filter')
                .setDescription('Apply audio filters')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Filter type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bassboost', value: 'bassboost' },
                            { name: 'Nightcore', value: 'nightcore' },
                            { name: 'Vaporwave', value: 'vaporwave' },
                            { name: 'Karaoke', value: 'karaoke' },
                            { name: 'Clear', value: 'clear' }
                        )),
            
            new SlashCommandBuilder()
                .setName('autoplay')
                .setDescription('Toggle autoplay mode'),
            
            new SlashCommandBuilder()
                .setName('247')
                .setDescription('Toggle 24/7 mode'),
            
            new SlashCommandBuilder()
                .setName('setup')
                .setDescription('Setup music channel and DJ role')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Music commands channel')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('djrole')
                        .setDescription('DJ role')
                        .setRequired(false))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        ];

        try {
            console.log('Registering slash commands...');
            await this.client.application.commands.set(commands);
            console.log('Slash commands registered successfully!');
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    async handleCommand(message, command, args) {
        const guildQueue = this.queues.get(message.guild.id);

        switch (command) {
            case 'play':
            case 'p':
                await this.play(message, args);
                break;
            case 'skip':
            case 's':
                await this.skip(message);
                break;
            case 'stop':
                await this.stop(message);
                break;
            case 'queue':
            case 'q':
                await this.showQueue(message);
                break;
            case 'pause':
                await this.pause(message);
                break;
            case 'resume':
                await this.resume(message);
                break;
            case 'volume':
            case 'vol':
                await this.setVolume(message, args);
                break;
            case 'nowplaying':
            case 'np':
                await this.nowPlaying(message);
                break;
            case 'shuffle':
                await this.shuffle(message);
                break;
            case 'loop':
                await this.toggleLoop(message, args);
                break;
            case 'remove':
                await this.removeTrack(message, args);
                break;
            case 'clear':
                await this.clearQueue(message);
                break;
            case 'filter':
                await this.applyFilter(message, args);
                break;
            case 'autoplay':
                await this.toggleAutoplay(message);
                break;
            case 'help':
                await this.showHelp(message);
                break;
        }
    }

    async handleSlashCommand(interaction) {
        const { commandName } = interaction;

        try {
            switch (commandName) {
                case 'play':
                    await this.playSlash(interaction);
                    break;
                case 'skip':
                    await this.skipSlash(interaction);
                    break;
                case 'queue':
                    await this.showQueueSlash(interaction);
                    break;
                case 'volume':
                    await this.setVolumeSlash(interaction);
                    break;
                case 'filter':
                    await this.applyFilterSlash(interaction);
                    break;
                case 'autoplay':
                    await this.toggleAutoplaySlash(interaction);
                    break;
                case '247':
                    await this.toggle247Slash(interaction);
                    break;
                case 'setup':
                    await this.setupSlash(interaction);
                    break;
            }
        } catch (error) {
            console.error('Slash command error:', error);
            await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        }
    }

    async play(message, args) {
        const query = args.join(' ');
        if (!query) {
            return message.reply('Please provide a song name or URL!');
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to play music!');
        }

        if (!this.checkDJPermissions(message.member, message.guild.id)) {
            return message.reply('You need DJ permissions to use this command!');
        }

        try {
            const song = await this.searchSong(query);
            if (!song) {
                return message.reply('No results found for your search!');
            }

            let guildQueue = this.queues.get(message.guild.id);

            if (!guildQueue) {
                guildQueue = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    volume: config.defaultVolume,
                    playing: true,
                    loop: 'off', // off, song, queue
                    autoplay: false,
                    filters: []
                };

                this.queues.set(message.guild.id, guildQueue);
                guildQueue.songs.push(song);

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator
                    });

                    guildQueue.connection = connection;
                    this.connections.set(message.guild.id, connection);
                    this.playSong(message.guild.id, guildQueue.songs[0]);
                } catch (error) {
                    console.error('Connection error:', error);
                    this.queues.delete(message.guild.id);
                    return message.reply('I could not join the voice channel!');
                }
            } else {
                guildQueue.songs.push(song);
                
                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🎵 Song Added to Queue')
                    .setDescription(`**${song.title}**\nDuration: ${song.duration}\nPosition in queue: ${guildQueue.songs.length}`)
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Requested by ${message.author.tag}` });

                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Play error:', error);
            message.reply('There was an error playing the song!');
        }
    }

    async searchSong(query) {
        try {
            if (ytdl.validateURL(query)) {
                const songInfo = await ytdl.getInfo(query);
                return {
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url,
                    duration: this.formatDuration(songInfo.videoDetails.lengthSeconds),
                    thumbnail: songInfo.videoDetails.thumbnails[0]?.url,
                    requester: null
                };
            } else {
                const searchResults = await ytSearch(query);
                if (searchResults.videos.length === 0) return null;

                const video = searchResults.videos[0];
                return {
                    title: video.title,
                    url: video.url,
                    duration: video.duration.timestamp,
                    thumbnail: video.thumbnail,
                    requester: null
                };
            }
        } catch (error) {
            console.error('Search error:', error);
            return null;
        }
    }

    async playSong(guildId, song) {
        const guildQueue = this.queues.get(guildId);
        if (!song) {
            if (guildQueue.autoplay) {
                // Implement autoplay logic here
                await this.handleAutoplay(guildId);
            } else {
                this.cleanup(guildId);
            }
            return;
        }

        try {
            const stream = ytdl(song.url, {
                filter: 'audioonly',
                highWaterMark: 1 << 25,
                quality: 'highestaudio'
            });

            const resource = createAudioResource(stream, { 
                metadata: { title: song.title } 
            });

            let player = this.players.get(guildId);
            if (!player) {
                player = createAudioPlayer();
                this.players.set(guildId, player);
            }

            player.play(resource);
            guildQueue.connection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle('🎵 Now Playing')
                    .setDescription(`**${song.title}**\nDuration: ${song.duration}`)
                    .setThumbnail(song.thumbnail);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('pause')
                            .setLabel('⏸️ Pause')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('skip')
                            .setLabel('⏭️ Skip')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setLabel('⏹️ Stop')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('queue')
                            .setLabel('📋 Queue')
                            .setStyle(ButtonStyle.Secondary)
                    );

                guildQueue.textChannel.send({ embeds: [embed], components: [row] });
            });

            player.on(AudioPlayerStatus.Idle, () => {
                if (guildQueue.loop === 'song') {
                    this.playSong(guildId, song);
                } else {
                    if (guildQueue.loop !== 'queue') {
                        guildQueue.songs.shift();
                    } else {
                        guildQueue.songs.push(guildQueue.songs.shift());
                    }
                    this.playSong(guildId, guildQueue.songs[0]);
                }
            });

            player.on('error', error => {
                console.error('Player error:', error);
                guildQueue.textChannel.send('An error occurred while playing the song!');
                guildQueue.songs.shift();
                this.playSong(guildId, guildQueue.songs[0]);
            });

        } catch (error) {
            console.error('Play song error:', error);
            guildQueue.textChannel.send('There was an error playing the song!');
            guildQueue.songs.shift();
            this.playSong(guildId, guildQueue.songs[0]);
        }
    }

    async skip(message) {
        const guildQueue = this.queues.get(message.guild.id);
        if (!guildQueue) {
            return message.reply('There is no song playing!');
        }

        if (!this.checkDJPermissions(message.member, message.guild.id)) {
            return message.reply('You need DJ permissions to skip songs!');
        }

        const player = this.players.get(message.guild.id);
        if (player) {
            player.stop();
            message.reply('⏭️ Song skipped!');
        }
    }

    async stop(message) {
        const guildQueue = this.queues.get(message.guild.id);
        if (!guildQueue) {
            return message.reply('There is no song playing!');
        }

        if (!this.checkDJPermissions(message.member, message.guild.id)) {
            return message.reply('You need DJ permissions to stop the music!');
        }

        guildQueue.songs = [];
        const player = this.players.get(message.guild.id);
        if (player) {
            player.stop();
        }
        
        this.cleanup(message.guild.id);
        message.reply('⏹️ Music stopped and queue cleared!');
    }

    async showQueue(message) {
        const guildQueue = this.queues.get(message.guild.id);
        if (!guildQueue || guildQueue.songs.length === 0) {
            return message.reply('The queue is empty!');
        }

        const queueList = guildQueue.songs.slice(0, 10).map((song, index) => {
            return `${index === 0 ? '🎵' : `${index}.`} **${song.title}** (${song.duration})`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🎵 Music Queue')
            .setDescription(queueList)
            .setFooter({ text: `Showing 1-${Math.min(10, guildQueue.songs.length)} of ${guildQueue.songs.length} songs` });

        if (guildQueue.songs.length > 10) {
            embed.addFields({ name: 'And More...', value: `${guildQueue.songs.length - 10} more songs in queue` });
        }

        message.reply({ embeds: [embed] });
    }

    async applyFilter(message, args) {
        const filterType = args[0]?.toLowerCase();
        if (!filterType) {
            return message.reply('Please specify a filter: bassboost, nightcore, vaporwave, karaoke, or clear');
        }

        const guildQueue = this.queues.get(message.guild.id);
        if (!guildQueue) {
            return message.reply('No music is currently playing!');
        }

        if (!this.checkDJPermissions(message.member, message.guild.id)) {
            return message.reply('You need DJ permissions to apply filters!');
        }

        let filters = this.filters.get(message.guild.id) || [];

        switch (filterType) {
            case 'bassboost':
                filters = ['bass=g=10'];
                break;
            case 'nightcore':
                filters = ['asetrate=48000*1.25'];
                break;
            case 'vaporwave':
                filters = ['asetrate=48000*0.8'];
                break;
            case 'karaoke':
                filters = ['pan=0.5|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1'];
                break;
            case 'clear':
                filters = [];
                break;
            default:
                return message.reply('Invalid filter! Available filters: bassboost, nightcore, vaporwave, karaoke, clear');
        }

        this.filters.set(message.guild.id, filters);
        
        // Restart current song with filters
        const currentSong = guildQueue.songs[0];
        const player = this.players.get(message.guild.id);
        if (player && currentSong) {
            player.stop();
            setTimeout(() => this.playSong(message.guild.id, currentSong), 1000);
        }

        message.reply(`🎛️ Applied ${filterType === 'clear' ? 'no' : filterType} filter!`);
    }

    async toggleAutoplay(message) {
        let guildQueue = this.queues.get(message.guild.id);
        if (!guildQueue) {
            guildQueue = { autoplay: false };
            this.queues.set(message.guild.id, guildQueue);
        }

        if (!this.checkDJPermissions(message.member, message.guild.id)) {
            return message.reply('You need DJ permissions to toggle autoplay!');
        }

        guildQueue.autoplay = !guildQueue.autoplay;
        this.autoplay.set(message.guild.id, guildQueue.autoplay);

        message.reply(`🔄 Autoplay ${guildQueue.autoplay ? 'enabled' : 'disabled'}!`);
    }

    checkDJPermissions(member, guildId) {
        const djRole = this.djRoles.get(guildId);
        if (!djRole) return true; // No DJ role set, everyone can use commands
        
        return member.roles.cache.has(djRole) || 
               member.permissions.has(PermissionFlagsBits.ManageChannels) ||
               member.permissions.has(PermissionFlagsBits.Administrator);
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    cleanup(guildId) {
        const connection = this.connections.get(guildId);
        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
        }

        const player = this.players.get(guildId);
        if (player) {
            player.stop();
            this.players.delete(guildId);
        }

        this.queues.delete(guildId);
        this.filters.delete(guildId);
    }

    handleVoiceStateUpdate(oldState, newState) {
        // Auto-leave when alone in voice channel
        if (oldState.channelId && !newState.channelId) {
            const connection = this.connections.get(oldState.guild.id);
            if (connection && oldState.channel.members.filter(m => !m.user.bot).size === 0) {
                setTimeout(() => {
                    const currentConnection = this.connections.get(oldState.guild.id);
                    if (currentConnection && oldState.channel.members.filter(m => !m.user.bot).size === 0) {
                        this.cleanup(oldState.guild.id);
                    }
                }, config.autoLeave);
            }
        }
    }

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🎵 Music Bot Commands')
            .addFields(
                { name: '🎵 Music Commands', value: '`play/p <song>` - Play a song\n`skip/s` - Skip current song\n`stop` - Stop music and clear queue\n`pause` - Pause the music\n`resume` - Resume the music', inline: true },
                { name: '📋 Queue Commands', value: '`queue/q` - Show queue\n`shuffle` - Shuffle queue\n`loop <off/song/queue>` - Set loop mode\n`remove <number>` - Remove song from queue\n`clear` - Clear queue', inline: true },
                { name: '🎛️ Audio Commands', value: '`volume/vol <1-100>` - Set volume\n`filter <type>` - Apply audio filter\n`nowplaying/np` - Show current song\n`autoplay` - Toggle autoplay', inline: true }
            )
            .setFooter({ text: 'Use slash commands (/) for a better experience!' });

        message.reply({ embeds: [embed] });
    }

    // Slash command implementations
    async playSlash(interaction) {
        const query = interaction.options.getString('query');
        await interaction.deferReply();
        
        // Convert to message-like object for reuse
        const mockMessage = {
            member: interaction.member,
            guild: interaction.guild,
            channel: interaction.channel,
            reply: (content) => interaction.editReply(content)
        };

        await this.play(mockMessage, query.split(' '));
    }

    async skipSlash(interaction) {
        const mockMessage = {
            member: interaction.member,
            guild: interaction.guild,
            reply: (content) => interaction.reply(content)
        };

        await this.skip(mockMessage);
    }

    async showQueueSlash(interaction) {
        const mockMessage = {
            guild: interaction.guild,
            reply: (content) => interaction.reply(content)
        };

        await this.showQueue(mockMessage);
    }

    async setVolumeSlash(interaction) {
        const volume = interaction.options.getInteger('level');
        const mockMessage = {
            member: interaction.member,
            guild: interaction.guild,
            reply: (content) => interaction.reply(content)
        };

        await this.setVolume(mockMessage, [volume.toString()]);
    }

    async applyFilterSlash(interaction) {
        const filterType = interaction.options.getString('type');
        const mockMessage = {
            member: interaction.member,
            guild: interaction.guild,
            reply: (content) => interaction.reply(content)
        };

        await this.applyFilter(mockMessage, [filterType]);
    }

    async toggleAutoplaySlash(interaction) {
        const mockMessage = {
            member: interaction.member,
            guild: interaction.guild,
            reply: (content) => interaction.reply(content)
        };

        await this.toggleAutoplay(mockMessage);
    }

    async toggle247Slash(interaction) {
        // Implementation for 24/7 mode
        const guildQueue = this.queues.get(interaction.guild.id);
        if (!guildQueue) {
            return interaction.reply('No music session active!');
        }

        if (!this.checkDJPermissions(interaction.member, interaction.guild.id)) {
            return interaction.reply('You need DJ permissions to toggle 24/7 mode!');
        }

        guildQueue.alwaysOn = !guildQueue.alwaysOn;
        interaction.reply(`🔄 24/7 mode ${guildQueue.alwaysOn ? 'enabled' : 'disabled'}!`);
    }

    async setupSlash(interaction) {
        const channel = interaction.options.getChannel('channel');
        const djRole = interaction.options.getRole('djrole');

        if (channel) {
            this.musicChannels.set(interaction.guild.id, channel.id);
        }

        if (djRole) {
            this.djRoles.set(interaction.guild.id, djRole.id);
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎵 Bot Setup Complete')
            .setDescription('Music bot has been configured for this server!')
            .addFields(
                { name: 'Music Channel', value: channel ? `<#${channel.id}>` : 'Not set', inline: true },
                { name: 'DJ Role', value: djRole ? `<@&${djRole.id}>` : 'Not set', inline: true }
            );

        interaction.reply({ embeds: [embed] });
    }

    async handleButtonInteraction(interaction) {
        const { customId } = interaction;
        
        const mockMessage = {
            member: interaction.member,
            guild: interaction.guild,
            channel: interaction.channel,
            reply: (content) => interaction.reply(content)
        };

        switch (customId) {
            case 'pause':
                await this.pause(mockMessage);
                break;
            case 'skip':
                await this.skip(mockMessage);
                break;
            case 'stop':
                await this.stop(mockMessage);
                break;
            case 'queue':
                await this.showQueue(mockMessage);
                break;
        }
    }

    async pause(message) {
        const player = this.players.get(message.guild.id);
        if (!player) {
            return message.reply('No music is currently playing!');
        }

        player.pause();
        message.reply('⏸️ Music paused!');
    }

    async resume(message) {
        const player = this.players.get(message.guild.id);
        if (!player) {
            return message.reply('No music is currently playing!');
        }

        player.unpause();
        message.reply('▶️ Music resumed!');
    }

    async setVolume(message, args) {
        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 1 || volume > 100) {
            return message.reply('Please provide a volume between 1 and 100!');
        }

        const guildQueue = this.queues.get(message.guild.id);
        if (!guildQueue) {
            return message.reply('No music is currently playing!');
        }

        if (!this.checkDJPermissions(message.member, message.guild.id)) {
            return message.reply('You need DJ permissions to change volume!');
        }

        guildQueue.volume = volume;
        message.reply(`🔊 Volume set to ${volume}%!`);
    }

    start() {
        this.client.login(config.token);
    }
}

// Create and start the bot
const musicBot = new MusicBot();
musicBot.start();

module.exports = MusicBot;
