#!/usr/bin/env python3
"""
Brief: Example script template showing documentation pattern.

This script demonstrates how to document ad-hoc scripts in the incubator.
Replace this description with what your script actually does.

Usage:
    python example-script.py [--dry-run] [--verbose]

Example:
    python example-script.py --dry-run    # Preview without making changes
    python example-script.py              # Execute

Prerequisites:
    - Backend dependencies (cd backend && uv sync)
    - Database running (make docker-up-db) - if needed
    - Environment variables set - if needed

Author: Your Name
Created: 2026-02-16
Status: Example Template
"""

import argparse
import sys
from pathlib import Path


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Example script template")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without executing",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print detailed output",
    )

    args = parser.parse_args()

    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")

    if args.verbose:
        print("🔧 Verbose mode enabled")

    # Your script logic here
    print("✅ Script completed successfully!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
