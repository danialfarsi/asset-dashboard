"""
اسکریپت ساخت سازمان و کاربران ملی مس
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Organization, User
from django.contrib.auth.hashers import make_password

print("="*60)
print("🏢 شروع ساخت سازمان و کاربران ملی مس")
print("="*60)

# ══════════════════════════════════════════
# ۱. ساخت سازمان ملی مس
# ══════════════════════════════════════════
org, created = Organization.objects.get_or_create(
    code='NICICO',
    defaults={
        'name': 'ملی مس',
    }
)
print(f"\n🏢 سازمان: {org.name} (id={org.id}, code={org.code}) - {'✅ ساخته شد' if created else '⚠️ از قبل وجود داشت'}")

# ══════════════════════════════════════════
# ۲. ساخت org_admin: محمد شیخی
# ══════════════════════════════════════════
admin_email = 'mohammad_sheikhi@nicico.com'
admin_user, created = User.objects.get_or_create(
    email=admin_email,
    defaults={
        'username': 'mohammad_sheikhi',
        'first_name': 'محمد',
        'last_name': 'شیخی',
        'role': 'org_admin',
        'organization': org,
        'organization_type': 'manufacturing',
        'is_active': True,
        'password': make_password('123456'),
    }
)
if created:
    print(f"✅ org_admin ساخته شد: {admin_user.email} (id={admin_user.id})")
else:
    print(f"⚠️ org_admin از قبل وجود داشت: {admin_user.email}")

# ══════════════════════════════════════════
# ۳. ساخت org_user: علی بهلولی
# ══════════════════════════════════════════
user_email = 'ali_behlouli@nicico.com'
normal_user, created = User.objects.get_or_create(
    email=user_email,
    defaults={
        'username': 'ali_behlouli',
        'first_name': 'علی',
        'last_name': 'بهلولی',
        'role': 'org_user',
        'organization': org,
        'organization_type': 'manufacturing',
        'is_active': True,
        'password': make_password('123456'),
    }
)
if created:
    print(f"✅ org_user ساخته شد: {normal_user.email} (id={normal_user.id})")
else:
    print(f"⚠️ org_user از قبل وجود داشت: {normal_user.email}")

# ══════════════════════════════════════════
# ۴. بررسی نهایی
# ══════════════════════════════════════════
print("\n" + "="*60)
print("📊 خلاصه کاربران ملی مس:")
print("="*60)
for u in User.objects.filter(organization=org).order_by('role'):
    print(f"  - id={u.id} | {u.email} | {u.first_name} {u.last_name} | role={u.role} | active={u.is_active}")

print("\n🎉 تمام شد!")
