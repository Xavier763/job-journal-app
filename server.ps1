# Simple HTTP server for the Job Journal Scheduler
# Run this script to serve the application locally

$port = 8000
$url = "http://localhost:$port/"

Write-Host "Starting Job Journal Scheduler server on $url" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

try {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
    
    Write-Host "Server started successfully!" -ForegroundColor Green
    Write-Host "Open your browser and navigate to: $url" -ForegroundColor Cyan
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") {
            $localPath = "/index.html"
        }
        
        $filePath = Join-Path $PSScriptRoot $localPath.TrimStart('/')
        
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $response.ContentType = switch ([System.IO.Path]::GetExtension($filePath)) {
                ".html" { "text/html; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                default { "text/plain; charset=utf-8" }
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $errorContent = "404 - File Not Found: $localPath"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorContent)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Stop()
        Write-Host "Server stopped." -ForegroundColor Yellow
    }
}