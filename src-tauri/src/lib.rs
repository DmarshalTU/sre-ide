use std::collections::HashMap;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ToolInfo {
    pub name: String,
    pub available: bool,
    pub path: Option<String>,
    pub error: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Cross-platform tool detection
fn find_tool_in_path(tool_name: &str) -> Result<Option<String>, String> {
    // Use 'which' on Unix systems, 'where' on Windows
    let command = if cfg!(target_os = "windows") { "where" } else { "which" };
    
    let output = Command::new(command)
        .arg(tool_name)
        .output()
        .map_err(|e| format!("Failed to execute {}: {}", command, e))?;
    
    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            // On Windows, 'where' might return multiple paths, take the first one
            let first_path = path.lines().next().unwrap_or("").trim();
            if !first_path.is_empty() {
                return Ok(Some(first_path.to_string()));
            }
        }
    }
    
    Ok(None)
}

// Check if a specific path exists and is executable
fn check_tool_at_path(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command]
async fn check_tool_availability(tool: String) -> Result<ToolInfo, String> {
    let mut tool_info = ToolInfo {
        name: tool.clone(),
        available: false,
        path: None,
        error: None,
    };
    
    match tool.as_str() {
        "azure-resource-finder" => {
            // Check common installation paths
            let common_paths = vec![
                "/usr/local/bin/azure-resource-finder",
                "/opt/homebrew/bin/azure-resource-finder",
                "C:\\Program Files\\azure-resource-finder\\azure-resource-finder.exe",
                "C:\\azure-resource-finder\\azure-resource-finder.exe",
            ];
            
            // Check common paths first
            for path in common_paths {
                if check_tool_at_path(path) {
                    tool_info.available = true;
                    tool_info.path = Some(path.to_string());
                    return Ok(tool_info);
                }
            }
            
            // Try to find in PATH
            match find_tool_in_path("azure-resource-finder") {
                Ok(Some(path)) => {
                    tool_info.available = true;
                    tool_info.path = Some(path);
                }
                Ok(None) => {
                    tool_info.error = Some("Azure Resource Finder not found. Please install it or configure the path in settings.".to_string());
                }
                Err(e) => {
                    tool_info.error = Some(format!("Failed to search for azure-resource-finder: {}", e));
                }
            }
        }
        
        "ruchy" => {
            // Check common installation paths
            let common_paths = vec![
                "/Users/denistu/.cargo/bin/ruchy",
                "/usr/local/bin/ruchy",
                "/opt/homebrew/bin/ruchy",
                "C:\\Users\\%USERNAME%\\.cargo\\bin\\ruchy.exe",
                "C:\\cargo\\bin\\ruchy.exe",
            ];
            
            // Check common paths first
            for path in common_paths {
                if check_tool_at_path(path) {
                    tool_info.available = true;
                    tool_info.path = Some(path.to_string());
                    return Ok(tool_info);
                }
            }
            
            // Try to find in PATH
            match find_tool_in_path("ruchy") {
                Ok(Some(path)) => {
                    tool_info.available = true;
                    tool_info.path = Some(path);
                }
                Ok(None) => {
                    tool_info.error = Some("Ruchy not found. Please install it with 'cargo install ruchy' or configure the path in settings.".to_string());
                }
                Err(e) => {
                    tool_info.error = Some(format!("Failed to search for ruchy: {}", e));
                }
            }
        }
        
        "az" => {
            // Check common installation paths for Azure CLI
            let common_paths = vec![
                "/usr/local/bin/az",
                "/opt/homebrew/bin/az",
                "C:\\Program Files (x86)\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd",
                "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd",
            ];
            
            // Check common paths first
            for path in common_paths {
                if check_tool_at_path(path) {
                    tool_info.available = true;
                    tool_info.path = Some(path.to_string());
                    return Ok(tool_info);
                }
            }
            
            // Try to find in PATH
            match find_tool_in_path("az") {
                Ok(Some(path)) => {
                    tool_info.available = true;
                    tool_info.path = Some(path);
                }
                Ok(None) => {
                    tool_info.error = Some("Azure CLI not found. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli".to_string());
                }
                Err(e) => {
                    tool_info.error = Some(format!("Failed to search for az: {}", e));
                }
            }
        }
        
        _ => {
            tool_info.error = Some(format!("Unknown tool: {}", tool));
        }
    }
    
    Ok(tool_info)
}

#[tauri::command]
async fn run_azure_resource_finder(args: Vec<String>) -> Result<CommandOutput, String> {
    // Get tool info to find the correct path
    let tool_info = check_tool_availability("azure-resource-finder".to_string()).await?;
    
    if !tool_info.available {
        return Err(tool_info.error.unwrap_or_else(|| "Azure Resource Finder not available".to_string()));
    }
    
    let azure_finder_path = tool_info.path.unwrap();
    
    // Get the current PATH and ensure Azure CLI is accessible
    let mut env = std::env::vars().collect::<HashMap<String, String>>();
    let current_path = env.get("PATH").unwrap_or(&String::new()).clone();
    
    // Ensure common paths are in PATH for Azure CLI access
    let common_paths = if cfg!(target_os = "windows") {
        vec![
            "C:\\Program Files (x86)\\Microsoft SDKs\\Azure\\CLI2\\wbin",
            "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin",
        ]
    } else {
        vec![
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin", 
            "/usr/local/bin",
            "/usr/local/sbin"
        ]
    };
    
    let mut new_path = current_path.clone();
    for common_path in common_paths {
        if !new_path.contains(common_path) {
            if !new_path.is_empty() {
                if cfg!(target_os = "windows") {
                    new_path.push(';');
                } else {
                    new_path.push(':');
                }
            }
            new_path.push_str(common_path);
        }
    }
    
    // Add the updated PATH to environment
    env.insert("PATH".to_string(), new_path);
    
    // Add Azure-specific environment variables for authentication
    if let Ok(home) = std::env::var(if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" }) {
        env.insert("AZURE_CONFIG_DIR".to_string(), format!("{}/.azure", home));
    }
    
    // Ensure we have the Azure CLI profile directory
    if let Ok(home) = std::env::var(if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" }) {
        let azure_dir = format!("{}/.azure", home);
        if std::path::Path::new(&azure_dir).exists() {
            env.insert("AZURE_CONFIG_DIR".to_string(), azure_dir);
        }
    }
    
    let output = Command::new(&azure_finder_path)
        .args(&args)
        .envs(&env)
        .output()
        .map_err(|e| format!("Failed to execute azure-resource-finder: {}", e))?;
    
    // If the command failed, provide more detailed error information
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // Check if it's an authentication error
        if stderr.contains("DefaultAzureCredential") || stderr.contains("failed to acquire a token") {
            return Ok(CommandOutput {
                stdout: stdout.to_string(),
                stderr: format!("Azure authentication failed. Please ensure you are logged in with 'az login' and have the necessary permissions.\n\nError details:\n{}", stderr),
                success: false,
            });
        }
    }
    
    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        success: output.status.success(),
    })
}

#[tauri::command]
async fn run_ruchy_repl(command: String) -> Result<CommandOutput, String> {
    use std::io::Write;
    use std::process::{Command, Stdio};
    
    // Get tool info to find the correct path
    let tool_info = check_tool_availability("ruchy".to_string()).await?;
    
    if !tool_info.available {
        return Err(tool_info.error.unwrap_or_else(|| "Ruchy not available".to_string()));
    }
    
    let ruchy_path = tool_info.path.unwrap();
    
    // For now, we'll use a simpler approach - each command runs in its own REPL instance
    // but we'll format it to look like a continuous session
    let mut child = Command::new(&ruchy_path)
        .arg("repl")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn ruchy: {}", e))?;
    
    // Write command to stdin
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(format!("{}\n", command).as_bytes())
            .map_err(|e| format!("Failed to write to ruchy stdin: {}", e))?;
        stdin.write_all(b":quit\n")
            .map_err(|e| format!("Failed to write exit command: {}", e))?;
    }
    
    // Wait for the process to complete
    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to read ruchy output: {}", e))?;
    
    // Process the output to remove the welcome/goodbye messages for cleaner display
    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let stderr_str = String::from_utf8_lossy(&output.stderr);
    
    // Combine stdout and stderr for Ruchy (it sometimes outputs to stderr)
    let combined_output = format!("{}{}", stdout_str, stderr_str);
    let lines: Vec<&str> = combined_output.lines().collect();
    
    // Filter out the welcome and goodbye messages and process the output
    let mut filtered_output = Vec::new();
    for line in lines.iter() {
        if !line.contains("Welcome to Ruchy REPL") &&
           !line.contains("Type :help") &&
           !line.contains("Goodbye!") &&
           !line.starts_with("ruchy>") &&
           !line.trim().is_empty() {
            // Special handling for Ruchy's return errors
            if line.starts_with("Error: return:") {
                // Extract the actual return value
                let return_value = line.replace("Error: return:", "").trim().to_string();
                filtered_output.push(return_value);
            } else if line.starts_with("Error:") {
                // Keep other errors as-is
                filtered_output.push(line.to_string());
            } else {
                filtered_output.push(line.to_string());
            }
        }
    }
    
    // Join the filtered lines
    let clean_output = filtered_output.join("\n").trim().to_string();
    
    // Determine success based on whether we got a real error or just a return "error"
    let is_success = !clean_output.starts_with("Error:") || stderr_str.contains("Error: return:");
    
    Ok(CommandOutput {
        stdout: clean_output,
        stderr: if is_success { String::new() } else { stderr_str.to_string() },
        success: is_success,
    })
}

#[tauri::command]
async fn check_azure_auth_status() -> Result<serde_json::Value, String> {
    // Check if Azure CLI is available
    let tool_info = check_tool_availability("az".to_string()).await?;
    let az_available = tool_info.available;
    
    if !az_available {
        return Ok(serde_json::json!({
            "azure_cli_available": false,
            "is_logged_in": false,
            "account_info": {},
            "error": "Azure CLI not found"
        }));
    }
    
    // Set up environment variables for Azure CLI
    let mut env = std::env::vars().collect::<HashMap<String, String>>();
    
    // Ensure common paths are in PATH for Azure CLI access
    let common_paths = if cfg!(target_os = "windows") {
        vec![
            "C:\\Program Files (x86)\\Microsoft SDKs\\Azure\\CLI2\\wbin",
            "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin",
        ]
    } else {
        vec![
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin", 
            "/usr/local/bin",
            "/usr/local/sbin"
        ]
    };
    
    let current_path = env.get("PATH").unwrap_or(&String::new()).clone();
    let mut new_path = current_path.clone();
    for common_path in common_paths {
        if !new_path.contains(common_path) {
            if !new_path.is_empty() {
                if cfg!(target_os = "windows") {
                    new_path.push(';');
                } else {
                    new_path.push(':');
                }
            }
            new_path.push_str(common_path);
        }
    }
    env.insert("PATH".to_string(), new_path);
    
    // Add Azure-specific environment variables for authentication
    if let Ok(home) = std::env::var(if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" }) {
        env.insert("AZURE_CONFIG_DIR".to_string(), format!("{}/.azure", home));
    }
    
    // Check if user is logged in with proper environment
    let account_output = Command::new("az")
        .arg("account")
        .arg("show")
        .envs(&env)
        .output();
    
    let is_logged_in = account_output.is_ok() && account_output.as_ref().unwrap().status.success();
    
    // Get account info if logged in
    let account_info = if is_logged_in {
        if let Ok(output) = &account_output {
            if let Ok(json_str) = String::from_utf8(output.stdout.clone()) {
                serde_json::from_str(&json_str).unwrap_or(serde_json::json!({}))
            } else {
                serde_json::json!({})
            }
        } else {
            serde_json::json!({})
        }
    } else {
        serde_json::json!({})
    };
    
    // Get error details if account check failed
    let error_details = if !is_logged_in {
        if let Ok(output) = &account_output {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            if stderr.contains("Please run 'az login'") {
                "User not authenticated. Please run 'az login' in your terminal.".to_string()
            } else if stderr.contains("No subscriptions found") {
                "Authenticated but no subscriptions found. Please check your Azure account.".to_string()
            } else if stderr.contains("DefaultAzureCredential") {
                "Authentication failed. Please ensure you are logged in with 'az login'.".to_string()
            } else if !stderr.is_empty() {
                format!("Authentication error: {}", stderr)
            } else if !stdout.is_empty() {
                "Unexpected output during authentication check.".to_string()
            } else {
                "Unknown authentication error.".to_string()
            }
        } else {
            "Failed to execute Azure CLI command.".to_string()
        }
    } else {
        "".to_string()
    };
    
    Ok(serde_json::json!({
        "azure_cli_available": az_available,
        "is_logged_in": is_logged_in,
        "account_info": account_info,
        "error": if !is_logged_in { error_details } else { "".to_string() },
        "debug_info": {
            "path": env.get("PATH"),
            "azure_config_dir": env.get("AZURE_CONFIG_DIR"),
            "home": std::env::var(if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" }).ok(),
            "platform": if cfg!(target_os = "windows") { "windows" } else { "unix" }
        }
    }))
}

#[tauri::command]
async fn http_request(
    url: String, 
    method: Option<String>, 
    headers: HashMap<String, String>, 
    body: Option<String>
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let method = method.unwrap_or_else(|| "GET".to_string());
    
    let mut request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };
    
    // Add headers
    for (key, value) in headers {
        request = request.header(&key, &value);
    }
    
    // Add body for POST/PUT/PATCH requests
    if let Some(body_data) = body {
        if ["POST", "PUT", "PATCH"].contains(&method.to_uppercase().as_str()) {
            request = request.body(body_data);
        }
    }
    
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP error: {}", status));
    }
    
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    Ok(json)
}

#[tauri::command]
async fn test_azure_cli() -> Result<serde_json::Value, String> {
    // Set up environment variables for Azure CLI
    let mut env = std::env::vars().collect::<HashMap<String, String>>();
    
    // Ensure common paths are in PATH for Azure CLI access
    let common_paths = if cfg!(target_os = "windows") {
        vec![
            "C:\\Program Files (x86)\\Microsoft SDKs\\Azure\\CLI2\\wbin",
            "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin",
        ]
    } else {
        vec![
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin", 
            "/usr/local/bin",
            "/usr/local/sbin"
        ]
    };
    
    let current_path = env.get("PATH").unwrap_or(&String::new()).clone();
    let mut new_path = current_path.clone();
    for common_path in common_paths {
        if !new_path.contains(common_path) {
            if !new_path.is_empty() {
                if cfg!(target_os = "windows") {
                    new_path.push(';');
                } else {
                    new_path.push(':');
                }
            }
            new_path.push_str(common_path);
        }
    }
    env.insert("PATH".to_string(), new_path);
    
    // Add Azure-specific environment variables for authentication
    if let Ok(home) = std::env::var(if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" }) {
        env.insert("AZURE_CONFIG_DIR".to_string(), format!("{}/.azure", home));
    }
    
    // Test Azure CLI version
    let version_output = Command::new("az")
        .arg("--version")
        .envs(&env)
        .output();
    
    let version_available = version_output.is_ok() && version_output.as_ref().unwrap().status.success();
    let version_info = if version_available {
        if let Ok(output) = version_output {
            String::from_utf8_lossy(&output.stdout).lines().next().unwrap_or("Unknown version").to_string()
        } else {
            "Unknown version".to_string()
        }
    } else {
        "Azure CLI not available".to_string()
    };
    
    // Test account show
    let account_output = Command::new("az")
        .arg("account")
        .arg("show")
        .envs(&env)
        .output();
    
    let account_available = account_output.is_ok() && account_output.as_ref().unwrap().status.success();
    let account_info = if account_available {
        if let Ok(output) = &account_output {
            if let Ok(json_str) = String::from_utf8(output.stdout.clone()) {
                serde_json::from_str(&json_str).unwrap_or(serde_json::json!({}))
            } else {
                serde_json::json!({})
            }
        } else {
            serde_json::json!({})
        }
    } else {
        serde_json::json!({})
    };
    
    // Get error details if account check failed
    let error_details = if !account_available {
        if let Ok(output) = &account_output {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            if stderr.contains("Please run 'az login'") {
                "User not authenticated. Please run 'az login' in your terminal.".to_string()
            } else if stderr.contains("No subscriptions found") {
                "Authenticated but no subscriptions found. Please check your Azure account.".to_string()
            } else if stderr.contains("DefaultAzureCredential") {
                "Authentication failed. Please ensure you are logged in with 'az login'.".to_string()
            } else if !stderr.is_empty() {
                format!("Authentication error: {}", stderr)
            } else if !stdout.is_empty() {
                "Unexpected output during authentication check.".to_string()
            } else {
                "Unknown authentication error.".to_string()
            }
        } else {
            "Failed to execute Azure CLI command.".to_string()
        }
    } else {
        "".to_string()
    };
    
    Ok(serde_json::json!({
        "version_available": version_available,
        "version_info": version_info,
        "account_available": account_available,
        "account_info": account_info,
        "error": error_details,
        "debug_info": {
            "path": env.get("PATH"),
            "azure_config_dir": env.get("AZURE_CONFIG_DIR"),
            "home": std::env::var(if cfg!(target_os = "windows") { "USERPROFILE" } else { "HOME" }).ok(),
            "platform": if cfg!(target_os = "windows") { "windows" } else { "unix" }
        }
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            http_request,
            run_azure_resource_finder,
            run_ruchy_repl,
            check_tool_availability,
            check_azure_auth_status,
            test_azure_cli
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
