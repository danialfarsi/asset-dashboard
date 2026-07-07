from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import ScreenedAsset, AssetFile
from .notification_models import Notification
from .valuation_models import AssetValuation

User = get_user_model()

# ============================================
# 📌 ۱. دارایی جدید غربالگری شد
# ============================================
@receiver(post_save, sender=ScreenedAsset)
def create_asset_notification(sender, instance, created, **kwargs):
    if created:
        # به کاربر ایجاد کننده
        if instance.created_by:
            Notification.objects.create(
                title='✅ دارایی جدید غربالگری شد',
                message=f'دارایی "{instance.asset_name}" با موفقیت ثبت شد',
                type='success',
                category='screening',
                link=f'/dashboard/intangible/assets/{instance.id}',
                link_text='مشاهده دارایی',
                user=instance.created_by
            )
        
        # به ادمین‌های سازمان
        if instance.created_by and instance.created_by.organization:
            admins = User.objects.filter(
                organization=instance.created_by.organization,
                role='org_admin'
            )
            for admin in admins:
                if admin != instance.created_by:
                    Notification.objects.create(
                        title='📢 دارایی جدید در سازمان شما',
                        message=f'دارایی "{instance.asset_name}" توسط {instance.created_by.email} ثبت شد',
                        type='info',
                        category='screening',
                        link=f'/dashboard/intangible/assets/{instance.id}',
                        link_text='مشاهده دارایی',
                        user=admin
                    )


# ============================================
# 📌 ۲. ارزیابی تکمیل شد
# ============================================
@receiver(post_save, sender=AssetValuation)
def create_valuation_notification(sender, instance, created, **kwargs):
    if not created and instance.status == 'completed':
        # به کاربر ارزیابی کننده
        if instance.evaluated_by:
            score = instance.final_score
            status = 'عالی' if score >= 4 else 'خوب' if score >= 3 else 'متوسط'
            Notification.objects.create(
                title='🎯 ارزیابی تکمیل شد',
                message=f'ارزیابی "{instance.asset.asset_name}" با امتیاز {score:.2f} به پایان رسید (وضعیت: {status})',
                type='success',
                category='valuation',
                link=f'/dashboard/intangible/valuation/{instance.id}',
                link_text='مشاهده ارزیابی',
                user=instance.evaluated_by
            )
        
        # به ادمین سازمان
        if instance.asset.created_by and instance.asset.created_by.organization:
            admins = User.objects.filter(
                organization=instance.asset.created_by.organization,
                role='org_admin'
            )
            for admin in admins:
                if admin != instance.evaluated_by:
                    Notification.objects.create(
                        title='📊 ارزیابی جدید در سازمان شما',
                        message=f'دارایی "{instance.asset.asset_name}" با امتیاز {instance.final_score:.2f} ارزیابی شد',
                        type='info',
                        category='valuation',
                        link=f'/dashboard/intangible/valuation/{instance.id}',
                        link_text='مشاهده ارزیابی',
                        user=admin
                    )


# ============================================
# 📌 ۳. فایل جدید آپلود شد
# ============================================
@receiver(post_save, sender=AssetFile)
def create_file_notification(sender, instance, created, **kwargs):
    if created:
        # به مالک دارایی
        if instance.asset.created_by and instance.asset.created_by != instance.uploaded_by:
            Notification.objects.create(
                title='📎 فایل جدید آپلود شد',
                message=f'فایل "{instance.title}" برای دارایی "{instance.asset.asset_name}" آپلود شد',
                type='info',
                category='asset',
                link=f'/dashboard/intangible/assets/{instance.asset.id}',
                link_text='مشاهده دارایی',
                user=instance.asset.created_by
            )


# ============================================
# 📌 ۴. دارایی حذف شد (اخطار)
# ============================================
@receiver(post_delete, sender=ScreenedAsset)
def create_delete_notification(sender, instance, **kwargs):
    if instance.created_by:
        Notification.objects.create(
            title='⚠️ دارایی حذف شد',
            message=f'دارایی "{instance.asset_name}" از سیستم حذف شد',
            type='warning',
            category='asset',
            link=None,
            link_text=None,
            user=instance.created_by
        )
