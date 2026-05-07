#!/usr/bin/env bash

# ============================================================================
# Food Store Development Environment Setup Script
# 
# This script helps team members set up the development environment
# with Docker PostgreSQL, Python venv, and npm dependencies.
# 
# Usage:
#   bash scripts/setup-dev.sh
#   bash scripts/setup-dev.sh --help
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

# Display help
show_help() {
    cat << EOF
Food Store Development Setup Script

USAGE:
    bash scripts/setup-dev.sh [OPTIONS]

OPTIONS:
    --help              Show this help message
    --docker-only       Only set up Docker (skip backend/frontend setup)
    --no-docker         Skip Docker setup (assume already running)
    --backend-only      Only set up backend
    --frontend-only     Only set up frontend
    --reset             Remove volumes and start fresh (⚠️ deletes DB data)

EXAMPLES:
    # Full setup (recommended for first time)
    bash scripts/setup-dev.sh

    # Just set up Docker
    bash scripts/setup-dev.sh --docker-only

    # Set up everything but skip Docker (it's already running)
    bash scripts/setup-dev.sh --no-docker

    # Reset everything (warning: deletes database)
    bash scripts/setup-dev.sh --reset

EOF
    exit 0
}

# Check if commands exist
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup flow
main() {
    local setup_docker=true
    local setup_backend=true
    local setup_frontend=true
    local reset_volumes=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                ;;
            --docker-only)
                setup_backend=false
                setup_frontend=false
                ;;
            --no-docker)
                setup_docker=false
                ;;
            --backend-only)
                setup_frontend=false
                ;;
            --frontend-only)
                setup_backend=false
                ;;
            --reset)
                reset_volumes=true
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                ;;
        esac
        shift
    done

    print_header "Food Store Development Environment Setup"
    echo "This script will set up your local development environment."
    echo ""

    # Check prerequisites
    print_step "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker found"

    if ! command_exists docker-compose; then
        print_error "docker-compose is not installed"
        exit 1
    fi
    print_success "docker-compose found"

    if [[ "$setup_backend" == true ]]; then
        if ! command_exists python3; then
            print_error "Python 3 is not installed"
            exit 1
        fi
        print_success "Python 3 found ($(python3 --version))"
    fi

    if [[ "$setup_frontend" == true ]]; then
        if ! command_exists node; then
            print_error "Node.js is not installed"
            exit 1
        fi
        print_success "Node.js found ($(node --version))"
    fi

    echo ""

    # Step 1: Docker PostgreSQL
    if [[ "$setup_docker" == true ]]; then
        print_header "Step 1: Setting up PostgreSQL with Docker"

        if [[ "$reset_volumes" == true ]]; then
            print_warning "Resetting Docker volumes (deletes all database data)..."
            docker-compose down -v
            print_success "Volumes removed"
        fi

        print_step "Starting PostgreSQL container..."
        docker-compose up -d postgres
        sleep 5  # Give PostgreSQL time to start

        print_step "Waiting for PostgreSQL to be ready..."
        until docker-compose exec -T postgres pg_isready -U food_store_user -d food_store > /dev/null 2>&1; do
            echo "  Waiting..."
            sleep 2
        done

        print_success "PostgreSQL is running and ready"
        echo "  Container: food_store_postgres"
        echo "  Port: 5432"
        echo "  User: food_store_user"
        echo "  Databases: food_store, food_store_test"
        echo ""
    fi

    # Step 2: Backend setup
    if [[ "$setup_backend" == true ]]; then
        print_header "Step 2: Setting up Backend"

        print_step "Creating Python virtual environment..."
        if [[ ! -d "backend/venv" ]]; then
            cd backend
            python3 -m venv venv
            cd ..
            print_success "Virtual environment created"
        else
            print_warning "Virtual environment already exists"
        fi

        print_step "Installing Python dependencies..."
        cd backend
        source venv/bin/activate
        pip install --upgrade pip setuptools wheel
        pip install -r requirements.txt
        cd ..
        print_success "Python dependencies installed"

        print_step "Setting up environment file..."
        if [[ ! -f "backend/.env" ]]; then
            if [[ -f "backend/.env.docker-example" ]]; then
                cp backend/.env.docker-example backend/.env
                print_success "Copied .env.docker-example to .env"
            else
                print_warning ".env.docker-example not found, skipping .env setup"
            fi
        else
            print_warning "backend/.env already exists (skipping)"
        fi

        print_step "Running database migrations..."
        cd backend
        source venv/bin/activate
        alembic upgrade head
        cd ..
        print_success "Migrations applied"

        echo ""
    fi

    # Step 3: Frontend setup
    if [[ "$setup_frontend" == true ]]; then
        print_header "Step 3: Setting up Frontend"

        print_step "Installing npm dependencies..."
        npm install
        print_success "npm dependencies installed"

        print_step "Setting up frontend environment..."
        if [[ ! -f "frontend/.env.local" ]]; then
            cat > frontend/.env.local << 'EOF'
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_ENV=development
VITE_DEBUG=true
EOF
            print_success "Created frontend/.env.local"
        else
            print_warning "frontend/.env.local already exists (skipping)"
        fi

        echo ""
    fi

    # Final instructions
    print_header "Setup Complete! 🎉"
    echo ""
    echo "Next steps:"
    echo ""

    if [[ "$setup_backend" == true ]]; then
        echo "1️⃣  Start the backend:"
        echo "   cd backend"
        echo "   source venv/bin/activate"
        echo "   uvicorn app.main:app --reload"
        echo "   → API will be at http://localhost:8000"
        echo "   → Swagger docs at http://localhost:8000/docs"
        echo ""
    fi

    if [[ "$setup_frontend" == true ]]; then
        echo "2️⃣  Start the frontend (in another terminal):"
        echo "   npm run dev --workspace frontend"
        echo "   → App will be at http://localhost:5173"
        echo ""
    fi

    echo "3️⃣  Run tests:"
    echo "   npm run test"
    echo ""

    echo "4️⃣  Check PostgreSQL:"
    echo "   docker-compose exec postgres psql -U food_store_user -d food_store"
    echo ""

    if [[ "$setup_docker" == true ]]; then
        echo "Docker commands:"
        echo "  View logs:        docker-compose logs postgres"
        echo "  Stop services:    docker-compose down"
        echo "  Restart:          docker-compose up -d"
        echo ""
    fi

    print_success "Development environment is ready!"
}

# Run main function
main "$@"
