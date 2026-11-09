import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت دارایی | سازمان پژوهش و فناوری",
  description: "سیستم ثبت و ارزیابی دارایی‌های نامشهود",
  icons: {
    icon: "/favicon.ico", // اگر آیکون خاصی داری، مسیرش رو بده. فعلاً آیکون پیش‌فرض رو می‌ذاریم.
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" dir="rtl" style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}>
      {children}
    </div>
  );
}
