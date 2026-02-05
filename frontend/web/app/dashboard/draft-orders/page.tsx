"use client";

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Loader2,
  RefreshCcw,
  Sparkles,
  List,
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

import { draftOrdersApi } from "@/lib/api/draftOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { DraftInput } from "@/components/draft/DraftInput";
import { DraftReview } from "@/components/draft/DraftReview";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface DraftOrder {
  id: number;
  draft_code: string;
  original_input: string;
  confidence_score: number;
  status: string;
  created_at: string;
  missing_fields: string[];
  questions: string[];
  parsed_data: any;
}

export default function DraftOrdersPage() {
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDraft, setCurrentDraft] = useState<DraftOrder | null>(null);
  const [view, setView] = useState<'list' | 'input' | 'review'>('list');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const data = await draftOrdersApi.listDrafts();
      setDrafts(data);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleParsed = (newDraft: DraftOrder) => {
    setCurrentDraft(newDraft);
    setView('review');
    // Also refresh list in background
    fetchDrafts();
  };

  const handleSelectDraft = (draft: DraftOrder) => {
    setCurrentDraft(draft);
    setView('review');
  };

  const handleBack = () => {
    setCurrentDraft(null);
    setView('list');
    fetchDrafts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {view !== 'list' && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <Breadcrumb className="mb-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Đơn nháp (AI)</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {view === 'review' ? 'Kiểm tra đơn hàng' : 'Đơn Nháp (AI)'}
            </h2>
            <p className="text-muted-foreground text-sm">
              Xử lý các đơn hàng được tạo tự động từ tiếng Việt (Văn bản/Giọng nói).
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {view === 'list' ? (
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setView('input')}>
              <Sparkles className="mr-2 h-4 w-4" /> Tạo đơn bằng AI
            </Button>
          ) : view === 'input' ? (
            <Button variant="outline" onClick={() => setView('list')}>
              <List className="mr-2 h-4 w-4" /> Danh sách nháp
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-[400px]">
        {view === 'input' && (
          <div className="max-w-3xl mx-auto pt-8">
            <DraftInput onParsed={handleParsed} />
          </div>
        )}

        {view === 'review' && currentDraft && (
          <DraftReview draft={currentDraft} onUpdate={setCurrentDraft} />
        )}

        {view === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <List className="h-5 w-5 text-indigo-500" /> Đơn nháp chờ xử lý
              </h3>
              <Button variant="ghost" size="sm" onClick={fetchDrafts} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : drafts.length === 0 ? (
              <Card className="bg-slate-50 border-dashed border-2 py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-white p-4 shadow-sm mb-4 border">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Không có đơn nháp nào</h3>
                  <p className="text-slate-500 max-w-sm mt-1">
                    Tất cả đơn hàng AI đã được xử lý. Nhấn nút "Tạo đơn bằng AI" để bắt đầu.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onClick={() => handleSelectDraft(draft)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onClick
}: {
  draft: DraftOrder;
  onClick: () => void;
}) {
  const confidencePercent = Math.round(draft.confidence_score * 100);
  const isHighConfidence = confidencePercent >= 80;

  return (
    <Card
      className="flex flex-col h-full hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3 border-b bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border">{draft.draft_code}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isHighConfidence ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
            {confidencePercent}% tin cậy
          </span>
        </div>
        <CardTitle className="text-sm mt-3 line-clamp-3 leading-snug font-bold text-slate-900 min-h-[3rem]">
          {draft.original_input}
        </CardTitle>
        <CardDescription className="text-[10px] flex items-center gap-1 mt-1">
          {formatDate(draft.created_at)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 py-4">
        {draft.missing_fields.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bị thiếu:</p>
            <div className="flex flex-wrap gap-1">
              {draft.missing_fields.map(f => (
                <span key={f} className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-bold capitalize">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {draft.questions.length > 0 && (
          <div className="text-[11px] text-slate-600 italic">
            <p className="font-bold text-slate-500 not-italic uppercase tracking-wider mb-1">Gợi ý:</p>
            {draft.questions[0]}...
          </div>
        )}
      </CardContent>

      <div className="p-4 pt-0 mt-auto border-t py-3 bg-slate-50 group-hover:bg-indigo-50/30 transition-colors">
        <Button
          variant="outline"
          className="w-full h-8 text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white"
        >
          Xử lý ngay →
        </Button>
      </div>
    </Card>
  );
}
