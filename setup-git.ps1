# Git Setup Verification Script
# Run this script after installing Git to verify setup

Write-Host "=== Git Setup Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
Write-Host "Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
        Write-Host "  Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
        Write-Host "  Then restart your terminal and run this script again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "  Then restart your terminal and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check Git configuration
Write-Host "Checking Git configuration..." -ForegroundColor Yellow
$gitUserName = git config --global user.name 2>&1
$gitUserEmail = git config --global user.email 2>&1

if ($gitUserName -and $gitUserEmail) {
    Write-Host "✓ Git user name: $gitUserName" -ForegroundColor Green
    Write-Host "✓ Git user email: $gitUserEmail" -ForegroundColor Green
} else {
    Write-Host "⚠ Git user name or email not configured" -ForegroundColor Yellow
    Write-Host "  Run the following commands to configure:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name `"Your Name`"" -ForegroundColor Cyan
    Write-Host "  git config --global user.email `"your.email@example.com`"" -ForegroundColor Cyan
}

Write-Host ""

# Check if repository is initialized
Write-Host "Checking Git repository status..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git repository is initialized" -ForegroundColor Green
    
    # Check repository status
    $gitStatus = git status --short 2>&1
    if ($gitStatus) {
        Write-Host "  There are uncommitted changes" -ForegroundColor Yellow
        Write-Host "  Run 'git add .' and 'git commit -m `"Initial commit`"' to commit changes" -ForegroundColor Cyan
    } else {
        $hasCommits = git log --oneline -n 1 2>&1
        if ($hasCommits) {
            Write-Host "✓ Repository has commits" -ForegroundColor Green
        } else {
            Write-Host "  Repository initialized but no commits yet" -ForegroundColor Yellow
            Write-Host "  Run 'git add .' and 'git commit -m `"Initial commit`"' to create first commit" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "⚠ Git repository is not initialized" -ForegroundColor Yellow
    Write-Host "  Run 'git init' to initialize the repository" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If repository is not initialized: git init" -ForegroundColor Cyan
Write-Host "2. Add all files: git add ." -ForegroundColor Cyan
Write-Host "3. Create first commit: git commit -m `"Initial commit`"" -ForegroundColor Cyan
Write-Host "4. Run EAS build: eas build --platform ios" -ForegroundColor Cyan


