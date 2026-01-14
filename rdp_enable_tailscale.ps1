param(
    [string]$TailscaleRange = '100.64.0.0/10',
    [string]$Log = 'U:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\rdp_enable_tailscale.log'
)

$ErrorActionPreference = 'Stop'

function Write-Log([string]$msg) {
    $msg | Out-File -FilePath $Log -Append -Encoding utf8
}

function Try-StartService([string]$name) {
    try {
        $svc = Get-Service -Name $name -ErrorAction Stop
        Write-Log ("Service {0}: {1} ({2})" -f $name, $svc.Status, $svc.StartType)
        if ($svc.Status -ne 'Running') {
            Start-Service -Name $name -ErrorAction Stop
            $svc2 = Get-Service -Name $name -ErrorAction Stop
            Write-Log ("Service {0} started: {1}" -f $name, $svc2.Status)
        }
    }
    catch {
        Write-Log ("Service {0} start failed: {1}" -f $name, $_.Exception.Message)
    }
}

function Try-RestartService([string]$name) {
    try {
        Restart-Service -Name $name -Force -ErrorAction Stop
        $svc = Get-Service -Name $name -ErrorAction Stop
        Write-Log ("Service {0} restarted: {1}" -f $name, $svc.Status)
    }
    catch {
        Write-Log ("Service {0} restart failed: {1}" -f $name, $_.Exception.Message)
    }
}

"=== $(Get-Date -Format o) START ===" | Out-File -FilePath $Log -Encoding utf8
Write-Log "TailscaleRange=$TailscaleRange"

try {
    $os = Get-ComputerInfo | Select-Object -First 1 -Property WindowsProductName, WindowsEditionId, OsName, OsVersion
    Write-Log ("OS={0} EditionId={1} Version={2}" -f $os.OsName, $os.WindowsEditionId, $os.OsVersion)

    # Enable Remote Desktop
    Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name fDenyTSConnections -Value 0

    # Ensure service is running
    Set-Service -Name TermService -StartupType Automatic
    Start-Service -Name TermService

    # Try to start RDP helper services (best-effort)
    Try-StartService -name 'UmRdpService'
    Try-StartService -name 'SessionEnv'

    # Force rebind/listener (best-effort)
    Try-RestartService -name 'TermService'
    Start-Sleep -Seconds 2

    # Enable built-in firewall rules (if present) and restrict to Tailscale range
    $ruleNames = @(
        'RemoteDesktop-UserMode-In-TCP',
        'RemoteDesktop-UserMode-In-UDP',
        'RemoteDesktop-In-TCP-WS',
        'RemoteDesktop-In-TCP-WSS',
        'RemoteDesktop-Shadow-In-TCP'
    )

    $found = @()
    foreach ($name in $ruleNames) {
        $r = Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
        if ($null -ne $r) { $found += $name }
    }

    if ($found.Count -eq 0) {
        New-NetFirewallRule -DisplayName 'RDP (Tailscale only)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3389 -RemoteAddress $TailscaleRange -Profile Any | Out-Null
        Write-Log 'Created firewall rule: RDP (Tailscale only)'
    }
    else {
        foreach ($name in $found) {
            Enable-NetFirewallRule -Name $name | Out-Null
            Set-NetFirewallRule -Name $name -RemoteAddress $TailscaleRange -Profile Any -Enabled True | Out-Null
        }
        Write-Log ('Enabled & restricted rules: ' + ($found -join ', '))
    }

    # Post-checks
    Write-Log '--- CHECKS ---'
    Write-Log ('fDenyTSConnections=' + (Get-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name fDenyTSConnections).fDenyTSConnections)
    (Get-Service TermService | Select-Object Status, StartType, Name | Format-Table -Auto | Out-String) | Out-File -FilePath $Log -Append -Encoding utf8
    (Get-Service UmRdpService, SessionEnv -ErrorAction SilentlyContinue | Select-Object Status, StartType, Name | Format-Table -Auto | Out-String) | Out-File -FilePath $Log -Append -Encoding utf8
    (Test-NetConnection -ComputerName 127.0.0.1 -Port 3389 | Format-List | Out-String) | Out-File -FilePath $Log -Append -Encoding utf8
    (Get-NetTCPConnection -LocalPort 3389 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table -Auto | Out-String) | Out-File -FilePath $Log -Append -Encoding utf8

    $fw = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'RemoteDesktop-*' -and $_.Direction -eq 'Inbound' }
    ($fw | Select-Object Name, Enabled, Profile, Action | Sort-Object Name | Format-Table -Auto | Out-String) | Out-File -FilePath $Log -Append -Encoding utf8
    ($fw | ForEach-Object { $addr = (Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $_ -ErrorAction SilentlyContinue).RemoteAddress; [PSCustomObject]@{Name = $_.Name; RemoteAddress = ($addr -join ',') } } | Format-Table -Auto | Out-String) | Out-File -FilePath $Log -Append -Encoding utf8

    Write-Log "OK"
}
catch {
    Write-Log ('ERROR: ' + $_.Exception.Message)
    throw
}
finally {
    Write-Log ("=== $(Get-Date -Format o) END ===")
}
