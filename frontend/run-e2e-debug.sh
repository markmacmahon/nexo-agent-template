#!/bin/bash

# E2E Test Runner with Full Logging
# This script manages frontend/backend processes and runs e2e tests with comprehensive logging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log files
FRONTEND_LOG="/tmp/frontend-e2e.log"
BACKEND_LOG="/tmp/backend-e2e.log"
TEST_LOG="/tmp/test-e2e.log"

# PID files
FRONTEND_PID="/tmp/frontend-e2e.pid"
BACKEND_PID="/tmp/backend-e2e.pid"

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}Cleaning up...${NC}"

    # Kill frontend
    if [ -f "$FRONTEND_PID" ]; then
        FPID=$(cat "$FRONTEND_PID")
        if ps -p $FPID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping frontend (PID: $FPID)${NC}"
            kill $FPID 2>/dev/null || true
            sleep 2
            kill -9 $FPID 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID"
    fi

    # Kill backend
    if [ -f "$BACKEND_PID" ]; then
        BPID=$(cat "$BACKEND_PID")
        if ps -p $BPID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping backend (PID: $BPID)${NC}"
            kill $BPID 2>/dev/null || true
            sleep 2
            kill -9 $BPID 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID"
    fi

    echo -e "${GREEN}Cleanup complete${NC}"
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Clear old logs
> "$FRONTEND_LOG"
> "$BACKEND_LOG"
> "$TEST_LOG"

echo -e "${BLUE}=== E2E Test Runner with Full Logging ===${NC}"
echo -e "${BLUE}Frontend log: $FRONTEND_LOG${NC}"
echo -e "${BLUE}Backend log: $BACKEND_LOG${NC}"
echo -e "${BLUE}Test log: $TEST_LOG${NC}"
echo ""

# Start backend
echo -e "${GREEN}Starting backend...${NC}"
cd ../backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 > "$BACKEND_LOG" 2>&1 &
BACKEND_PID_VALUE=$!
echo $BACKEND_PID_VALUE > "$BACKEND_PID"
echo -e "${GREEN}Backend started (PID: $BACKEND_PID_VALUE)${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start!${NC}"
        echo -e "${RED}Backend log:${NC}"
        tail -50 "$BACKEND_LOG"
        exit 1
    fi
    sleep 1
done

# Start frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd ../frontend
pnpm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID_VALUE=$!
echo $FRONTEND_PID_VALUE > "$FRONTEND_PID"
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID_VALUE)${NC}"

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}Frontend failed to start!${NC}"
        echo -e "${RED}Frontend log:${NC}"
        tail -50 "$FRONTEND_LOG"
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${BLUE}=== Running E2E Tests ===${NC}"
echo ""

# Run the tests
pnpm test:e2e 2>&1 | tee "$TEST_LOG"
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${BLUE}=== Test Results ===${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Tests passed!${NC}"
else
    echo -e "${RED}✗ Tests failed!${NC}"
    echo ""
    echo -e "${YELLOW}=== Frontend Logs (last 50 lines) ===${NC}"
    tail -50 "$FRONTEND_LOG"
    echo ""
    echo -e "${YELLOW}=== Backend Logs (last 50 lines) ===${NC}"
    tail -50 "$BACKEND_LOG"
    echo ""
    echo -e "${YELLOW}=== Test Logs (last 100 lines) ===${NC}"
    tail -100 "$TEST_LOG"
fi

echo ""
echo -e "${BLUE}Full logs available at:${NC}"
echo -e "  Frontend: $FRONTEND_LOG"
echo -e "  Backend:  $BACKEND_LOG"
echo -e "  Tests:    $TEST_LOG"

exit $TEST_EXIT_CODE
