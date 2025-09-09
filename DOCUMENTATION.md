# SRE IDE - Comprehensive Documentation

## Overview
SRE IDE is a professional Site Reliability Engineering IDE built with Tauri (Rust backend) and React/TypeScript frontend. It provides AI-powered investigation tools, cloud infrastructure management, and comprehensive debugging capabilities for SRE teams.

## Architecture

### Frontend (TypeScript/React)
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2
- **Styling**: Custom CSS with CSS variables + Tailwind CSS
- **State Management**: React hooks and local state
- **UI Components**: Custom components with Lucide React icons

### Backend (Rust/Tauri)
- **Framework**: Tauri 2.0
- **Language**: Rust
- **Purpose**: System-level operations, security, and external tool integration
- **Key Features**: Process execution, environment management, HTTP requests

## Core Components

### 1. App.tsx - Main Application Component
**Purpose**: Central application orchestrator managing all major features

**Key Functions**:
- `connectToConnector(connector)`: Establishes connection to KAgent instances
- `startChatWithAgent(agent)`: Initiates chat sessions with AI agents
- `handleSendMessage(message)`: Processes and sends messages to agents
- `addConnector()`: Adds new KAgent connectors
- `removeConnector(connectorId)`: Removes existing connectors

**State Management**:
- `connectors`: Array of KAgent connector configurations
- `activeConnector`: Currently selected connector ID
- `selectedAgent`: Currently active AI agent
- `currentSession`: Active chat session
- `chatMessages`: Current conversation messages
- `agentChatSessions`: Persistent chat history per agent

### 2. Sidebar.tsx - Navigation Component
**Purpose**: Main navigation interface with connection status

**Key Features**:
- Navigation items: Dashboard, Investigate, Agents, Chat, Cloud Tools, Alerts, Debug, Settings
- Real-time connection status indicator
- Active tab highlighting
- Connection error display

**Props**:
- `activeTab`: Currently selected tab
- `onTabChange`: Tab change handler
- `connectionStatus`: Connection health information

### 3. Header.tsx - Application Header
**Purpose**: Top navigation bar with search and user profile

**Key Features**:
- Live clock display
- Search functionality
- User profile section
- Notification indicators

### 4. EnhancedChat.tsx - Chat Interface
**Purpose**: Advanced chat interface with security and optimization features

**Key Functions**:
- `handleInputChange(value)`: Real-time input processing with security scanning
- `handleSend()`: Message sending with optimization and masking
- `MessageBubble`: Individual message display component
- `StatCard`: Token usage statistics display

**Security Features**:
- Real-time sensitive data detection
- Automatic data masking
- Security warning display
- Token usage analytics

**Optimization Features**:
- Message token counting
- Conversation optimization
- Cost estimation
- Performance metrics

### 5. Investigation.tsx - Investigation Workflow
**Purpose**: Structured investigation management with AI agents

**Key Functions**:
- `startInvestigation(template)`: Initiates investigation from template
- `nextStep()`: Advances to next investigation step
- `completeInvestigation()`: Marks investigation as complete
- `exportInvestigationReport(investigation, format)`: Exports reports as PDF/JSON
- `extractFindingsFromChat()`: Analyzes chat messages for findings

**Investigation Templates**:
- Production Incident (P0)
- Performance Degradation (P1)
- Deployment Rollback (P2)
- Network Connectivity (P1)
- Security Alert (P0)
- Capacity Planning (P3)

**Features**:
- Step-by-step agent workflow
- Chat session integration
- Progress tracking
- Report generation with professional PDF layout
- Investigation history management

### 6. CloudTools.tsx - Cloud Infrastructure Tools
**Purpose**: Integration with cloud tools and scripting environment

**Key Functions**:
- `checkToolAvailability()`: Verifies tool installation
- `searchAzureResources()`: Executes Azure resource searches
- `executeRuchyCommand()`: Runs Ruchy scripts with context management
- `testAzureCLI()`: Tests Azure CLI connectivity

**Tool Integrations**:
- **Azure Resource Finder**: Cloud resource discovery and management
- **Ruchy REPL**: Scripting language with context preservation
- **Azure CLI**: Authentication and command execution

**Features**:
- Tool availability checking
- Authentication status monitoring
- Context-aware script execution
- Error handling and debugging

## Library Components

### 1. kagent.ts - KAgent API Client
**Purpose**: Communication layer with KAgent instances

**Key Classes**:
- `KagentAPI`: Main API client class

**Key Methods**:
- `getAgents()`: Retrieves available AI agents
- `createSession(agentRef, sessionId?)`: Creates chat sessions
- `sendMessage(sessionId, message)`: Sends messages via A2A protocol
- `getSession(sessionId)`: Retrieves session information
- `testConnection()`: Tests API connectivity

**Protocols**:
- REST API for agent and session management
- A2A (Agent-to-Agent) protocol for real-time messaging
- SSE (Server-Sent Events) for streaming responses

### 2. securityScanner.ts - Security Scanner
**Purpose**: Sensitive data detection and masking

**Key Class**:
- `SecurityScanner`: Static security scanning utilities

**Key Methods**:
- `scan(text)`: Detects sensitive data patterns
- `mask(text)`: Masks sensitive information
- `getMaskingSummary(original, masked)`: Provides masking statistics

**Detection Patterns**:
- API keys and tokens
- Passwords and credentials
- Private keys and certificates
- Database connection strings
- JWT tokens
- Credit card numbers
- SSH keys
- Email addresses
- IP addresses
- Phone numbers
- SSNs
- GitHub/Slack tokens

### 3. ndjsonOptimizer.ts - Message Optimization
**Purpose**: Token efficiency and conversation optimization

**Key Class**:
- `NDJSONOptimizer`: Message and conversation optimization

**Key Methods**:
- `countTokens(text)`: Approximate token counting
- `optimizeMessage(message)`: Single message optimization
- `optimizeConversation(messages)`: Conversation-level optimization
- `getTokenSummary(messages)`: Token usage statistics

**Optimization Techniques**:
- Whitespace reduction
- Redundant punctuation removal
- Repeated phrase compression
- Quote and bracket removal
- Common word abbreviation
- NDJSON format conversion

### 4. config.ts - Configuration Management
**Purpose**: Application configuration and environment management

**Key Interfaces**:
- `KAgentConfig`: Connector configuration structure

**Key Functions**:
- `getConfig()`: Retrieves current configuration
- `buildApiUrl(config)`: Constructs API URLs
- `validateConfig(config)`: Validates configuration

**Environment Support**:
- Local development
- Development environment
- Staging environment
- Production environment

## Rust Backend (src-tauri/)

### 1. lib.rs - Main Rust Library
**Purpose**: System-level operations and external tool integration

**Key Functions**:
- `check_tool_availability(tool)`: Verifies external tool installation
- `run_azure_resource_finder(args)`: Executes Azure Resource Finder
- `run_ruchy_repl(command)`: Executes Ruchy scripts
- `check_azure_auth_status()`: Checks Azure authentication
- `http_request(url, method, headers, body)`: HTTP request handling
- `test_azure_cli()`: Azure CLI testing

**Tool Integrations**:
- **Azure Resource Finder**: Cross-platform tool detection and execution
- **Ruchy**: REPL environment with context management
- **Azure CLI**: Authentication and command execution
- **HTTP Client**: Secure HTTP request handling

**Security Features**:
- Environment variable management
- Path sanitization
- Error handling and logging
- Cross-platform compatibility

## Data Flow

### 1. User Interaction Flow
```
User Input → Security Scanner → Message Optimizer → KAgent API → Agent Response → Chat Display
```

### 2. Investigation Flow
```
Template Selection → Agent Workflow → Chat Integration → Progress Tracking → Report Generation
```

### 3. Cloud Tools Flow
```
Tool Detection → Authentication Check → Command Execution → Result Processing → Display
```

## State Management

### 1. Application State
- **Connectors**: KAgent connection configurations
- **Active Connector**: Currently selected connector
- **Agents**: Available AI agents from all connectors
- **Chat Sessions**: Persistent conversation history

### 2. Investigation State
- **Active Investigation**: Current investigation progress
- **Investigation History**: Completed investigations
- **Current Step**: Progress within investigation
- **Agent Sessions**: Chat data per investigation agent

### 3. UI State
- **Active Tab**: Current navigation tab
- **Debug Info**: System logging and debugging
- **Connection Status**: Real-time connection health
- **Modal States**: Various modal dialogs

## Security Features

### 1. Data Protection
- Real-time sensitive data scanning
- Automatic data masking
- Secure credential handling
- Environment variable protection

### 2. Communication Security
- HTTPS support for production
- Authentication token management
- Secure HTTP request handling
- Error message sanitization

### 3. System Security
- Cross-platform path validation
- Process execution sandboxing
- Input sanitization
- Error boundary protection

## Performance Optimizations

### 1. Frontend Optimizations
- React.memo for component memoization
- Debounced state updates
- Lazy loading of heavy components
- Efficient re-rendering strategies

### 2. Message Optimizations
- Token counting and optimization
- Conversation compression
- NDJSON format for efficiency
- Cost estimation and monitoring

### 3. Backend Optimizations
- Efficient process execution
- Environment variable caching
- Error handling optimization
- Cross-platform compatibility

## Error Handling

### 1. Frontend Error Handling
- Try-catch blocks for async operations
- Error boundaries for component crashes
- User-friendly error messages
- Graceful degradation

### 2. Backend Error Handling
- Comprehensive error logging
- Process execution error handling
- Network error management
- Tool availability fallbacks

### 3. API Error Handling
- HTTP status code handling
- Network timeout management
- Authentication error handling
- Connection retry logic

## Deployment

### 1. Build Process
- Frontend: Vite build with TypeScript compilation
- Backend: Cargo build with Tauri bundling
- Cross-platform: macOS, Windows, Linux support

### 2. Distribution
- DMG files for macOS
- MSI installers for Windows
- AppImage for Linux
- Auto-updater support

### 3. Configuration
- Environment-specific settings
- User preference persistence
- Connector configuration management
- Debug mode support

## Development

### 1. Setup
```bash
# Install dependencies
npm install
cd src && npm install

# Development mode
npm run tauri:dev

# Build
npm run tauri:build
```

### 2. Testing
- Component testing with React Testing Library
- Integration testing for API calls
- End-to-end testing for workflows
- Security testing for data protection

### 3. Debugging
- Debug console with real-time logging
- Connection status monitoring
- Error tracking and reporting
- Performance monitoring

## Future Enhancements

### 1. Planned Features
- Multi-tenant support
- Advanced analytics dashboard
- Custom agent creation
- Integration with more cloud providers
- Real-time collaboration features

### 2. Technical Improvements
- WebSocket support for real-time updates
- Advanced caching strategies
- Performance monitoring
- Automated testing coverage
- Documentation generation

### 3. User Experience
- Customizable themes
- Keyboard shortcuts
- Advanced search capabilities
- Workflow automation
- Mobile responsive design
