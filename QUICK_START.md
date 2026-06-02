# 🚀 Quick Start Guide - Bob YAML Wizard

Get up and running with Bob YAML Wizard in 5 minutes!

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No z/OS required! 🎉

## 🏃 Quick Start

### Option 1: Try It Online (Fastest!)

Visit the live demo: **[bob-yaml-wizard.github.io](https://your-username.github.io/bob-yaml-wizard)**

No installation needed - just open and start building!

### Option 2: Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/bob-yaml-wizard.git
cd bob-yaml-wizard

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173 in your browser
```

That's it! The app should open automatically in your browser.

## 🎯 Your First Configuration

### Step 1: Start a Conversation

In the chat panel, type:
```
Create a CICS region for development
```

### Step 2: Name Your Region

Bob will ask for a name. Type something like:
```
DEVTEST
```

### Step 3: Watch the Magic! ✨

- **Left Panel**: See your conversation with Bob
- **Center Panel**: Watch the architecture diagram build in real-time
- **Right Panel**: See the YAML generate automatically

### Step 4: Add Features

Try these commands:
```
Add Java support
```

```
Enable remote management
```

```
Add database connection
```

### Step 5: Download Your Configuration

Click the **💾 Download** button in the YAML panel to save your configuration!

## 🎬 Demo Scenarios

### Scenario 1: Basic Development Region

```
You: Create a CICS region for development
Bob: What should we call it?
You: DEVTEST
Bob: ✅ Created! Your region is ready.
```

**Result**: A basic CICS region with 256MB memory, perfect for development.

### Scenario 2: Java Application Server

```
You: Create a CICS region called JAVAPROD for Java applications
Bob: ✅ Created JAVAPROD with JVM support!
```

**Result**: A production-ready region with 1GB memory and JVM configured.

### Scenario 3: Management Region

```
You: Set up a CICS region with remote management
Bob: What should we call it?
You: MGMT01
You: Enable CMCI
Bob: ✅ CMCI enabled on port 1490!
```

**Result**: A region configured for remote management via CICS Explorer.

## 💡 Pro Tips

### Quick Commands

- **"Create a region"** - Start a new configuration
- **"Add Java"** - Enable JVM support
- **"Enable CMCI"** - Add remote management
- **"Add database"** - Configure DB2 connection
- **"Optimize"** - Get best practice suggestions
- **"Help"** - See all available commands

### Keyboard Shortcuts

- `Enter` - Send message
- `Ctrl+C` - Copy YAML to clipboard
- `Ctrl+D` - Download YAML file
- `Esc` - Close modals

### Mobile Usage

On mobile devices, use the tabs at the top to switch between:
- 💬 Chat
- 📊 Diagram
- 📝 YAML

## 🎨 Customization

### Dark Mode

Click the 🌙 button in the header to toggle dark mode.

### Templates

Bob can apply pre-built templates:

```
You: Use the production template
Bob: Applied production template with optimizations!
```

Available templates:
- **Basic** - Simple development region
- **Java** - Java application server
- **Management** - CMCI-enabled region
- **Production** - Fully optimized production region

## 📤 Sharing Your Configuration

### Copy Link

1. Click the **🔗 Share** button
2. Click **Copy Link**
3. Share the link with your team!

### Download YAML

1. Click the **💾 Download** button in the YAML panel
2. Save the file (e.g., `cics-region.yaml`)
3. Use it with zconfig on z/OS!

## 🔧 Development

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Run Tests

```bash
npm test
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

Or just push to `main` branch - GitHub Actions will deploy automatically!

## 🐛 Troubleshooting

### Issue: Diagram not showing

**Solution**: Refresh the page. Mermaid.js sometimes needs a reload.

### Issue: YAML not generating

**Solution**: Make sure you've created a region first. Type "Create a region" to start.

### Issue: Can't copy YAML

**Solution**: Try the download button instead, or manually select and copy the text.

### Issue: App won't start locally

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📚 Next Steps

### Learn More

- Read the [Technical Specification](SPECIFICATION.md)
- Check out [Example Configurations](examples/)
- Join the [Discussion Forum](https://github.com/your-username/bob-yaml-wizard/discussions)

### Contribute

- See [Contributing Guide](CONTRIBUTING.md)
- Report bugs on [GitHub Issues](https://github.com/your-username/bob-yaml-wizard/issues)
- Submit pull requests!

### Use with zconfig

Once you've generated your YAML:

```bash
# On z/OS with zconfig installed
zconfig apply your-region.yaml
```

See the [zconfig documentation](https://github.ibm.com/IBMZSoftware/zconfig) for more details.

## 🎉 Success!

You're now ready to build CICS configurations with Bob!

**Remember**:
- Bob understands natural language - just chat normally
- The diagram updates in real-time as you build
- YAML is generated automatically - no manual editing needed
- Everything works offline once loaded

## 💬 Get Help

- **In-App Help**: Click the ❓ button in the header
- **GitHub Issues**: [Report a bug](https://github.com/your-username/bob-yaml-wizard/issues)
- **Discussions**: [Ask questions](https://github.com/your-username/bob-yaml-wizard/discussions)

---

**Happy Building! 🚀**

Made with ❤️ for the mainframe community
