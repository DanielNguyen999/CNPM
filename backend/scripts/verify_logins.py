import requests
import sys

BASE_URL = "http://127.0.0.1:8080/api/v1"

def test_login(email, password):
    print(f"Testing login for {email}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            print(f"SUCCESS: Login successful for {email}")
            return True
        else:
            print(f"FAILED: Login failed for {email} (Status: {response.status_code}, Detail: {response.text})")
            return False
    except Exception as e:
        print(f"ERROR: Could not connect to API: {e}")
        return False

def verify_all():
    roles = [
        ("Admin", "admin@bizflow.vn"),
        ("Owner", "owner1@example.com"),
        ("Employee", "employee1@example.com"),
        ("Customer", "customer1@example.com"),
    ]
    
    password = "password123"
    results = []
    
    for role, email in roles:
        results.append(test_login(email, password))
        
    if all(results):
        print("\nALL DEMO LOGINS VERIFIED!")
    else:
        print("\nSOME LOGINS FAILED. Please check the API/Database.")

if __name__ == "__main__":
    verify_all()
