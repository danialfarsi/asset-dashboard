
from .models import ScreeningTemplate
import re
from difflib import SequenceMatcher

class DiscoveryAnalyzer:
    """تحلیل‌گر موتور شناسایی برای پیشنهاد هوشمند قالب دارایی"""
    
    QUESTION_DESC = {
        'N1': 'محصول فکری است (نتیجه تفکر و خلاقیت)',
        'N2': 'هویت غیرفیزیکی دارد (قابل لمس نیست)',
        'N3': 'قابل مشاهده نیست (غیرملموس است)',
        'N4': 'قابل لمس نیست (فیزیکی نیست)',
        'N5': 'اندازه فیزیکی ندارد',
        'N6': 'وزن فیزیکی ندارد',
        'I1': 'نام مشخص دارد (شناخته شده است)',
        'I2': 'کد شناسایی دارد (ثبت شده است)',
        'I3': 'در اسناد ثبت شده (مستند است)',
        'I4': 'قابل تمایز است (از دیگران جدا است)',
        'I5': 'قابل ردیابی است (تاریخچه دارد)',
        'I6': 'در سیستم ثبت است (سیستماتیک است)',
        'I7': 'تاریخ ثبت دارد (قدمت دارد)',
        'C1': 'قابل کنترل است (مدیریت‌پذیر است)',
        'C2': 'مالکیت مشخص دارد (صاحب دارد)',
        'C3': 'قرارداد دارد (قانونی است)',
        'C4': 'ثبت قانونی دارد (رسمی است)',
        'C5': 'حمایت قانونی دارد (محافظت شده است)',
        'C6': 'منافع اقتصادی دارد (سودآور است)',
        'C7': 'قابل انتقال است (قابل فروش است)',
        'V1': 'ارزش اقتصادی دارد (قیمت دارد)',
        'V2': 'درآمدزا است (پول می‌سازد)',
        'V3': 'هزینه‌زا است (هزینه دارد)',
        'V4': 'مزیت رقابتی دارد (از رقبا جلوتر است)',
        'V5': 'ارتقاءدهنده است (بهتر می‌کند)',
        'V6': 'توسعه‌دهنده است (رشد می‌دهد)',
        'V7': 'نوآورانه است (جدید است)',
        'V8': 'کاربردی است (مفید است)',
        'V9': 'مفید است (به کار می‌آید)'
    }
    
    # کلمات کلیدی برای هر نوع دارایی
    KEYWORDS = {
        'برند': ['برند', 'علامت', 'تجاری', 'نام', 'شناخته', 'لوگو'],
        'پتنت': ['پتنت', 'اختراع', 'ثبت', 'حق', 'امتیاز', 'اکسclusive'],
        'نرم‌افزار': ['نرم‌افزار', 'سیستم', 'سامانه', 'پلتفرم', 'برنامه', 'اپلیکیشن'],
        'قرارداد': ['قرارداد', 'توافق', 'تفاهم', 'مذاکره', 'همکاری', 'شراکت'],
        'دانش': ['دانش', 'فنی', 'تکنیک', 'متد', 'روش', 'تجربه', 'مهارت'],
        'فرآیند': ['فرآیند', 'رویه', 'استاندارد', 'دستورالعمل', 'SOP', 'بهینه'],
        'داده': ['داده', 'پایگاه', 'اطلاعات', 'مشتری', 'تحلیل', 'گزارش'],
        'مالی': ['مالی', 'حسابداری', 'بودجه', 'هزینه', 'درآمد'],
        'آموزش': ['آموزش', 'یادگیری', 'LMS', 'دوره', 'کارگاه'],
        'فرهنگ': ['فرهنگ', 'ارزش', 'اخلاق', 'رفتار', 'سازمانی', 'هویت'],
        'استراتژی': ['استراتژی', 'برنامه', 'چشم‌انداز', 'هدف', 'راهبرد'],
        'شبکه': ['شبکه', 'ارتباط', 'همکاری', 'شراکت', 'JV', 'MoU'],
        'پایداری': ['پایداری', 'ESG', 'زیست', 'محیط', 'کربن', 'انرژی'],
    }
    
    def __init__(self, answers, asset_name=None, organization_type=None):
        self.answers = answers
        self.asset_name = asset_name
        self.organization_type = organization_type
    
    def analyze(self):
        best_template = self.find_best_template()
        if not best_template:
            return None
        
        errors = self.find_errors(best_template)
        alternative = self.find_alternative(best_template, errors)
        
        return {
            'best_template': best_template,
            'errors': errors,
            'alternative': alternative,
            'summary': self.generate_summary(best_template, errors, alternative)
        }
    
    def find_best_template(self):
        templates = ScreeningTemplate.objects.exclude(
            discovery_scores__isnull=True
        ).exclude(
            discovery_scores__exact={}
        )
        
        if self.organization_type:
            templates = templates.filter(
                organization_type__name=self.organization_type
            )
        
        best_score = 0
        best_template = None
        
        for template in templates:
            # امتیاز تطابق پاسخ‌ها (۶۰٪ وزن)
            score_match = self.calculate_match_score(template)
            
            # امتیاز تطابق اسم (۴۰٪ وزن)
            name_score = self.calculate_name_score(template)
            
            # امتیاز نهایی
            final_score = (score_match * 0.6) + (name_score * 0.4)
            
            if final_score > best_score:
                best_score = final_score
                best_template = template
        
        return best_template
    
    def calculate_match_score(self, template):
        """محاسبه امتیاز تطابق پاسخ‌ها با قالب"""
        scores = template.discovery_scores
        if not scores:
            return 0
        
        total_match = 0
        total_items = 0
        
        categories = ['non_physicality', 'identifiability', 'controllability', 'value_creation']
        
        for category in categories:
            if category not in scores:
                continue
            
            category_data = scores[category]
            for key, expected_value in category_data.items():
                if key in ['score', 'max']:
                    continue
                
                user_value = 1 if self.answers.get(key, False) else 0
                if user_value == expected_value:
                    total_match += 1
                total_items += 1
        
        return total_match / total_items if total_items > 0 else 0
    
    def calculate_name_score(self, template):
        """محاسبه امتیاز تطابق اسم دارایی با قالب"""
        if not self.asset_name:
            return 0
        
        template_name = template.item_name
        
        # ۱. شباهت متنی (SequenceMatcher)
        similarity = SequenceMatcher(
            None, 
            self.asset_name.lower(), 
            template_name.lower()
        ).ratio()
        
        # ۲. کلمات کلیدی مشترک
        keyword_score = self.check_keywords(self.asset_name, template_name)
        
        # ۳. کلمات کلیدی اختصاصی برای هر قالب
        special_score = self.check_special_keywords(self.asset_name, template_name)
        
        # ترکیب امتیازات
        final_name_score = (similarity * 0.4) + (keyword_score * 0.4) + (special_score * 0.2)
        
        return min(final_name_score, 1.0)  # حداکثر ۱
    
    def check_keywords(self, input_name, template_name):
        """بررسی کلمات کلیدی مشترک"""
        input_words = set(re.sub(r'[^\w\s]', '', input_name).split())
        template_words = set(re.sub(r'[^\w\s]', '', template_name).split())
        
        if not input_words:
            return 0
        
        common = input_words.intersection(template_words)
        return len(common) / len(input_words)
    
    def check_special_keywords(self, input_name, template_name):
        """بررسی کلمات کلیدی اختصاصی برای هر قالب"""
        input_lower = input_name.lower()
        
        # پیدا کردن کلمات کلیدی مرتبط با این قالب
        for category, keywords in self.KEYWORDS.items():
            if category in template_name or any(k in template_name.lower() for k in keywords):
                # بررسی اینکه آیا این کلمات در اسم کاربر هست
                for keyword in keywords:
                    if keyword in input_lower:
                        return 1.0
                break
        
        return 0
    
    def find_errors(self, template):
        """پیدا کردن سوالاتی که با قالب برتر همخوانی ندارند"""
        scores = template.discovery_scores
        if not scores:
            return []
        
        errors = []
        categories = ['non_physicality', 'identifiability', 'controllability', 'value_creation']
        
        for category in categories:
            if category not in scores:
                continue
            
            category_data = scores[category]
            category_errors = []
            
            for key, expected_value in category_data.items():
                if key in ['score', 'max']:
                    continue
                
                user_value = 1 if self.answers.get(key, False) else 0
                if user_value != expected_value:
                    category_errors.append({
                        'key': key,
                        'expected': expected_value,
                        'user_value': user_value,
                        'description': self.QUESTION_DESC.get(key, key),
                        'is_critical': self.is_critical_question(key)
                    })
            
            if category_errors:
                errors.append({
                    'category': category,
                    'title': self.get_category_title(category),
                    'errors': category_errors
                })
        
        return errors
    
    def is_critical_question(self, key):
        critical = {
            'non_physicality': ['N1', 'N3', 'N4', 'N5'],
            'identifiability': ['I1', 'I5', 'I6', 'I7'],
            'controllability': ['C2', 'C5', 'C6'],
            'value_creation': ['V1', 'V4', 'V6', 'V8']
        }
        
        for category, keys in critical.items():
            if key in keys:
                return True
        return False
    
    def get_category_title(self, category):
        titles = {
            'non_physicality': 'غیرفیزیکی بودن',
            'identifiability': 'شناسایی‌پذیری',
            'controllability': 'کنترل منافع',
            'value_creation': 'ارزش‌آفرینی'
        }
        return titles.get(category, category)
    
    def find_alternative(self, best_template, errors):
        if not errors:
            return None
        
        critical_errors = []
        for error_group in errors:
            for error in error_group['errors']:
                if error['is_critical']:
                    critical_errors.append(error['key'])
        
        if not critical_errors:
            return None
        
        templates = ScreeningTemplate.objects.exclude(
            id=best_template.id
        ).exclude(
            discovery_scores__isnull=True
        ).exclude(
            discovery_scores__exact={}
        )
        
        if self.organization_type:
            templates = templates.filter(
                organization_type__name=self.organization_type
            )
        
        best_alternative = None
        best_score = 0
        
        for template in templates:
            score_match = self.calculate_match_score(template)
            name_score = self.calculate_name_score(template)
            final_score = (score_match * 0.6) + (name_score * 0.4)
            
            if final_score > best_score:
                best_score = final_score
                best_alternative = template
        
        return best_alternative
    
    def generate_summary(self, best_template, errors, alternative):
        if not errors:
            return {
                'type': 'perfect',
                'message': f'✅ عالی! دارایی شما کاملاً با قالب "{best_template.item_name}" مطابقت دارد.',
                'suggestions': [],
                'alternative_message': None
            }
        
        critical_errors = []
        normal_errors = []
        
        for error_group in errors:
            for error in error_group['errors']:
                if error['is_critical']:
                    critical_errors.append(error)
                else:
                    normal_errors.append(error)
        
        if critical_errors:
            message = f'شما به "{best_template.item_name}" نزدیک‌اید ولی در بخش‌های زیر ضعیف‌اید:'
            suggestions = [f"{e['key']} - {e['description']}" for e in critical_errors]
            
            if alternative:
                alt_message = f'یا اگر این موارد رو ندارید، "{alternative.item_name}" مناسب‌تر است.'
            else:
                alt_message = None
            
            return {
                'type': 'fixable',
                'message': message,
                'suggestions': suggestions,
                'alternative_message': alt_message
            }
        else:
            return {
                'type': 'good',
                'message': f'دارایی شما تا حد زیادی با "{best_template.item_name}" مطابقت دارد، اما چند نکته جزئی وجود دارد:',
                'suggestions': [f"{e['key']} - {e['description']}" for e in normal_errors],
                'alternative_message': None
            }
