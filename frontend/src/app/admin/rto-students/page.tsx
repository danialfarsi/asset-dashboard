"use client";

import { useState, useEffect } from "react";
import {
  Users, Search, FileText, Download, ExternalLink, Loader2,
  ChevronDown, ChevronUp, Mail, Phone, Hash, Award,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const toFa = (num: any): string => {
  if (num === null || num === undefined) return "—";
  return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

interface Answer {
  id: number;
  question_text: string;
  dimension: string;
  score: number;
  evidence: string;
  has_file: boolean;
  file_url: string | null;
  file_name: string | null;
}

interface Student {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_type: string | null;
  student_name: string;
  student_family: string;
  student_full_name: string;
  student_id: string;
  student_phone: string;
  student_email: string;
  created_at: string;
  final_score: number;
  answers: Answer[];
  total_answers: number;
  total_files: number;
}

export default function AdminRTOStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/intangible/admin/rto-students/");
      setStudents(data.results || []);
    } catch (error: any) {
      console.error(error);
      if (error?.response?.status === 403) {
        toast.error("دسترسی ندارید");
      } else {
        toast.error("خطا در بارگذاری دانشجویان");
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.student_full_name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      s.student_email.toLowerCase().includes(q) ||
      s.asset_name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 bg-gray-50/50 min-h-screen"
      style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">دانشجویان RTO</h1>
            <p className="text-sm text-gray-500 mt-1">
              {toFa(students.length)} دانشجو ثبت‌نام کرده
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو در دانشجویان..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg bg-white"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>هیچ دانشجویی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const isExpanded = expandedId === student.id;
            return (
              <Card key={student.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Summary row */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(isExpanded ? null : student.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base">{student.student_full_name}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {toFa(student.student_id)}
                          </span>
                          {student.final_score > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                              student.final_score >= 70 ? "bg-emerald-100 text-emerald-700" :
                              student.final_score >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              <Award className="w-3 h-3" />
                              امتیاز: {toFa(student.final_score.toFixed(1))}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{student.asset_name}</div>
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.student_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {toFa(student.student_phone)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {toFa(student.total_answers)} پاسخ • {toFa(student.total_files)} فایل
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(student.created_at).toLocaleDateString("fa-IR")}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="font-bold text-sm mb-3">پاسخ‌های ارزیابی</h4>
                      {student.answers.length === 0 ? (
                        <p className="text-sm text-gray-500">هنوز ارزیابی انجام نشده</p>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {student.answers.map((ans, idx) => (
                            <div
                              key={ans.id}
                              className="bg-white p-3 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-400 mb-1">
                                    سوال {toFa(idx + 1)} • {ans.dimension}
                                  </div>
                                  <div className="text-sm">{ans.question_text}</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${
                                    ans.score >= 4 ? "text-emerald-600" :
                                    ans.score >= 3 ? "text-amber-600" :
                                    "text-red-600"
                                  }`}>
                                    {toFa(ans.score)}
                                  </div>
                                  <div className="text-[10px] text-gray-400">از ۵</div>
                                </div>
                              </div>
                              {ans.has_file && ans.file_url && (
                                <div className="mt-2 pt-2 border-t flex items-center gap-2">
                                  <Download className="w-3 h-3 text-blue-600" />
                                  <a
                                    href={ans.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1"
                                  >
                                    {ans.file_name || "مشاهده فایل"}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
