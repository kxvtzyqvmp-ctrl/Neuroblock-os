# Git Repository Initialization Script
# Run this script after Git is installed and verified

Write-Host "=== Initializing Git Repository ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
        Write-Host "  Please install Git first and restart your terminal." -ForegroundColor Yellow
        Write-Host "  See GIT_SETUP.md for instructions." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Git first and restart your terminal." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Initialize Git repository if not already initialized
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to initialize Git repository" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Check Git configuration
Write-Host "Checking Git configuration..." -ForegroundColor Yellow
$gitUserName = git config --global user.name 2>&1
$gitUserEmail = git config --global user.email 2>&1

if (-not $gitUserName -or -not $gitUserEmail) {
    Write-Host "⚠ Git user name or email not configured" -ForegroundColor Yellow
    Write-Host "  Please configure Git with:" -ForegroundColor Cyan
    Write-Host "  git config --global user.name `"Your Name`"" -ForegroundColor Cyan
    Write-Host "  git config --global user.email `"your.email@example.com`"" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Press any key to continue without configuring, or Ctrl+C to exit and configure..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""

# Stage all files
Write-Host "Staging all files..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Files staged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to stage files" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if there are changes to commit
$gitStatus = git status --short 2>&1
if ($gitStatus) {
    Write-Host "Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit - Expo project setup for EAS builds"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Initial commit created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create commit" -ForegroundColor Red
        Write-Host "  You may need to configure Git user name and email first." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⚠ No changes to commit (repository may already be up to date)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Git Repository Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run EAS build" -ForegroundColor Yellow
Write-Host "  eas build --platform ios" -ForegroundColor Cyan
Write-Host ""


