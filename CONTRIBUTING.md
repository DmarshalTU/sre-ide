# Contributing to SRE IDE

Thank you for your interest in contributing to SRE IDE! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/yourusername/sre-ide/issues) page
- Include detailed information about your environment
- Provide steps to reproduce the issue
- Include error messages and logs

### Feature Requests
- Use the [GitHub Discussions](https://github.com/yourusername/sre-ide/discussions) page
- Describe the feature and its use case
- Consider implementation complexity
- Check if similar features already exist

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Rust (for Tauri)
- macOS (for building)
- Git

### Local Development
```bash
# Clone your fork
git clone https://github.com/yourusername/sre-ide.git
cd sre-ide

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for testing
npm run build:mac
```

### Code Style
- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing
- Test your changes thoroughly
- Add unit tests for new functionality
- Test on different platforms if applicable
- Verify the build process works

## 📁 Project Structure

### Frontend (React/TypeScript)
```
src/
├── components/         # React components
│   ├── chat/          # Chat-related components
│   ├── ui/            # Reusable UI components
│   └── ...
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── App.tsx            # Main application component
```

### Backend (Rust/Tauri)
```
src-tauri/
├── src/               # Rust source code
│   ├── lib.rs         # Tauri commands
│   └── main.rs        # Application entry point
└── tauri.conf.json    # Tauri configuration
```

## 🎯 Areas for Contribution

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- Security enhancements
- Documentation improvements

### Medium Priority
- New investigation templates
- Additional cloud tool integrations
- UI/UX improvements
- Testing coverage

### Low Priority
- New features and enhancements
- Code refactoring
- Developer experience improvements

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(connectors): add support for multiple KAgent instances
fix(chat): resolve message display issues
docs(readme): update installation instructions
style(ui): improve button styling consistency
```

## 🔍 Code Review Process

1. **Pull Request Creation**
   - Provide a clear description of changes
   - Link related issues
   - Include screenshots for UI changes

2. **Review Process**
   - At least one maintainer must approve
   - All CI checks must pass
   - Code must follow project guidelines

3. **Merging**
   - Squash commits when merging
   - Use conventional commit messages
   - Update documentation if needed

## 🐛 Bug Reports

### Required Information
- **Environment**: OS, Node.js version, Rust version
- **Steps to Reproduce**: Detailed step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Error Messages**: Full error logs and stack traces
- **Screenshots**: Visual evidence if applicable

### Example Bug Report
```markdown
## Bug Description
Brief description of the issue

## Environment
- OS: macOS 14.0
- Node.js: 18.17.0
- Rust: 1.70.0
- SRE IDE: 1.0.0

## Steps to Reproduce
1. Launch SRE IDE
2. Navigate to Cloud Tools
3. Click on Azure Resource Finder
4. Enter search query

## Expected Behavior
Should display Azure resources

## Actual Behavior
Shows "Authentication required" error

## Error Messages
```
Error: Azure authentication required
```

## Additional Information
- Screenshots attached
- Related to issue #123
```

## 🚀 Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared
- [ ] Build artifacts created
- [ ] Release tagged and published

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/sre-ide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sre-ide/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/sre-ide/wiki)

## 🙏 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- GitHub contributors page
- Documentation

Thank you for contributing to SRE IDE! 🚀
