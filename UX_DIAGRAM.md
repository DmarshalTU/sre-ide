# SRE IDE - User Experience Flow Diagram

```mermaid
graph TB
    %% User Entry Points
    Start([User Opens SRE IDE]) --> Dashboard[Dashboard]
    
    %% Main Navigation
    Dashboard --> |Navigate| Sidebar[Sidebar Navigation]
    Sidebar --> Dashboard
    Sidebar --> Investigate[Investigation Tools]
    Sidebar --> Agents[Agent Management]
    Sidebar --> Chat[Chat Interface]
    Sidebar --> CloudTools[Cloud Tools]
    Sidebar --> Alerts[Alerts & Monitoring]
    Sidebar --> Debug[Debug Console]
    Sidebar --> Settings[Settings]
    
    %% Dashboard Flow
    Dashboard --> |Quick Actions| QuickStart[Quick Start Investigations]
    Dashboard --> |System Status| StatusOverview[System Status Overview]
    Dashboard --> |Connector Mgmt| ConnectorMgmt[KAgent Connector Management]
    Dashboard --> |Recent Activity| RecentActivity[Recent Activity Log]
    
    %% Investigation Workflow
    Investigate --> |Template Selection| InvestigationTemplates[Investigation Templates]
    InvestigationTemplates --> |Start Investigation| ActiveInvestigation[Active Investigation]
    ActiveInvestigation --> |Step by Step| AgentWorkflow[Agent Workflow]
    AgentWorkflow --> |Next Agent| AgentSwitch[Switch to Next Agent]
    AgentSwitch --> |Continue| AgentWorkflow
    AgentWorkflow --> |Complete| InvestigationComplete[Investigation Complete]
    InvestigationComplete --> |Export| ReportExport[Export Reports PDF/JSON]
    
    %% Agent Management
    Agents --> |View Available| AgentList[Available Agents List]
    AgentList --> |Select Agent| AgentDetails[Agent Details]
    AgentDetails --> |Start Chat| Chat
    
    %% Chat Interface
    Chat --> |Send Message| MessageProcessing[Message Processing]
    MessageProcessing --> |Security Scan| SecurityScanner[Security Scanner]
    SecurityScanner --> |Mask Sensitive| MessageOptimization[Message Optimization]
    MessageOptimization --> |Token Analysis| TokenStats[Token Statistics]
    TokenStats --> |Send to Agent| AgentCommunication[Agent Communication]
    AgentCommunication --> |Receive Response| ChatResponse[Chat Response]
    ChatResponse --> |Display| ChatDisplay[Chat Display]
    
    %% Cloud Tools
    CloudTools --> |Azure Search| AzureResourceFinder[Azure Resource Finder]
    CloudTools --> |Scripting| RuchyREPL[Ruchy REPL]
    AzureResourceFinder --> |Execute Commands| AzureCLI[Azure CLI Integration]
    RuchyREPL --> |Execute Scripts| RuchyExecution[Ruchy Script Execution]
    
    %% Settings & Configuration
    Settings --> |Connection| ConnectorConfig[Connector Configuration]
    Settings --> |App Settings| AppConfig[Application Settings]
    ConnectorConfig --> |Add/Remove| ConnectorMgmt
    
    %% Debug & Monitoring
    Debug --> |View Logs| DebugLogs[Debug Information]
    Alerts --> |System Alerts| AlertDisplay[Alert Display]
    
    %% Data Flow
    AgentCommunication -.-> |Store Sessions| ChatSessions[Chat Sessions Storage]
    ChatSessions -.-> |Integrate| ActiveInvestigation
    ActiveInvestigation -.-> |Update| InvestigationHistory[Investigation History]
    
    %% External Integrations
    AzureCLI -.-> |External Tool| AzureCloud[Azure Cloud]
    RuchyExecution -.-> |External Tool| RuchyLang[Ruchy Language]
    AgentCommunication -.-> |External API| KAgentAPI[KAgent API]
    
    %% Styling
    classDef userAction fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef systemProcess fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef dataStorage fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class Start,Dashboard,Investigate,Agents,Chat,CloudTools,Alerts,Debug,Settings userAction
    class MessageProcessing,SecurityScanner,MessageOptimization,TokenStats,AgentCommunication systemProcess
    class ChatSessions,InvestigationHistory,ConnectorMgmt dataStorage
    class AzureCloud,RuchyLang,KAgentAPI external
```

## Key User Journeys

### 1. Investigation Workflow
1. **Start Investigation**: User selects from predefined templates or creates custom investigation
2. **Agent Selection**: System automatically selects appropriate agents for the investigation type
3. **Step-by-Step Process**: User progresses through investigation steps with different agents
4. **Chat Integration**: Each step involves chat interaction with specialized agents
5. **Report Generation**: Investigation results are exported as PDF or JSON reports

### 2. Chat with AI Agents
1. **Agent Selection**: User chooses from available AI agents (K8s, Observability, PromQL, etc.)
2. **Message Input**: User types message with real-time security scanning
3. **Message Processing**: System scans for sensitive data and optimizes for token efficiency
4. **Agent Communication**: Message sent to selected agent via KAgent API
5. **Response Display**: Agent response displayed with markdown rendering and token statistics

### 3. Cloud Tools Usage
1. **Tool Configuration**: System checks availability of Azure Resource Finder and Ruchy
2. **Azure Integration**: User can search Azure resources with authentication status checking
3. **Scripting**: User can write and execute Ruchy scripts with context management
4. **Results Display**: Command outputs displayed with proper formatting and error handling

### 4. System Management
1. **Connector Management**: Add/remove KAgent connectors with connection status monitoring
2. **Settings Configuration**: Configure application settings and connection parameters
3. **Debug Monitoring**: View system logs and debug information for troubleshooting
4. **Alert Management**: Monitor system alerts and notifications
