from django.contrib.auth.models import AbstractUser
from django.db import models

class Organization(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.organization.name} - {self.name}'


class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'ادمین کل سیستم'),
        ('org_admin', 'ادمین مجموعه'),
        ('org_user', 'کاربر مجموعه'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='org_user')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    
    # اضافه کردن organization_type به کاربر
    organization_type = models.CharField(max_length=50, null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
