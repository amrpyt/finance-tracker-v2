# Update Telegram Webhook to Dev URL
# Run this script to point the bot to dev deployment for testing

$BOT_TOKEN = "8193867529:AAEJ3wSGSTZvExtkAqrCaAhNzfhULbpufzs"
$WEBHOOK_URL = "https://terrific-ocelot-625.convex.site/telegram/webhook"

Write-Host "Setting Telegram webhook to DEV..." -ForegroundColor Yellow
Write-Host "URL: $WEBHOOK_URL" -ForegroundColor Cyan

$body = @{
    url = $WEBHOOK_URL
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -Method Post -Body $body -ContentType "application/json"

if ($response.ok) {
    Write-Host "✅ Webhook updated successfully!" -ForegroundColor Green
    Write-Host "Description: $($response.description)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update webhook" -ForegroundColor Red
    Write-Host $response
}

# Check webhook info
Write-Host "`nChecking webhook status..." -ForegroundColor Yellow
$info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" -Method Get

Write-Host "Current webhook URL: $($info.result.url)" -ForegroundColor Cyan
Write-Host "Pending updates: $($info.result.pending_update_count)" -ForegroundColor Cyan
if ($info.result.last_error_message) {
    Write-Host "Last error: $($info.result.last_error_message)" -ForegroundColor Red
}
