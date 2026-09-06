# backend/matching/management/commands/create_sample_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.apps import apps
import random
from collections import defaultdict

from needs.models import Need
from products.models import Product, Supply

User = get_user_model()


class Command(BaseCommand):
    help = 'ایجاد داده‌های نمونه واقعی‌نما (نیاز، محصول، عرضه) بدون استفاده از Faker'

    def add_arguments(self, parser):
        parser.add_argument('--needs', type=int, default=50, help='تعداد نیاز')
        parser.add_argument('--products', type=int, default=100, help='تعداد محصول')
        parser.add_argument('--supplies', type=int, default=100, help='تعداد عرضه')

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('🚀 شروع تولید داده‌های نمونه...')

        # ============================================================
        # ۱. دریافت یا ایجاد صنایع
        # ============================================================
        try:
            Industry = apps.get_model('industries', 'IndustryCategory')
        except LookupError:
            self.stdout.write(self.style.ERROR('❌ مدل IndustryCategory یافت نشد. لطفاً اپ industries را بررسی کنید.'))
            return

        industry_names = [
            'نفت و گاز', 'پتروشیمی', 'فولاد', 'سیمان', 'خودرو',
            'الکترونیک', 'داروسازی', 'کشاورزی', 'فناوری اطلاعات',
            'ساخت و تولید', 'برق و انرژی', 'حمل و نقل و لجستیک'
        ]
        industries = {}
        for name in industry_names:
            industry, created = Industry.objects.get_or_create(name=name)
            industries[name] = industry
            if created:
                self.stdout.write(f'✅ صنعت "{name}" ایجاد شد')

        # ============================================================
        # ۲. دریافت یا ایجاد کاربران
        # ============================================================
        target_users = ['azadeh', 'azadeh123', 'ghotbi', 'default_seller']
        users = {}
        for username in target_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'is_active': True}
            )
            if created:
                user.set_password('123456')
                user.save()
                self.stdout.write(f'✅ کاربر "{username}" با رمز 123456 ایجاد شد')
            else:
                self.stdout.write(f'ℹ️ کاربر "{username}" از قبل وجود دارد')
            users[username] = user

        default_user = users['default_seller']
        user_list = list(users.values())

        # ============================================================
        # ۳. تمپلیت‌های داده
        # ============================================================
        need_templates = {
            'نفت و گاز': [
                {'title': 'بهینه‌سازی مصرف انرژی در پالایشگاه', 'desc': 'نیاز به راهکار هوشمند برای کاهش مصرف سوخت و افزایش راندمان کوره‌های پالایشگاهی.'},
                {'title': 'سیستم پایش نشت گاز در خطوط انتقال', 'desc': 'پیاده‌سازی سامانه پایش آنلاین برای تشخیص سریع نشت گاز در خطوط لوله.'},
                {'title': 'مدیریت هوشمند مخازن ذخیره نفت خام', 'desc': 'سیستم مدیریت موجودی و پیش‌بینی سطح مخازن نفت خام با IoT و ML.'},
            ],
            'پتروشیمی': [
                {'title': 'بهینه‌سازی فرآیند پلیمریزاسیون', 'desc': 'بهبود کیفیت و افزایش بازده در واحد پلیمریزاسیون با کنترل تطبیقی.'},
                {'title': 'سیستم نگهداری پیش‌بینانه کمپرسورها', 'desc': 'پایش وضعیت و تشخیص خطا برای کمپرسورهای گازی با آنالیز ارتعاشات.'},
                {'title': 'کاهش آلایندگی در واحد الفین', 'desc': 'راهکارهای نوین برای کاهش انتشار گازهای گلخانه‌ای و بهبود کارایی مشعل‌ها.'},
            ],
            'فولاد': [
                {'title': 'بهبود کیفیت در خط نورد گرم', 'desc': 'سیستم کنترل ضخامت و کیفیت سطح با بینایی ماشین و کنترل پیشرفته.'},
                {'title': 'مدیریت انرژی کوره‌های قوس الکتریکی', 'desc': 'بهینه‌سازی مصرف برق در کوره‌های قوس الکتریکی با مدل‌های پیش‌بینی.'},
            ],
            'ساخت و تولید': [
                {'title': 'اتوماسیون خط تولید با ربات‌های همکار', 'desc': 'استقرار ربات‌های همکار در خط مونتاژ برای افزایش بهره‌وری.'},
                {'title': 'سیستم مدیریت کیفیت مبتنی بر داده', 'desc': 'سامانه کنترل کیفیت آماری و تشخیص عیوب با یادگیری ماشین.'},
                {'title': 'تأمین دستگاه پیشرفته تصفیه آب برای خط تولید', 'desc': 'دستگاه تصفیه آب صنعتی با قابلیت پایش آنلاین و خودکار.'},
            ],
            'فناوری اطلاعات': [
                {'title': 'سیستم مدیریت یکپارچه منابع سازمانی (ERP)', 'desc': 'نرم‌افزار ERP برای یکپارچه‌سازی فرآیندهای مالی، فروش، تولید و منابع انسانی.'},
                {'title': 'پلتفرم اینترنت اشیا برای صنعت', 'desc': 'پلتفرم IoT برای اتصال و مدیریت سنسورهای صنعتی با تحلیل داده و داشبورد.'},
                {'title': 'سامانه ارزیابی ناوگان با بلاکچین', 'desc': 'سامانه شفاف و امن برای ارزیابی عملکرد ناوگان حمل و نقل با بلاکچین.'},
            ],
            'برق و انرژی': [
                {'title': 'مدیریت هوشمند شبکه توزیع برق', 'desc': 'سیستم مدیریت شبکه توزیع با تشخیص و ایزوله‌سازی خطا و بهینه‌سازی مصرف.'},
                {'title': 'سیستم ذخیره‌سازی انرژی خورشیدی', 'desc': 'طراحی سیستم ذخیره‌سازی انرژی با باتری‌های لیتیوم-یونی برای نیروگاه‌های خورشیدی.'},
            ],
            'حمل و نقل و لجستیک': [
                {'title': 'سیستم مدیریت ناوگان هوشمند', 'desc': 'سامانه ردیابی و مدیریت ناوگان با GPS و IoT برای بهینه‌سازی مسیر و کاهش مصرف سوخت.'},
                {'title': 'اتوماسیون انبار با استفاده از AGV', 'desc': 'استقرار خودروهای هدایت‌شونده خودکار برای جابجایی و چیدمان هوشمند کالاها.'},
            ],
            'خودرو': [
                {'title': 'سیستم کمک‌راننده پیشرفته (ADAS)', 'desc': 'توسعه سیستم‌های کمک‌راننده با سنسورها، دوربین‌ها و هوش مصنوعی.'},
                {'title': 'بهینه‌سازی مصرف سوخت موتورهای دیزلی', 'desc': 'سیستم کنترل پیشرفته برای کاهش مصرف سوخت و آلایندگی موتورهای دیزلی.'},
            ],
            'الکترونیک': [
                {'title': 'تولید بردهای الکترونیکی با فناوری SMT', 'desc': 'خط تولید بردهای الکترونیکی با فناوری سطح‌نصب (SMT) برای تولید انبوه.'},
            ],
            'داروسازی': [
                {'title': 'سیستم کنترل کیفیت داروهای استریل', 'desc': 'سامانه پایش و کنترل کیفیت در خط تولید داروهای استریل با سنسورهای پیشرفته.'},
            ],
            'کشاورزی': [
                {'title': 'سیستم آبیاری هوشمند گلخانه‌ها', 'desc': 'سیستم آبیاری خودکار بر اساس رطوبت خاک و پیش‌بینی آب و هوا.'},
            ],
        }

        supply_templates = {
            'نفت و گاز': [
                {'title': 'سامانه پایش انرژی پالایشگاه', 'desc': 'سامانه هوشمند پایش و بهینه‌سازی مصرف انرژی در واحدهای تقطیر و کوره‌ها.', 'price': 750000000, 'trl': 7, 'tech': 'IoT و ML'},
                {'title': 'سیستم تشخیص نشت گاز با فیبر نوری', 'desc': 'سیستم پایش توزیع‌شده با فیبر نوری برای تشخیص نشت گاز با دقت بالا.', 'price': 450000000, 'trl': 8, 'tech': 'فیبر نوری'},
            ],
            'پتروشیمی': [
                {'title': 'سیستم کنترل پیشرفته پلیمریزاسیون', 'desc': 'سیستم کنترل مبتنی بر مدل برای واحد پلیمریزاسیون با تنظیم خودکار پارامترها.', 'price': 800000000, 'trl': 8, 'tech': 'کنترل پیشرفته'},
                {'title': 'راهکار نگهداری پیش‌بینانه تجهیزات دوار', 'desc': 'سیستم پایش وضعیت و تشخیص خطا برای کمپرسورها و توربین‌ها.', 'price': 550000000, 'trl': 7, 'tech': 'آنالیز ارتعاشات'},
            ],
            'فولاد': [
                {'title': 'سیستم کنترل ضخامت نورد گرم', 'desc': 'سیستم کنترل ضخامت با بینایی ماشین و الگوریتم‌های پیش‌بینی.', 'price': 500000000, 'trl': 7, 'tech': 'بینایی ماشین'},
            ],
            'ساخت و تولید': [
                {'title': 'دستگاه تصفیه آب صنعتی هوشمند', 'desc': 'دستگاه تصفیه آب با فناوری اسمز معکوس و غشایی، مجهز به پایش آنلاین.', 'price': 300000000, 'trl': 8, 'tech': 'تصفیه آب'},
                {'title': 'ربات‌های همکار برای خط مونتاژ', 'desc': 'ربات‌های صنعتی با قابلیت همکاری ایمن با انسان.', 'price': 600000000, 'trl': 7, 'tech': 'رباتیک'},
            ],
            'فناوری اطلاعات': [
                {'title': 'پلتفرم ERP یکپارچه', 'desc': 'نرم‌افزار مدیریت یکپارچه منابع سازمانی با قابلیت شخصی‌سازی.', 'price': 250000000, 'trl': 9, 'tech': 'نرم‌افزار'},
                {'title': 'پلتفرم اینترنت اشیا صنعتی', 'desc': 'پلتفرم IoT برای اتصال سنسورها، جمع‌آوری داده و تحلیل با AI.', 'price': 350000000, 'trl': 8, 'tech': 'IoT و تحلیل داده'},
                {'title': 'سامانه بلاکچین برای تامین‌کنندگان', 'desc': 'سامانه مدیریت زنجیره تامین مبتنی بر بلاکچین برای شفافیت و امنیت.', 'price': 280000000, 'trl': 7, 'tech': 'بلاکچین'},
            ],
            'برق و انرژی': [
                {'title': 'سیستم مدیریت انرژی شبکه توزیع', 'desc': 'سیستم مدیریت انرژی با پیش‌بینی مصرف، تشخیص خطا و بهینه‌سازی توزیع.', 'price': 500000000, 'trl': 8, 'tech': 'مدیریت انرژی'},
            ],
            'حمل و نقل و لجستیک': [
                {'title': 'سامانه مدیریت ناوگان با GPS و IoT', 'desc': 'سامانه مدیریت ناوگان با ردیابی GPS، بهینه‌سازی مسیر و کاهش مصرف سوخت.', 'price': 200000000, 'trl': 8, 'tech': 'GPS و تحلیل داده'},
                {'title': 'خودروهای هدایت‌شونده خودکار (AGV)', 'desc': 'خودروهای AGV با ناوبری خودکار برای جابجایی مواد در انبارها.', 'price': 400000000, 'trl': 7, 'tech': 'رباتیک'},
            ],
            'خودرو': [
                {'title': 'سیستم ADAS مبتنی بر دوربین', 'desc': 'سیستم کمک‌راننده با دوربین‌های هوشمند برای تشخیص علائم و خطوط جاده.', 'price': 250000000, 'trl': 8, 'tech': 'بینایی کامپیوتر'},
            ],
            'الکترونیک': [
                {'title': 'خط تولید SMT با دقت بالا', 'desc': 'خط تولید بردهای الکترونیکی با فناوری SMT و سیستم بازرسی خودکار.', 'price': 700000000, 'trl': 8, 'tech': 'الکترونیک'},
            ],
            'داروسازی': [
                {'title': 'سیستم پایش کیفیت داروهای استریل', 'desc': 'سیستم پایش آنلاین کیفیت داروهای استریل با سنسورهای پیشرفته.', 'price': 350000000, 'trl': 7, 'tech': 'سنسورها'},
            ],
            'کشاورزی': [
                {'title': 'سیستم آبیاری هوشمند گلخانه‌ای', 'desc': 'سیستم آبیاری خودکار با سنسورهای رطوبت خاک و پیش‌بینی آب و هوا.', 'price': 150000000, 'trl': 8, 'tech': 'سنسورها و اتوماسیون'},
            ],
        }

        # ============================================================
        # ۴. تولید نیازها با شماره‌گذاری یکتا
        # ============================================================
        num_needs = options['needs']
        need_objects = []
        # شمارنده‌های سراسری برای هر صنعت و کاربر (برای یکتایی)
        need_counter = defaultdict(int)  # کلید: (user_id, industry_id, template_title)

        self.stdout.write(f'📝 ایجاد {num_needs} نیاز...')

        for user in user_list:
            for industry_name, templates in need_templates.items():
                industry = industries[industry_name]
                for template in templates:
                    # شمارنده را برای این ترکیب افزایش بده
                    key = (user.id, industry.id, template['title'])
                    need_counter[key] += 1
                    seq = need_counter[key]
                    # اگر نیاز به تعداد بیشتر داریم، از همان تمپلیت با شماره‌های مختلف استفاده می‌کنیم
                    # اما برای اینکه تعداد کل نیازها به num_needs برسد، حلقه را تا زمانی که به تعداد مورد نظر برسیم ادامه می‌دهیم
                    # در اینجا از یک حلقه while استفاده می‌کنیم تا دقیقاً num_needs رکورد تولید شود

        # روش بهتر: تولید تصادفی تا رسیدن به تعداد مورد نظر
        need_objects = []
        generated_need_titles = set()
        attempts = 0
        max_attempts = num_needs * 10
        while len(need_objects) < num_needs and attempts < max_attempts:
            attempts += 1
            user = random.choice(user_list)
            industry_name = random.choice(list(need_templates.keys()))
            industry = industries[industry_name]
            template = random.choice(need_templates[industry_name])
            # عنوان یکتا: ترکیب title + شماره تصادفی
            suffix = random.randint(1, 10000)
            title = f"{template['title']} - {suffix}"
            if title in generated_need_titles:
                continue
            generated_need_titles.add(title)

            description = template['desc'] + " " + "نیاز به راهکار جامع و قابل پیاده‌سازی در بازه زمانی مشخص."
            budget = random.randint(10000000, 1000000000) if random.random() > 0.3 else None
            timeline = random.choice(['کمتر از ۳ ماه', '۳ تا ۶ ماه', '۶ تا ۱۲ ماه', 'بیش از ۱۲ ماه', 'فوری'])
            status = random.choice(['draft', 'published', 'evaluating'])

            need = Need(
                buyer=user,
                title=title[:200],
                description=description[:500],
                industry=industry,
                budget=budget,
                timeline=timeline,
                status=status,
            )
            need_objects.append(need)

        Need.objects.bulk_create(need_objects)
        self.stdout.write(f'✅ {len(need_objects)} نیاز ایجاد شد')

        # ============================================================
        # ۵. تولید محصولات با شماره‌گذاری یکتا
        # ============================================================
        num_products = options['products']
        product_objects = []
        generated_product_titles = set()
        attempts = 0
        max_attempts = num_products * 10
        self.stdout.write(f'📦 ایجاد {num_products} محصول...')

        while len(product_objects) < num_products and attempts < max_attempts:
            attempts += 1
            industry_name = random.choice(list(supply_templates.keys()))
            industry = industries[industry_name]
            template = random.choice(supply_templates[industry_name])
            seller = random.choice(user_list)
            suffix = random.randint(1, 10000)
            title = f"{template['title']} - نسخه {suffix}"
            if title in generated_product_titles:
                continue
            generated_product_titles.add(title)

            short_desc = template['desc'] + " مناسب برای صنایع مختلف."
            full_desc = short_desc + " دارای گواهی‌های استاندارد و قابلیت سفارشی‌سازی."

            product = Product(
                seller=seller,
                title=title[:200],
                category=random.choice(['product', 'service']),
                industry=industry,
                short_description=short_desc[:300],
                full_description=full_desc[:500],
                problem_solved="حل مسئله کاهش هزینه‌ها و افزایش بهره‌وری",
                competitive_advantage="فناوری نوین و تیم متخصص",
                technical_specs="مشخصات فنی بر اساس استانداردهای روز",
                trl=random.randint(4, 9),
                price=template['price'] + random.randint(-50000000, 50000000),
                ip_status="ثبت شده" if random.random() > 0.5 else "در حال ثبت",
                capacity=f"{random.randint(10, 500)} واحد در روز",
                status=random.choice(['draft', 'approved', 'published']),
            )
            product_objects.append(product)

        Product.objects.bulk_create(product_objects)
        self.stdout.write(f'✅ {len(product_objects)} محصول ایجاد شد')

        # ============================================================
        # ۶. تولید عرضه‌ها با شماره‌گذاری یکتا
        # ============================================================
        num_supplies = options['supplies']
        supply_objects = []
        generated_supply_titles = set()
        attempts = 0
        max_attempts = num_supplies * 10
        self.stdout.write(f'📦 ایجاد {num_supplies} عرضه...')

        while len(supply_objects) < num_supplies and attempts < max_attempts:
            attempts += 1
            industry_name = random.choice(list(supply_templates.keys()))
            industry = industries[industry_name]
            template = random.choice(supply_templates[industry_name])
            seller = random.choice(user_list)
            suffix = random.randint(1, 10000)
            title = f"{template['title']} - {suffix}"
            if title in generated_supply_titles:
                continue
            generated_supply_titles.add(title)

            description = template['desc'] + " با قابلیت ارائه در سراسر کشور."

            supply = Supply(
                seller=seller,
                title=title[:200],
                supply_type=random.choice(['product', 'service']),
                category=industry_name,
                industry=industry_name,
                technology=template['tech'],
                city=random.choice(['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز']),
                description=description[:500],
                quantity=str(random.randint(1, 1000)),
                unit=random.choice(['عدد', 'کیلوگرم', 'تن', 'متر', 'لیتر']),
                price=template['price'] + random.randint(-50000000, 50000000),
                trl=str(random.randint(4, 9)),
                trl_assessed=random.choice([True, False]),
                mrl=str(random.randint(3, 8)),
                mrl_assessed=random.choice([True, False]),
                status=random.choice(['pending', 'approved', 'published']),
            )
            supply_objects.append(supply)

        Supply.objects.bulk_create(supply_objects)
        self.stdout.write(f'✅ {len(supply_objects)} عرضه ایجاد شد')

        # ============================================================
        # ۷. گزارش نهایی
        # ============================================================
        self.stdout.write('\n' + '='*60)
        self.stdout.write('🎉 تولید داده‌های نمونه با موفقیت انجام شد!')
        self.stdout.write(f'📌 تعداد نیازها: {Need.objects.count()}')
        self.stdout.write(f'📌 تعداد محصولات: {Product.objects.count()}')
        self.stdout.write(f'📌 تعداد عرضه‌ها: {Supply.objects.count()}')
        self.stdout.write('='*60)

        self.stdout.write('\n👤 نیازهای هر کاربر:')
        for user in user_list:
            needs = Need.objects.filter(buyer=user)
            self.stdout.write(f'  - {user.username}: {needs.count()} نیاز')

        self.stdout.write('\n📦 محصولات و عرضه‌های هر کاربر:')
        for user in user_list:
            products = Product.objects.filter(seller=user)
            supplies = Supply.objects.filter(seller=user)
            self.stdout.write(f'  - {user.username}: {products.count()} محصول، {supplies.count()} عرضه')