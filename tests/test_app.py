import os
import sys
import pytest

# Ensure the root project directory is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import app, hash_password, verify_password


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Test the /health endpoint returns 200 and healthy status."""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data == {'status': 'healthy'}


def test_api_config(client):
    """Test the /api/config endpoint returns valid JSON configuration."""
    response = client.get('/api/config')
    assert response.status_code == 200
    data = response.get_json()
    assert data is not None
    assert data.get('success') is True
    assert 'google_client_id' in data


def test_core_page_routes(client):
    """Test core user-facing HTML routes return 200 status."""
    for route in ['/', '/signup', '/account']:
        response = client.get(route)
        assert response.status_code == 200


def test_security_blocked_extensions(client):
    """Verify that sensitive file types are blocked by server security middleware."""
    sensitive_paths = [
        'students.db',
        '.env',
        'config.json',
        'setup_ords.sql',
        'app.py',
        'start_backend.bat'
    ]
    for filename in sensitive_paths:
        response = client.get(f'/{filename}')
        assert response.status_code == 403
        data = response.get_json()
        assert data is not None
        assert data.get('success') is False
        assert data.get('message') == 'Access Denied'


def test_security_path_traversal(client):
    """Verify directory traversal attempts are strictly forbidden."""
    traversal_paths = [
        '/../app.py',
        '/./.env',
        '/.git/config'
    ]
    for path in traversal_paths:
        response = client.get(path)
        assert response.status_code == 403


def test_password_hashing_and_verification():
    """Verify password hashing produces secure hashes and verifies correctly."""
    plain = "TestPassword@2026!"
    hashed = hash_password(plain)
    
    assert hashed != plain
    # Werkzeug hashes typically start with scrypt: or pbkdf2:
    assert len(hashed) > 20
    
    # Correct password check
    is_valid, _ = verify_password(hashed, plain)
    assert is_valid is True
    
    # Wrong password check
    is_valid_wrong, _ = verify_password(hashed, "IncorrectPassword")
    assert is_valid_wrong is False


def test_send_otp_validation(client):
    """Verify input validation on the /api/send-otp endpoint."""
    # Test missing payload
    res_empty = client.post('/api/send-otp', json={})
    assert res_empty.status_code == 400
    assert res_empty.get_json().get('success') is False

    # Test invalid email format
    res_invalid_email = client.post('/api/send-otp', json={'email': 'not-an-email'})
    assert res_invalid_email.status_code == 400
    assert 'format' in res_invalid_email.get_json().get('message').lower()
