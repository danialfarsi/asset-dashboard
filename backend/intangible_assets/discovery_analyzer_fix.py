# ============================================
# بخش generate_summary - جایگزین متد موجود
# ============================================

def generate_summary(self, best_template, errors, alternative):
    """تولید خلاصه مناسب برای نمایش به کاربر"""
    if not errors:
        return {
            'type': 'perfect',
            'message': f'✅ عالی! دارایی شما کاملاً با قالب "{best_template.item_name}" مطابقت دارد.',
            'suggestions': [],
            'alternative_message': None,
            'detailed_suggestions': []
        }
    
    critical_errors = []
    normal_errors = []
    
    for error_group in errors:
        category_title = error_group.get('title', '')
        for error in error_group['errors']:
            error_item = {
                'key': error['key'].upper(),
                'description': self.QUESTION_DESC.get(error['key'], error['key']),
                'category': category_title,
                'expected': error['expected'],
                'user_value': error['user_value'],
                'is_critical': error.get('is_critical', False)
            }
            if error.get('is_critical', False):
                critical_errors.append(error_item)
            else:
                normal_errors.append(error_item)
    
    if critical_errors:
        # تولید پیام‌های پیشنهادی خوانا
        suggestions = []
        for err in critical_errors[:5]:  # حداکثر ۵ مورد
            suggestions.append(f"{err['key']} - {err['description']}")
        
        # تولید پیام‌های جزئی‌تر
        detailed = []
        for err in critical_errors:
            detailed.append({
                'key': err['key'],
                'description': err['description'],
                'category': err['category'],
                'expected': 'بله' if err['expected'] == 1 else 'خیر',
                'current': 'بله' if err['user_value'] == 1 else 'خیر'
            })
        
        # پیام اصلی
        if len(critical_errors) <= 3:
            message = f'دارایی شما به "{best_template.item_name}" نزدیک است، اما این موارد را باید اصلاح کنید:'
        else:
            message = f'برای تطابق بهتر با "{best_template.item_name}"، این موارد را بررسی کنید:'
        
        if alternative:
            alt_message = f'💡 پیشنهاد: اگر این موارد را ندارید، "{alternative.item_name}" می‌تواند گزینه مناسبی باشد.'
        else:
            alt_message = None
        
        return {
            'type': 'fixable',
            'message': message,
            'suggestions': suggestions,
            'alternative_message': alt_message,
            'detailed_suggestions': detailed,
            'critical_count': len(critical_errors),
            'normal_count': len(normal_errors)
        }
    else:
        # فقط خطاهای غیرضروری
        suggestions = []
        for err in normal_errors[:3]:
            suggestions.append(f"{err['key']} - {err['description']}")
        
        return {
            'type': 'good',
            'message': f'✅ دارایی شما با "{best_template.item_name}" تطابق خوبی دارد.',
            'suggestions': suggestions,
            'alternative_message': None,
            'detailed_suggestions': [],
            'critical_count': 0,
            'normal_count': len(normal_errors)
        }
