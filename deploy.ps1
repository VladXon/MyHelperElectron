$password = "qF9{t2b^{C"
$server = "root@178.172.137.167"

# Create a temporary expect-like script
$script = @'
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no {0}
expect {{
    "password:" {{
        send "{1}\r"
        expect "# "
        send "echo CONNECTED\r"
        expect "# "
        send "node -v\r"
        expect "# "
        send "npm -v\r"
        expect "# "
        send "exit\r"
        expect eof
}}
'@ -f $server, $password

Write-Output "Trying alternative SSH method..."

# Try using ssh with -tt and echo
$proc = New-Object System.Diagnostics.Process
$proc.StartInfo.FileName = "ssh"
$proc.StartInfo.Arguments = "-tt -o StrictHostKeyChecking=no root@178.172.137.167"
$proc.StartInfo.UseShellExecute = $false
$proc.StartInfo.RedirectStandardInput = $true
$proc.StartInfo.RedirectStandardOutput = $true
$proc.StartInfo.RedirectStandardError = $true
$proc.StartInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8

$proc.Start() | Out-Null
Start-Sleep -Seconds 3

# Check what's in output buffer
$errOutput = $proc.StandardError.ReadToEnd()
$stdOutput = $proc.StandardOutput.ReadToEnd()

Write-Output "STDOUT: $stdOutput"
Write-Output "STDERR: $errOutput"

if ($proc.HasExited -eq $false) {
    $proc.StandardInput.WriteLine($password)
    Start-Sleep -Seconds 5
    $output = $proc.StandardOutput.ReadToEnd()
    Write-Output "AFTER PASS: $output"
    $proc.Kill()
}
