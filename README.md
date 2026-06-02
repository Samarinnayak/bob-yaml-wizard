# Bob YAML Wizard 🚀

> Visual CICS Configuration Builder with AI-Powered Assistance

Build CICS configurations through natural conversation with Bob AI, featuring real-time visual diagrams and instant YAML generation. No z/OS required - works entirely in your browser!

[![Demo](https://img.shields.io/badge/demo-live-success)](https://your-username.github.io/bob-yaml-wizard)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/github/workflow/status/your-username/bob-yaml-wizard/deploy)](https://github.com/your-username/bob-yaml-wizard/actions)

## ✨ Features

- 💬 **Conversational Interface** - Chat with Bob to build configurations
- 📊 **Visual Diagrams** - See your architecture come alive in real-time
- 📝 **Instant YAML** - Generate valid zconfig YAML automatically
- 🎨 **Beautiful UI** - Modern, responsive design that works everywhere
- 📱 **Mobile-Friendly** - Works on desktop, tablet, and phone
- 🚀 **Zero Setup** - No installation, no z/OS, just open and use
- 💾 **Export & Share** - Download YAML or share configurations via link

## 🎯 Quick Start

### Try It Now

Visit [bob-yaml-wizard.github.io](https://your-username.github.io/bob-yaml-wizard) and start building!

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/bob-yaml-wizard.git
cd bob-yaml-wizard

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 🎬 Demo Scenarios

### Scenario 1: Create Your First CICS Region

```
You: "I need a CICS region for development"

Bob: "I'll help you create a development CICS region!
      What should we call it?"

You: "DEVTEST"

Bob: "Perfect! Creating DEVTEST with:
     ✓ 256MB memory (good for development)
     ✓ Standard datasets
     ✓ Auto-start enabled

     [Watch the diagram build in real-time]
     [See YAML generate line by line]

     Your configuration is ready! Want to add anything else?"
```

### Scenario 2: Add Java Support

```
You: "Add Java support"

Bob: "Adding JVM for Java applications!
     ✓ JVM with 512MB heap
     ✓ Standard JVM profile

     [Diagram animates - JVM component appears]
     [YAML updates with JVM configuration]

     Your region is now Java-ready!"
```

### Scenario 3: Enable Management

```
You: "Enable remote management"

Bob: "Enabling CMCI for remote management!
     ✓ CMCI on port 1490
     ✓ Management interface configured

     [Diagram shows CMCI connection]
     [YAML includes CMCI extension]

     You can now manage this region remotely!"
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Chat   │  │   Diagram    │  │   YAML Editor   │  │
│  └──────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Application Logic                          │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Bob    │  │   Config     │  │     YAML        │  │
│  │  Brain   │  │   Manager    │  │   Generator     │  │
│  └──────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📚 Documentation

- [Technical Specification](SPECIFICATION.md) - Complete technical details
- [Implementation Guide](docs/IMPLEMENTATION.md) - Step-by-step implementation
- [API Reference](docs/API.md) - Component APIs and interfaces
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Diagrams**: [Mermaid.js](https://mermaid.js.org/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Build**: [Vite](https://vitejs.dev/)
- **Hosting**: GitHub Pages

## 📦 Project Structure

```
bob-yaml-wizard/
├── src/
│   ├── components/
│   │   ├── chat/           # Chat interface
│   │   ├── diagram/        # Visual diagram
│   │   └── editor/         # YAML editor
│   ├── core/
│   │   ├── bob-brain.js    # AI logic
│   │   ├── config-manager.js
│   │   └── yaml-generator.js
│   ├── templates/          # Configuration templates
│   ├── styles/             # CSS files
│   └── utils/              # Utility functions
├── public/
│   ├── assets/             # Images, icons
│   └── templates/          # YAML templates
├── tests/                  # Test files
├── docs/                   # Documentation
└── index.html              # Entry point
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

## 🚀 Deployment

### GitHub Pages (Automatic)

Push to `main` branch and GitHub Actions will automatically deploy to GitHub Pages.

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 🎯 Roadmap

### Phase 1 (Current) - Core Features
- [x] Chat interface
- [x] Visual diagrams
- [x] YAML generation
- [x] Basic templates
- [x] Export functionality

### Phase 2 - Enhanced Features
- [ ] User accounts
- [ ] Save configurations
- [ ] Configuration history
- [ ] Advanced templates
- [ ] Collaboration features

### Phase 3 - Advanced Features
- [ ] AI-powered optimization
- [ ] Configuration comparison
- [ ] Migration assistant
- [ ] VS Code extension
- [ ] Mobile app

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [zconfig](https://github.ibm.com/IBMZSoftware/zconfig) - The underlying configuration tool
- [IBM Carbon Design System](https://carbondesignsystem.com/) - Design inspiration
- [Mermaid.js](https://mermaid.js.org/) - Diagram generation
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor

## 📧 Contact

- **Project Lead**: Your Name
- **Email**: your.email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ for the mainframe community**
