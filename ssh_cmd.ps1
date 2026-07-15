$password = "qF9{t2b^{C"
$host = "178.172.137.167"

# Write input file first
Set-Content -Path "D:\repos\MyHelperElectron\ssh_commands.txt" -Value "echo CONNECTED_OK"

# Use ssh with stdin redirect
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "ssh"
$psi.Arguments = "-o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$host"
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8

$proc = [System.Diagnostics.Process]::Start($psi)

# Wait for password prompt
Start-Sleep -Seconds 4

# Send password
$proc.StandardInput.WriteLine($password)
$proc.StandardInput.Flush()

Start-Sleep -Seconds 3

# Read whatever is there
$proc.StandardInput.WriteLine("echo CONNECTED_OK")
$proc.StandardInput.Flush()

Start-Sleep -Seconds 3

# Try to read output
$task = $proc.StandardOutput.ReadToEndAsync()
$task.Wait(5000)

Write-Output "=== STDOUT ==="
Write-Output $task.Result

$errTask = $proc.StandardError.ReadToEndAsync()
$errTask.Wait(3000)
Write-Output "=== STDERR ==="
Write-Output $errTask.Result

if (-not $proc.HasExited) { $proc.Kill() }
