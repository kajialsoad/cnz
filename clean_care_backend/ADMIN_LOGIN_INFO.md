# Clean Care Bangladesh - Admin Login Information

## 🔐 Admin Panel Access

### Login Credentials:

**Username:** `admin`  
**Password:** `admin123`

### 🌐 URLs:

**Admin Panel:**  
```
http://localhost:8000/admin/
```

**Custom Dashboard:**  
```
http://localhost:8000/dashboard/
```

### 📝 Login Steps:

1. Open browser
2. Go to: `http://localhost:8000/admin/`
3. Enter username: `admin`
4. Enter password: `admin123`
5. Click "Log in"
6. ✅ Success!

### 🎯 After Login:

- View Django Admin Panel
- Manage Users, Groups, Permissions
- Access Custom Dashboard at `/dashboard/`

### 🔒 Change Password:

```bash
cd clean_care_backend
.\venv\Scripts\activate
python manage.py changepassword admin
```

### 🆘 Forgot Password?

Reset with:
```bash
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> admin = User.objects.get(username='admin')
>>> admin.set_password('newpassword123')
>>> admin.save()
>>> exit()
```

---

## 🚀 Server Status

**Django Server:** Running on `http://127.0.0.1:8000/`

**Start Server:**
```bash
cd clean_care_backend
.\venv\Scripts\activate
python manage.py runserver
```

**Stop Server:** Press `CTRL+C` in terminal

---

**Happy Administrating! 🎉**
