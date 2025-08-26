# SRE IDE

A professional Site Reliability Engineering IDE with AI-powered investigation tools and multi-connector support for distributed platform management.

![SRE IDE](https://img.shields.io/badge/Platform-macOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## 🚀 Features

### Multi-Connector Support
- **Distributed Platform Management**: Connect to multiple KAgent instances from one central interface
- **Environment Management**: Support for local, staging, and production environments
- **Centralized Agent Management**: View and manage agents across all connected platforms
- **Professional Connector UI**: Easy-to-use interface for adding, removing, and switching between connectors

### Professional SRE Tools
- **Investigation Workflows**: Pre-built templates for common SRE scenarios
- **Cloud Tools Integration**: Azure Resource Finder and Ruchy REPL support
- **Real-time Monitoring**: Live status updates and system metrics
- **Debug Information**: Comprehensive logging and error tracking

### Modern UI/UX
- **Professional Design**: Clean, SRE-focused interface with dark theme
- **Responsive Layout**: Optimized for different screen sizes
- **Smooth Animations**: Professional transitions and visual feedback
- **Native macOS App**: Full system integration with Spotlight and Dock

## 📦 Installation

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/sre-ide.git
cd sre-ide

# Install dependencies
npm install

# Build and install
npm run build:mac
npm run install:mac
```

### Alternative: DMG Installer
```bash
# Build the application
npm run build:mac

# Create DMG installer
npm run create-dmg

# Double-click the generated DMG and drag to Applications
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Rust (for Tauri)
- macOS (for building)

### Development Commands
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:mac

# Install to Applications
npm run install:mac

# Create DMG installer
npm run create-dmg
```

## 🎯 Usage

### Adding KAgent Connectors
1. Launch SRE IDE
2. Click "Add Connector" in the dashboard
3. Configure your KAgent instance:
   - **Name**: Friendly name for the connector
   - **Base URL**: KAgent server hostname/IP
   - **Port**: KAgent server port (default: 8083)
   - **Protocol**: HTTP or HTTPS
   - **Environment**: Local, Staging, or Production

### Investigation Workflows
1. Navigate to the "Investigate" tab
2. Choose from pre-built templates:
   - Production Incident (P0)
   - Performance Degradation (P1)
   - Deployment Rollback (P2)
   - Network Connectivity (P1)
   - Security Alert (P0)
   - Capacity Planning (P3)
3. Select required agents and start investigation

### Cloud Tools
- **Azure Resource Finder**: Search and manage Azure resources
- **Ruchy REPL**: Interactive REPL for data analysis
- **Tool Configuration**: Easy setup and path management

## 🏗️ Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety
- **Tauri**: Cross-platform desktop framework
- **Lucide React**: Professional icon library

### Backend
- **Rust**: High-performance system programming
- **Tauri Commands**: Native system integration
- **Cross-platform Support**: macOS, Windows, Linux

### Key Components
- **Multi-Connector System**: Distributed platform management
- **Investigation Engine**: AI-powered SRE workflows
- **Cloud Tools Integration**: Azure and Ruchy support
- **Real-time Monitoring**: Live status and metrics

## 🔌 Configuration

### KAgent Setup
1. Install KAgent using the provided setup script:
   ```bash
   ./kagent_setup.sh
   ```
2. Replace `YOUR_ANTHROPIC_API_KEY` with your actual API key
3. Configure your KAgent instance

### Environment Variables
- `KAGENT_URL`: Default KAgent server URL
- `KAGENT_TOKEN`: Authentication token (if required)

## 📁 Project Structure

```
sre-ide/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   └── config.ts          # Configuration management
├── src-tauri/             # Tauri backend
│   ├── src/               # Rust source code
│   └── tauri.conf.json    # Tauri configuration
├── install.sh             # Installation script
├── create-dmg.sh          # DMG creation script
└── kagent_setup.sh        # KAgent setup script
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [KAgent](https://github.com/kagent-dev/kagent) - AI-powered Kubernetes agent
- [Tauri](https://tauri.app/) - Cross-platform desktop framework
- [Lucide](https://lucide.dev/) - Beautiful icon library

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/sre-ide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sre-ide/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/sre-ide/wiki)

---

**SRE IDE** - Professional Site Reliability Engineering IDE with AI-powered investigation tools 🚀

