# Fix Telegram Webhook - Enable all update types

$BOT_TOKEN = "8193867529:AAEJ3wSGSTZvExtkAqrCaAhNzfhULbpufzs"
$WEBHOOK_URL = "https://giant-mouse-652.convex.site/telegram/webhook"

Write-Host "Updating webhook with all update types..." -ForegroundColor Yellow

$body = @{
    url = $WEBHOOK_URL
    allowed_updates = @(
        "message",
        "edited_message", 
        "callback_query",
        "inline_query",
        "chosen_inline_result"
    )
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -Method Post -Body $body -ContentType "application/json"

if ($response.ok) {
    Write-Host "✅ Webhook updated successfully!" -ForegroundColor Green
    Write-Host "Description: $($response.description)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update webhook" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json)
}

# Check webhook info
Write-Host "`nWebhook Info:" -ForegroundColor Yellow
$info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" -Method Get
$info.result | ConvertTo-Json | Write-Host

Write-Host "`nTesting with getUpdates..." -ForegroundColor Yellow
$updates = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getUpdates?limit=5" -Method Get
Write-Host "Pending updates: $($updates.result.Count)" -ForegroundColor Cyan
if ($updates.result.Count -gt 0) {
    Write-Host "Latest update:" -ForegroundColor Cyan
    $updates.result[-1] | ConvertTo-Json -Depth 5 | Write-Host
}
