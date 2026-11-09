"""
Seed شرکای نمونه برای تست
اجرا: python3 manage.py shell < seed_partners.py
یا: python3 manage.py runscript seed_partners
"""

from intangible_assets.engine_06.models import Partner

PARTNERS_DATA = [
    {
        "name": "شرکت فناوری پویا",
        "name_en": "Pooya Technology Co.",
        "partner_type": "licensee",
        "country": "ایران",
        "industry": "فناوری اطلاعات",
        "financial_capacity_score": 85,
        "track_record_score": 80,
        "strategic_alignment_score": 90,
        "market_access_score": 75,
        "reputation_score": 88,
        "contact_person": "علی رضایی",
        "contact_email": "ali@pooya-tech.ir",
        "contact_phone": "021-88001122",
    },
    {
        "name": "گروه صنعتی آریا",
        "name_en": "Aria Industrial Group",
        "partner_type": "joint_venture",
        "country": "ایران",
        "industry": "صنعت",
        "financial_capacity_score": 95,
        "track_record_score": 92,
        "strategic_alignment_score": 78,
        "market_access_score": 88,
        "reputation_score": 90,
        "contact_person": "محمد کریمی",
        "contact_email": "m.karimi@aria-ind.ir",
        "contact_phone": "021-88776655",
    },
    {
        "name": "شرکت بین‌المللی نوآوران",
        "name_en": "Innovators International Ltd.",
        "partner_type": "exclusive_license",
        "country": "امارات",
        "industry": "نوآوری",
        "financial_capacity_score": 78,
        "track_record_score": 85,
        "strategic_alignment_score": 82,
        "market_access_score": 92,
        "reputation_score": 80,
        "contact_person": "Ahmed Al-Rashid",
        "contact_email": "ahmed@innovators.ae",
        "contact_phone": "+971-4-1234567",
    },
    {
        "name": "شرکت دانش‌بنیان پارس",
        "name_en": "Pars Knowledge-Based Co.",
        "partner_type": "knowledge_services",
        "country": "ایران",
        "industry": "خدمات دانشی",
        "financial_capacity_score": 60,
        "track_record_score": 70,
        "strategic_alignment_score": 85,
        "market_access_score": 65,
        "reputation_score": 72,
    },
    {
        "name": "شرکت خصوصی سابق‌الذکر",  # blacklisted
        "name_en": "Blacklisted Partner",
        "partner_type": "licensee",
        "country": "ایران",
        "industry": "بازرگانی",
        "financial_capacity_score": 50,
        "track_record_score": 30,
        "strategic_alignment_score": 40,
        "market_access_score": 45,
        "reputation_score": 25,
        "has_contract_breach_history": True,  # ← blacklist
    },
    {
        "name": "شرکت تحریم‌شده الف",  # sanctioned
        "name_en": "Sanctioned Partner A",
        "partner_type": "licensee",
        "country": "آمریکا",
        "industry": "فناوری",
        "financial_capacity_score": 90,
        "track_record_score": 88,
        "strategic_alignment_score": 70,
        "market_access_score": 85,
        "reputation_score": 75,
        "is_sanctioned": True,  # ← blacklist
    },
    {
        "name": "شرکت فرنچایز ایران",
        "name_en": "Iran Franchise Co.",
        "partner_type": "franchisee",
        "country": "ایران",
        "industry": "خرده‌فروشی",
        "financial_capacity_score": 70,
        "track_record_score": 65,
        "strategic_alignment_score": 75,
        "market_access_score": 80,
        "reputation_score": 68,
    },
    {
        "name": "هلدینگ سرمایه‌گذاری خلیج",
        "name_en": "Gulf Investment Holding",
        "partner_type": "acquirer",
        "country": "عربستان",
        "industry": "سرمایه‌گذاری",
        "financial_capacity_score": 92,
        "track_record_score": 87,
        "strategic_alignment_score": 72,
        "market_access_score": 88,
        "reputation_score": 83,
    },
]


def seed():
    """اضافه کردن شرکا (idempotent)"""
    created = 0
    skipped = 0
    for data in PARTNERS_DATA:
        existing = Partner.objects.filter(name=data["name"]).first()
        if existing:
            skipped += 1
            continue
        Partner.objects.create(**data)
        created += 1

    print(f"✅ {created} شریک اضافه شد، {skipped} از قبل وجود داشت")
    print(f"📊 مجموع شرکا در DB: {Partner.objects.count()}")
    print(f"🚫 blacklisted: {Partner.objects.filter(has_conflict_of_interest=True).count() + Partner.objects.filter(has_contract_breach_history=True).count() + Partner.objects.filter(is_sanctioned=True).count()}")


if __name__ == "__main__":
    seed()
