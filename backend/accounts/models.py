# backend/accounts/models.py - جایگزینی کامل
from django.contrib.auth.models import AbstractUser
from django.db import models

class Organization(models.Model):
    """مجموعه / شرکت"""
    name = models.CharField(max_length=255, verbose_name='نام مجموعه')
    code = models.CharField(max_length=50, unique=True, verbose_name='کد مجموعه')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'سازمان'
        verbose_name_plural = 'سازمان‌ها'


class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'ادمین کل سیستم'),
        ('org_admin', 'ادمین مجموعه'),
        ('org_user', 'کاربر مجموعه'),
    ]
    
    email = models.EmailField(unique=True, verbose_name='ایمیل')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='org_user', verbose_name='نقش')
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name='سازمان'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"