# Test Settlement APIs with Authentication
$baseUrl = "http://localhost:4322"
$webClient = New-Object System.Net.CookieContainer

# Test login first
Write-Host "Testing Settlement APIs with Authentication" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login as a test user
Write-Host "1. Logging in as test user..." -ForegroundColor Yellow
try {
    # Create a web request handler with cookie support
    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.CookieContainer = $webClient
    $client = New-Object System.Net.Http.HttpClient($handler)
    
    $loginData = @{
        username = "alice"
        password = "AlicePass123"
    } | ConvertTo-Json
    
    $content = New-Object System.Net.Http.StringContent($loginData, [System.Text.Encoding]::UTF8, "application/json")
    $response = $client.PostAsync("$baseUrl/api/auth/login", $content).Result
    
    Write-Host "Login Status: $($response.StatusCode)" -ForegroundColor Green
    
    if ($response.StatusCode -eq "OK" -or $response.StatusCode -eq "Created") {
        Write-Host "✓ Login successful!" -ForegroundColor Green
        Write-Host ""
    }
    else {
        Write-Host "Login response: $($response.Content.ReadAsStringAsync().Result)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error logging in: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check session
Write-Host "2. Checking current user..." -ForegroundColor Yellow
try {
    $response = $client.GetAsync("$baseUrl/api/auth/me").Result
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $userData = $response.Content.ReadAsStringAsync().Result | ConvertFrom-Json
    Write-Host "Current User: $($userData | ConvertTo-Json -Depth 2)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get settlement history
Write-Host "3. Getting settlement history..." -ForegroundColor Yellow
try {
    $response = $client.GetAsync("$baseUrl/api/settlements/history").Result
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $historyData = $response.Content.ReadAsStringAsync().Result | ConvertFrom-Json
    Write-Host "History: $($historyData | ConvertTo-Json -Depth 2)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing complete!" -ForegroundColor Cyan
