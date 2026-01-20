export interface PowerShellCommand {
  id: string;
  name: string;
  description: string;
  category: 'dns' | 'cache' | 'network' | 'system';
  command: string;
  requiresAdmin: boolean;
}

export interface PowerShellResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

export class PowerShellService {
  private static instance: PowerShellService;
  
  private constructor() {}
  
  static getInstance(): PowerShellService {
    if (!PowerShellService.instance) {
      PowerShellService.instance = new PowerShellService();
    }
    return PowerShellService.instance;
  }

  getAvailableCommands(): PowerShellCommand[] {
    return [
      // DNS Commands
      {
        id: 'flush-dns',
        name: 'Wyczyść pamięć DNS',
        description: 'Czyści lokalną pamięć podręczną DNS',
        category: 'dns',
        command: 'Clear-DnsClientCache',
        requiresAdmin: true
      },
      {
        id: 'show-dns-cache',
        name: 'Pokaż pamięć DNS',
        description: 'Wyświetla zawartość pamięci podręcznej DNS',
        category: 'dns',
        command: 'Get-DnsClientCache | Select-Object -First 50',
        requiresAdmin: false
      },
      {
        id: 'dns-resolution',
        name: 'Rozwiąż nazwę DNS',
        description: 'Sprawdza rozpoznawanie nazwy DNS',
        category: 'dns',
        command: 'Resolve-DnsName -Name "{hostname}" -Type A',
        requiresAdmin: false
      },
      
      // Cache Commands
      {
        id: 'clear-temp-files',
        name: 'Wyczyść pliki tymczasowe',
        description: 'Usuwa pliki tymczasowe z katalogów systemowych',
        category: 'cache',
        command: 'Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue',
        requiresAdmin: false
      },
      {
        id: 'clear-browser-cache',
        name: 'Wyczyść cache przeglądarki',
        description: 'Czyści pamięć podręczną przeglądarki Chrome',
        category: 'cache',
        command: 'Remove-Item -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue',
        requiresAdmin: false
      },
      
      // Network Commands
      {
        id: 'show-active-ports',
        name: 'Pokaż aktywne porty',
        description: 'Wyświetla listę aktywnych połączeń sieciowych',
        category: 'network',
        command: 'Get-NetTCPConnection | Where-Object {$_.State -eq "Listen"} | Select-Object LocalAddress, LocalPort, State | Sort-Object LocalPort',
        requiresAdmin: false
      },
      {
        id: 'show-process-ports',
        name: 'Porty i procesy',
        description: 'Pokazuje które procesy używają jakich portów',
        category: 'network',
        command: 'Get-Process | Where-Object {$_.ProcessName -ne $null} | ForEach-Object { $proc = $_; Get-NetTCPConnection | Where-Object {$_.OwningProcess -eq $proc.Id} | Select-Object @{Name="Process";Expression={$proc.ProcessName}}, @{Name="PID";Expression={$proc.Id}}, LocalAddress, LocalPort, State } | Sort-Object LocalPort',
        requiresAdmin: true
      },
      {
        id: 'kill-port',
        name: 'Zamknij port',
        description: 'Zamyka proces używający określonego portu',
        category: 'network',
        command: '$connections = Get-NetTCPConnection | Where-Object {$_.LocalPort -eq {port}}; foreach ($conn in $connections) { Stop-Process -Id $conn.OwningProcess -Force }',
        requiresAdmin: true
      },
      {
        id: 'network-reset',
        name: 'Resetuj ustawienia sieci',
        description: 'Resetuje stos sieciowy TCP/IP',
        category: 'network',
        command: 'netsh int ip reset; netsh winsock reset',
        requiresAdmin: true
      },
      
      // System Commands
      {
        id: 'system-info',
        name: 'Informacje o systemie',
        description: 'Wyświetla podstawowe informacje o systemie',
        category: 'system',
        command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory, CsProcessors | Format-List',
        requiresAdmin: false
      },
      {
        id: 'running-services',
        name: 'Uruchomione usługi',
        description: 'Pokazuje listę uruchomionych usług systemowych',
        category: 'system',
        command: 'Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName, Status | Sort-Object Name',
        requiresAdmin: false
      }
    ];
  }

  getCommandsByCategory(category: PowerShellCommand['category']): PowerShellCommand[] {
    return this.getAvailableCommands().filter(cmd => cmd.category === category);
  }

  async executeCommand(command: PowerShellCommand, params?: Record<string, string>): Promise<PowerShellResult> {
    try {
      let finalCommand = command.command;
      
      // Replace parameters if provided
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          finalCommand = finalCommand.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
      }

      // In a real implementation, this would execute PowerShell
      // For now, we'll simulate the execution
      console.log(`Executing PowerShell command: ${finalCommand}`);
      
      // Simulate different command results
      return this.simulateCommandResult(command.id, finalCommand);
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        exitCode: 1
      };
    }
  }

  private simulateCommandResult(commandId: string, command: string): PowerShellResult {
    // Simulate different command results based on command ID
    switch (commandId) {
      case 'flush-dns':
        return {
          success: true,
          output: 'Pamięć DNS została pomyślnie wyczyszczona.',
          exitCode: 0
        };
      
      case 'show-dns-cache':
        return {
          success: true,
          output: `
Name                             Type   TTL   Section    IPAddress
----                             ----   ---   -------    ---------
google.com                       A      300   Answer     142.250.185.78
microsoft.com                    A      300   Answer     20.236.44.162
localhost                        A      86400 Answer     127.0.0.1
          `.trim(),
          exitCode: 0
        };
      
      case 'show-active-ports':
        return {
          success: true,
          output: `
LocalAddress LocalPort State
------------ --------- -----
0.0.0.0      80        Listen
0.0.0.0      443       Listen
0.0.0.0      3306      Listen
0.0.0.0      8080      Listen
0.0.0.0      5770      Listen
          `.trim(),
          exitCode: 0
        };
      
      case 'kill-port':
        return {
          success: true,
          output: 'Proces na porcie został zakończony.',
          exitCode: 0
        };
      
      case 'clear-temp-files':
        return {
          success: true,
          output: 'Pliki tymczasowe zostały usunięte.',
          exitCode: 0
        };
      
      case 'system-info':
        return {
          success: true,
          output: `
WindowsProductName : Windows 10 Pro
WindowsVersion     : 2009
TotalPhysicalMemory: 16777216
CsProcessors       : Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz
          `.trim(),
          exitCode: 0
        };
      
      default:
        return {
          success: true,
          output: `Pomyślnie wykonano: ${command}`,
          exitCode: 0
        };
    }
  }

  // Real implementation would use Node.js child_process or similar
  // This is a placeholder for actual PowerShell execution
  private async executePowerShellScript(script: string): Promise<PowerShellResult> {
    // In a real implementation, this would:
    // 1. Use child_process.spawn to run PowerShell
    // 2. Handle admin privileges if required
    // 3. Parse output and errors
    // 4. Return structured results
    
    // For now, return a simulation
    return {
      success: true,
      output: 'PowerShell execution not implemented - simulation mode',
      exitCode: 0
    };
  }
}

export const powerShellService = PowerShellService.getInstance();