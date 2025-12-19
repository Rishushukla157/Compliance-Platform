# Test nginx connectivity and proxy setup

Write-Host "🔍 Testing Nginx Proxy Setup on Port 5500" -ForegroundColor Cyan
Write-Host ""

# Check if containers are running
Write-Host "1. 📦 Container Status:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""

# Check nginx logs
Write-Host "2. 📋 Nginx Logs:" -ForegroundColor Yellow
docker-compose logs --tail=20 nginx

Write-Host ""

# Test individual services
Write-Host "3. 🧪 Testing Individual Services:" -ForegroundColor Yellow

# Test backend directly
try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend (direct): $($backendTest.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend (direct): Not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test frontend directly
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend (direct): $($frontendTest.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend (direct): Not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Test nginx proxy
Write-Host "4. 🔀 Testing Nginx Proxy (Port 5500):" -ForegroundColor Yellow

# Test nginx health
try {
    $nginxHealth = Invoke-WebRequest -Uri "http://localhost:5500/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Nginx Health: $($nginxHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Nginx Health: Not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test backend through proxy
try {
    $proxyBackend = Invoke-WebRequest -Uri "http://localhost:5500/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend (via proxy): $($proxyBackend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend (via proxy): Not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test frontend through proxy
try {
    $proxyFrontend = Invoke-WebRequest -Uri "http://localhost:5500" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend (via proxy): $($proxyFrontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend (via proxy): Not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check port usage
Write-Host "5. 🔌 Port Status:" -ForegroundColor Yellow
$ports = @(3000, 3001, 5500, 27017)

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Port $port : ✅ IN USE" -ForegroundColor Green
    } else {
        Write-Host "Port $port : ❌ NOT IN USE" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Access Points:" -ForegroundColor Green
Write-Host "   Main App (via proxy): http://localhost:5500" -ForegroundColor Cyan
Write-Host "   API (via proxy): http://localhost:5500/api/*" -ForegroundColor Cyan
Write-Host "   Direct Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Direct Backend: http://localhost:3001" -ForegroundColor Gray

Write-Host ""
Write-Host "🔧 If nginx is not working:" -ForegroundColor Yellow
Write-Host "   1. Restart nginx: docker-compose restart nginx" -ForegroundColor White
Write-Host "   2. Check nginx config: docker-compose exec nginx nginx -t" -ForegroundColor White
Write-Host "   3. Restart all: docker-compose down && docker-compose up -d" -ForegroundColor White
