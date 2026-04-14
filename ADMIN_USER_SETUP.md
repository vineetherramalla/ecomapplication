# Admin User Setup Guide

## Problem
The admin login is showing **"Invalid credentials"** error because these credentials don't exist in your Django backend database.

## Solution

### Option 1: Create Admin User via Django Shell (Recommended)

1. **Navigate to your Django project directory**:
```bash
cd path/to/your/django/project
```

2. **Open Django shell**:
```bash
python manage.py shell
```

3. **Create the admin user**:
```python
from django.contrib.auth.models import User

# Create superuser with the test credentials
user = User.objects.create_superuser(
    username='gdurgaprasad065',
    email='gdurgaprasad065@gmail.com',
    password='D'
)

# Check if user was created
print(f"User created: {user.email}")
print(f"User is staff: {user.is_staff}")
print(f"User is superuser: {user.is_superuser}")
```

4. **Exit the shell** (Ctrl+D)

### Option 2: Create Admin User via Django Admin Panel

1. **Create a superuser first** (if you don't have one):
```bash
python manage.py createsuperuser
# Follow the prompts to create an admin account
```

2. **Start your Django server**:
```bash
python manage.py runserver 0.0.0.0:8000
```

3. **Go to Django admin**: `http://192.168.0.113:8000/admin`

4. **Login with the superuser credentials you just created**

5. **Go to Users section and create a new user**:
   - Username: `gdurgaprasad065`
   - Email: `gdurgaprasad065@gmail.com`
   - Password: `D`
   - Mark as `Staff status` and `Superuser` if you want full admin access

### Option 3: Check Existing Admin Users

If you want to use existing credentials instead:

```python
# In Django shell
from django.contrib.auth.models import User

# List all users
for user in User.objects.all():
    print(f"Username: {user.username}, Email: {user.email}, Staff: {user.is_staff}")

# Or check specific user
user = User.objects.filter(email='your-email@example.com').first()
if user:
    print(f"User exists: {user.username}")
else:
    print("User not found")
```

## Verify It Works

1. **Test the credentials in the frontend**:
   - Go to `http://localhost:5174/login`
   - Email: `gdurgaprasad065@gmail.com`
   - Password: `D`
   - Click "Login to dashboard"

2. **You should see**:
   - Console: `✅ Backend login successful`
   - Toast notification: "Admin login successful"
   - Redirect to admin dashboard

## Password Security Notes

⚠️ The password `D` is very weak. In production, use:
- Strong passwords (at least 12 characters)
- Database-level password hashing (Django handles this automatically)
- HTTPS for all admin login endpoints

## Common Issues

### Issue: "User already exists"
```python
# Delete and recreate
user = User.objects.get(email='gdurgaprasad065@gmail.com')
user.delete()

# Then create again following Option 1 steps above
```

### Issue: "User created but still 'Invalid credentials'"
1. Make sure the user is marked as `is_active = True`
2. Ensure the password is correct (case-sensitive)
3. Check your Django login view accepts email-based authentication

```python
# Verify user is active
user = User.objects.get(email='gdurgaprasad065@gmail.com')
print(f"Is active: {user.is_active}")

# If not, activate it
user.is_active = True
user.save()
```

### Issue: Django admin page `/admin/` doesn't exist
Your backend might have a custom login endpoint. Check your `urls.py`:

```python
# Your Django urls.py should have something like:
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', your_login_view),  # This is what the frontend uses
]
```

## Development vs Production

### Development Mode
- Test credentials work without backend DB (frontend fallback)
- Mock data is returned for all API calls
- Useful for UI/UX testing without backend setup

### Production Mode
- All credentials must exist in backend database
- Real JWT tokens are used
- Backend validation is strict

## Frontend Configuration

Your frontend automatically:
✅ Detects if you're using test credentials
✅ Uses mock authentication in development
✅ Provides helpful error messages
✅ Logs guidance to browser console

Check your browser console (F12 → Console tab) for detailed error information and setup guidance.

---

Need help? Check the browser console for detailed error messages with setup instructions!
