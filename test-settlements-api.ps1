# Test Settlement APIs
$baseUrl = "http://localhost:4322"

# Test data
$testData = @{
    eventId = "550e8400-e29b-41d4-a716-446655440000"  # Example UUID
    fromUserId = "550e8400-e29b-41d4-a716-446655440001"
    toUserId = "550e8400-e29b-41d4-a716-446655440002"
    amountCents = 10000  # $100.00
    paymentMethod = "venmo"
    description = "Test settlement payment"
}

Write-Host "Testing Settlement API Endpoints" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Create Settlement
Write-Host "1. Testing POST /api/settlements/create" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/settlements/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($testData | ConvertTo-Json) `
        -ErrorAction Continue
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    $settlementId = $content.settlementId
    Write-Host "Response: $($content | ConvertTo-Json -Depth 2)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get Settlement History
Write-Host "2. Testing GET /api/settlements/history" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/settlements/history" `
        -Method GET `
        -ErrorAction Continue
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($content | ConvertTo-Json -Depth 2)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get Event Settlements
Write-Host "3. Testing GET /api/settlements/event" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/settlements/event?eventId=$($testData.eventId)" `
        -Method GET `
        -ErrorAction Continue
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($content | ConvertTo-Json -Depth 2)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing complete!" -ForegroundColor Cyan
