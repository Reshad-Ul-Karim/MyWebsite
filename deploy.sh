#!/bin/bash

# 🚀 GitHub Pages Deployment Script
# This script helps deploy your personal website to GitHub Pages

echo "🚀 Personal Website Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Get GitHub username
echo ""
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GitHub username cannot be empty."
    exit 1
fi

# Repository name for GitHub Pages
REPO_NAME="${GITHUB_USERNAME}.github.io"

print_status "Repository will be: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
print_status "Website will be available at: https://${REPO_NAME}"

echo ""
read -p "Continue with deployment? (y/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized."
else
    print_status "Git repository already exists."
fi

# Add all files
print_status "Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit."
else
    # Commit changes
    print_status "Committing changes..."
    git commit -m "Deploy personal portfolio website

- Modern minimalistic design
- Responsive layout
- Interactive animations
- Contact form
- Dark/light theme toggle
- SEO optimized"
    print_success "Changes committed."
fi

# Check if remote origin exists
if git remote get-url origin &> /dev/null; then
    print_status "Remote origin already exists."
    EXISTING_REMOTE=$(git remote get-url origin)
    print_status "Current remote: $EXISTING_REMOTE"
    
    echo ""
    read -p "Update remote origin? (y/N): " UPDATE_REMOTE
    
    if [[ $UPDATE_REMOTE =~ ^[Yy]$ ]]; then
        git remote set-url origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
        print_success "Remote origin updated."
    fi
else
    # Add remote origin
    print_status "Adding remote origin..."
    git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    print_success "Remote origin added."
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_status "Current branch: $CURRENT_BRANCH"
    print_status "Switching to main branch..."
    git checkout -b main 2>/dev/null || git checkout main
fi

# Push to GitHub
print_status "Pushing to GitHub..."
if git push -u origin main; then
    print_success "Successfully pushed to GitHub!"
else
    print_error "Failed to push to GitHub."
    print_warning "Make sure you have:"
    echo "  1. Created the repository on GitHub"
    echo "  2. Set up authentication (SSH keys or personal access token)"
    echo "  3. Have push permissions to the repository"
    exit 1
fi

echo ""
print_success "🎉 Deployment completed!"
echo ""
print_status "Next steps:"
echo "  1. Go to https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo "  2. Click on 'Settings' tab"
echo "  3. Scroll down to 'Pages' section"
echo "  4. Under 'Source', select 'Deploy from a branch'"
echo "  5. Choose 'main' branch and '/ (root)' folder"
echo "  6. Click 'Save'"
echo ""
print_status "Your website will be available at: https://${REPO_NAME}"
print_warning "Note: It may take a few minutes for the site to be live."

echo ""
print_status "Repository created: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
print_status "Website URL: https://${REPO_NAME}"

# Optional: Open URLs in browser (macOS/Linux)
if command -v open &> /dev/null; then
    echo ""
    read -p "Open GitHub repository in browser? (y/N): " OPEN_REPO
    if [[ $OPEN_REPO =~ ^[Yy]$ ]]; then
        open "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    fi
elif command -v xdg-open &> /dev/null; then
    echo ""
    read -p "Open GitHub repository in browser? (y/N): " OPEN_REPO
    if [[ $OPEN_REPO =~ ^[Yy]$ ]]; then
        xdg-open "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    fi
fi

echo ""
print_success "Happy coding! 🚀" 