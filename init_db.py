#!/usr/bin/env python3
"""Initialize database for CI testing.

Creates all tables in SQLite test database without requiring full Flask app startup.
"""
import os
import sys

# Set environment BEFORE importing web_app
os.environ['DATABASE_URL'] = 'sqlite:///test.db'
os.environ['FLASK_ENV'] = 'development'
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['DESIGN_SYSTEM_ENABLED'] = 'true'

try:
    from web_app import app, db
    with app.app_context():
        db.create_all()
        print('✓ Database tables created successfully')
except Exception as e:
    print(f'✗ Failed to initialize database: {e}', file=sys.stderr)
    sys.exit(1)