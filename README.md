# Global-Music-Bot
Best discord music bot.
# 🎵 Advanced Discord Music Bot

A powerful, feature-rich Discord music bot that rivals Green-bot with modern features and easy setup.

## ✨ Features

### 🎵 Core Music Features
- **High-quality audio streaming** from YouTube
- **Queue management** with unlimited songs
- **Loop modes**: Off, Song, Queue
- **Shuffle** and **autoplay** functionality
- **Volume control** (1-100%)
- **Pause/Resume** controls
- **Skip** and **stop** commands

### 🎛️ Advanced Audio Features
- **Audio filters**: Bassboost, Nightcore, Vaporwave, Karaoke
- **Real-time filter switching**
- **Custom audio processing**
- **High-quality audio streaming**

### 🎮 Interactive Controls
- **Button-based controls** for easy interaction
- **Slash commands** for modern Discord experience
- **Rich embeds** with song information and thumbnails
- **Real-time now playing** display

### 🛡️ Server Management
- **DJ role system** for permission control
- **Dedicated music channels**
- **24/7 mode** for continuous music
- **Auto-leave** when voice channel is empty
- **Server-specific settings**

### 🎯 User Experience
- **Dual command system**: Prefix (`!`) and Slash (`/`) commands
- **Queue visualization** with pagination
- **Song search** by name or direct YouTube URLs
- **Error handling** and user feedback
- **Help system** with detailed command information

## 🚀 Quick Setup

### Prerequisites
- Node.js 16.0.0 or higher
- Discord Bot Token
- FFmpeg (for audio processing)

### Installation Steps

1. **Clone/Download the bot files**
   ```bash
   # Create a new directory
   mkdir discord-music-bot
   cd discord-music-bot
   
   # Copy the bot.js and package.json files
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install FFmpeg**
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg` or `sudo yum install ffmpeg`

4. **Create Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section
   - Create a bot and copy the token
   - Enable "Message Content Intent" in Bot settings

5. **Configure the bot**
   - Open `bot.js`
   - Replace `'YOUR_BOT_TOKEN_HERE'` with your actual bot token
   - Optionally customize the `config` object

6. **Invite bot to server**
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Connect`, `Speak`, `Use Voice Activity`, `Send Messages`, `Use Slash Commands`
   - Use the generated URL to invite the bot

7. **Start the bot**
   ```bash
   npm start
   ```

## 📋 Commands

### 🎵 Music Commands
| Command | Slash | Description |
|---------|-------|-------------|
| `!play <song>` | `/play` | Play a song from YouTube |
| `!skip` | `/skip` | Skip the current song |
| `!stop` | - | Stop music and clear queue |
| `!pause` | - | Pause the current song |
| `!resume` | - | Resume the paused song |
| `!nowplaying` | - | Show currently playing song |

### 📋 Queue Commands
| Command | Slash | Description |
|---------|-------|-------------|
| `!queue` | `/queue` | Show the music queue |
| `!shuffle` | - | Shuffle the queue |
| `!loop <mode>` | - | Set loop mode (off/song/queue) |
| `!remove <number>` | - | Remove song from queue |
| `!clear` | - | Clear the entire queue |

### 🎛️ Audio Commands
| Command | Slash | Description |
|---------|-------|-------------|
| `!volume <1-100>` | `/volume` | Set playback volume |
| `!filter <type>` | `/filter` | Apply audio filters |
| `!autoplay` | `/autoplay` | Toggle autoplay mode |

### ⚙️ Admin Commands
| Command | Slash | Description |
|---------|-------|-------------|
| - | `/setup` | Configure music channel and DJ role |
| - | `/247` | Toggle 24/7 mode |

### 📖 Other Commands
| Command | Description |
|---------|-------------|
| `!help` | Show all available commands |

## 🎛️ Audio Filters

- **Bassboost** - Enhanced bass frequencies
- **Nightcore** - Faster tempo, higher pitch
- **Vaporwave** - Slower tempo, lower pitch  
- **Karaoke** - Vocal isolation/removal
- **Clear** - Remove all filters

## 🛠️ Configuration

### Bot Settings
```javascript
const config = {
    token: 'YOUR_BOT_TOKEN_HERE',
    prefix: '!',                    // Command prefix
    maxQueueSize: 100,              // Maximum songs in queue
    defaultVolume: 50,              // Default volume (1-100)
    autoLeave: 300000,              // Auto-leave timeout (5 minutes)
    colors: {
        primary: '#00ff88',         // Primary embed color
        error: '#ff4444',           // Error message color
        warning: '#ffaa00',         // Warning message color
        success: '#44ff44'          // Success message color
    }
};
```

### Server Setup
1. Use `/setup` command to configure:
   - **Music Channel**: Restrict music commands to specific channel
   - **DJ Role**: Users with this role can control music

## 🔧 Advanced Features

### DJ System
- Set a DJ role to restrict music controls
- DJ role members can:
  - Skip songs
  - Change volume
  - Apply filters
  - Control queue
  - Toggle autoplay/24-7 mode

### 24/7 Mode
- Bot stays in voice channel permanently
- Continues playing even when alone
- Useful for music servers

### Autoplay
- Automatically plays related songs when queue ends
- Keeps music going continuously
- Can be toggled on/off

### Button Controls
Interactive buttons appear with each song:
- ⏸️ Pause/Resume
- ⏭️ Skip
- ⏹️ Stop
- 📋 Show Queue

## 🐛 Troubleshooting

### Common Issues

**Bot doesn't respond to commands:**
- Check if bot is online
- Verify bot has proper permissions
- Ensure Message Content Intent is enabled

**Audio not playing:**
- Install FFmpeg properly
- Check voice channel permissions
- Verify bot can connect to voice channel

**Poor audio quality:**
- Check internet connection
- Try different audio filters
- Ensure FFmpeg is latest version

**Commands not working:**
- Check command syntax
- Verify bot permissions
- Try both prefix and slash commands

### Error Messages
- **"You need to be in a voice channel"** - Join a voice channel first
- **"No results found"** - Try different search terms
- **"DJ permissions required"** - Get DJ role or admin permissions
- **"Queue is empty"** - Add songs to queue first

## 📊 Performance

### Optimizations
- Efficient memory usage
- Smart queue management
- Automatic cleanup
- Connection pooling

### Limits
- Max queue size: 100 songs (configurable)
- Max volume: 100%
- Auto-leave: 5 minutes of inactivity
- Search results: Top 10 matches

## 🔒 Security

### Permissions
- Minimal required permissions
- Role-based access control
- Channel restrictions
- Admin-only setup commands

### Privacy
- No data collection
- No message logging
- Temporary audio streaming
- No persistent storage

## 🚀 Deployment

### Local Hosting
```bash
npm start
```

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start bot.js --name "music-bot"
pm2 startup
pm2 save
```

### Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

### Cloud Hosting
- **Heroku**: Add Procfile with `worker: node bot.js`
- **Railway**: Direct deployment from GitHub
- **DigitalOcean**: VPS with PM2
- **AWS**: EC2 instance with auto-scaling

## 📈 Monitoring

### Logs
- Console output for debugging
- Error tracking and reporting
- Performance metrics
- Usage statistics

### Health Checks
- Voice connection status
- Memory usage monitoring
- Queue size tracking
- Command response times

## 🤝 Contributing

### Development Setup
```bash
npm install
npm run dev  # Uses nodemon for auto-restart
```

### Code Structure
- `bot.js` - Main bot file
- `config` - Bot configuration
- `MusicBot` class - Core functionality
- Event handlers - Discord event management
- Command handlers - Command processing

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Discord.js community
- YouTube API
- FFmpeg project
- Node.js ecosystem

## 📞 Support

Need help? Here are your options:
1. Check this documentation
2. Review error messages carefully
3. Verify your setup steps
4. Check Discord.js documentation
5. Search for similar issues online

---

**Made with ❤️ for the Discord community**

Enjoy your new powerful music bot! 🎵
