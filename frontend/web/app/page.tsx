"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Smartphone,
  Users,
  LayoutDashboard,
  Package,
  CheckCircle2,
  MessageSquareText,
  Star,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900 font-sans selection:bg-indigo-100 scroll-smooth">

      {/* Sticky Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              BizFlow
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[14px] font-black uppercase tracking-widest text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Tính năng</a>
            <a href="#problem" className="hover:text-indigo-600 transition-colors">Giải pháp</a>
            <a href="#why" className="hover:text-indigo-600 transition-colors">Về chúng tôi</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Báo giá</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-slate-600 font-bold hover:bg-slate-50 rounded-xl">
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 text-white px-8 h-12 rounded-xl font-black uppercase tracking-tight">
              <Link href="/login">Dùng thử ngay</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">

        {/* Hero Section */}
        <section className="relative pt-48 pb-32 overflow-hidden">
          <div className="text-center relative z-10">
            <Badge className="mb-8 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
              <Star className="h-3.5 w-3.5 mr-2 fill-indigo-600" /> Hệ thống POS 2026 đã sẵn sàng
            </Badge>

            <h1 className="text-6xl lg:text-9xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
              Quản lý kinh doanh <br />
              <span className="text-indigo-600 relative">
                Dễ dàng
                <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 318 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 9.5C53.5 1.5 174.5 -1.5 315.5 10.5" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span> hơn bao giờ hết
            </h1>

            <p className="max-w-3xl mx-auto text-xl lg:text-2xl text-slate-500 mb-14 leading-relaxed font-semibold">
              BizFlow là nền tảng POS – Quản lý kho – Công nợ – AI thông minh
              dành riêng cho hộ kinh doanh hiện đại tại Việt Nam.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-28">
              <Button size="lg" asChild className="h-18 px-12 bg-indigo-600 hover:bg-indigo-700 text-xl shadow-2xl shadow-indigo-200 rounded-[1.25rem] font-black transition-all hover:scale-105 active:scale-95">
                <Link href="/login">Dùng thử miễn phí <ArrowRight className="ml-3 h-6 w-6" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-18 px-12 border-slate-200 hover:bg-slate-50 text-lg text-slate-700 rounded-[1.25rem] font-bold shadow-sm transition-all overflow-hidden relative group">
                <Link href="/login" className="relative z-10 flex items-center gap-2">
                  Xem demo POS <BarChart3 className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Large Visual Feature Card */}
            <div className="relative max-w-6xl mx-auto group">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <Card className="relative rounded-[2.5rem] border-[12px] border-slate-900 bg-slate-900 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.2)] overflow-hidden aspect-[16/9]">
                <CardContent className="p-0 h-full w-full bg-white flex">
                  {/* Mock App Shell */}
                  <div className="w-20 h-full border-r border-slate-100 bg-slate-50/50 flex flex-col items-center pt-8 space-y-8">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl shadow-lg" />
                    <div className="h-7 w-7 bg-slate-200 rounded-lg opacity-50" />
                    <div className="h-7 w-7 bg-indigo-100 rounded-lg" />
                    <div className="h-7 w-7 bg-slate-200 rounded-lg opacity-50" />
                    <div className="h-7 w-7 bg-slate-200 rounded-lg opacity-50" />
                  </div>
                  <div className="flex-1 p-10 space-y-12 bg-white">
                    <div className="flex justify-between items-center">
                      <div className="h-10 w-64 bg-slate-100 rounded-xl" />
                      <div className="h-12 w-48 bg-indigo-600/10 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-3xl border border-slate-100 p-6 space-y-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50" />
                          <div className="h-4 w-3/4 bg-slate-200/50 rounded-full" />
                        </div>
                      ))}
                    </div>
                    <div className="h-72 w-full bg-slate-50 rounded-[2rem] border border-slate-100/50 p-10 flex items-end gap-6 overflow-hidden">
                      <div className="flex-1 bg-indigo-500/20 rounded-t-2xl h-[40%]" />
                      <div className="flex-1 bg-indigo-500/40 rounded-t-2xl h-[90%]" />
                      <div className="flex-1 bg-indigo-600 rounded-t-2xl h-[100%]" />
                      <div className="flex-1 bg-indigo-500/60 rounded-t-2xl h-[70%]" />
                      <div className="flex-1 bg-indigo-500/30 rounded-t-2xl h-[50%]" />
                      <div className="flex-1 bg-indigo-500/20 rounded-t-2xl h-[80%]" />
                    </div>
                  </div>
                </CardContent>
                {/* Dashboard Reflection Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none" />
              </Card>
            </div>
          </div>

          {/* Background Orbs */}
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-200 rounded-full blur-[150px] -z-10 opacity-40 animate-pulse" />
          <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] -z-10 opacity-50" />
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-32 relative">
          <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
            <h2 className="text-indigo-600 font-black uppercase tracking-[0.3em] text-xs">Vấn đề của bạn</h2>
            <h3 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">Cửa hàng đang bị kìm hãm <br /> bởi <span className="text-rose-600 italic">công cụ cũ?</span></h3>
            <p className="text-xl text-slate-500 font-bold px-4">Đã đến lúc loại bỏ sổ sách thủ công và những sai sót không đáng có gây thất thoát tài sản.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <PainCard
              title="Thất thoát hàng hóa"
              description="Không nắm được tồn kho chính xác, hàng hết không biết, hàng tồn không hay."
              icon={<Package className="h-7 w-7 text-rose-500" />}
            />
            <PainCard
              title="Công nợ rối rắm"
              description="Ghi sổ tay rời rạc, khách nợ bao nhiêu không nhớ, khó thu hồi tiền hàng."
              icon={<BarChart3 className="h-7 w-7 text-amber-500" />}
            />
            <PainCard
              title="Bán hàng chậm chạp"
              description="Nhập tay từng món, tính nhầm tiền, khách hàng phải chờ đợi quá lâu."
              icon={<TrendingUp className="h-7 w-7 rotate-180 text-rose-500" />}
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12 order-2 lg:order-1">
              <div className="space-y-6">
                <h2 className="text-indigo-600 font-black uppercase tracking-[0.3em] text-xs">Tính năng thông minh</h2>
                <h3 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">Hệ sinh thái vận hành <br /> chuẩn Fintech</h3>
                <p className="text-xl text-slate-500 font-bold leading-relaxed">BizFlow tích hợp mọi nghiệp vụ cần thiết trong một giao diện tối giản, tập trung vào hiệu quả bán hàng.</p>
              </div>

              <div className="grid gap-8">
                <FeatureItem
                  icon={<ShoppingCart className="h-6 w-6" />}
                  title="Bán hàng POS thần tốc"
                  desc="Hỗ trợ phím tắt, quét mã vạch và thanh toán 3 bước cực nhanh."
                />
                <FeatureItem
                  icon={<Globe className="h-6 w-6" />}
                  title="AI Phân tích tin nhắn"
                  desc="Tự động bóc tách đơn hàng từ tin nhắn chat, tiết kiệm 90% thời gian nhập liệu."
                />
                <FeatureItem
                  icon={<LayoutDashboard className="h-6 w-6" />}
                  title="Báo cáo tài chính trực quan"
                  desc="Biểu đồ doanh thu, lợi nhuận, công nợ cập nhật theo từng giây."
                />
              </div>
            </div>

            <div className="order-1 lg:order-2 relative group">
              <div className="absolute inset-0 bg-indigo-500 rounded-[3rem] rotate-3 -z-10 group-hover:rotate-6 transition-transform duration-700 opacity-20" />
              <Card className="rounded-[4rem] border-none shadow-2xl overflow-hidden aspect-square bg-white flex items-center justify-center p-16 relative">
                <div className="absolute top-0 right-0 p-12 text-indigo-50">
                  <Zap className="h-64 w-64 fill-current opacity-20" />
                </div>
                <div className="text-center relative z-10 space-y-10">
                  <div className="h-32 w-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mx-auto animate-bounce">
                    <Zap className="h-16 w-16" />
                  </div>
                  <div className="space-y-4">
                    <span className="text-4xl font-black text-slate-900 block tracking-tight">Thấu hiểu nghiệp vụ <br /> hộ kinh doanh Việt</span>
                    <p className="text-slate-500 font-bold text-lg px-8 tracking-tight">Thiết kế theo thói quen sử dụng thực tế của chủ tiệm Việt Nam.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Mobile Section */}
        <section className="py-32 bg-slate-900 rounded-[4rem] px-16 text-white overflow-hidden relative mb-24">
          <div className="absolute top-0 right-0 p-24 opacity-10">
            <Smartphone className="h-96 w-96 rotate-12" />
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-24 relative z-10">
            <div className="flex-1 space-y-10 text-center lg:text-left">
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-black uppercase tracking-widest h-10 px-6">Mobile App Ready</Badge>
              <h3 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[1]">Kinh doanh <br /> trong lòng bàn tay</h3>
              <p className="text-xl text-slate-400 font-bold leading-relaxed max-w-xl">
                Dù ở quán cà phê hay đang đi du lịch, bạn luôn làm chủ được dòng tiền và hàng hóa chỉ với một chiếc điện thoại smartphone.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-6">
                <div className="flex items-center gap-4 bg-white/5 p-5 rounded-3xl border border-white/10 opacity-50 cursor-not-allowed group">
                  <div className="p-4 bg-slate-700 rounded-2xl">
                    <Smartphone className="h-7 w-7" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm uppercase tracking-wider">App Store</div>
                    <div className="text-xs text-slate-400 font-bold italic">Sắp ra mắt</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-5 rounded-3xl border border-white/10 opacity-50 cursor-not-allowed group">
                  <div className="p-4 bg-slate-700 rounded-2xl">
                    <Smartphone className="h-7 w-7" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm uppercase tracking-wider">Play Store</div>
                    <div className="text-xs text-slate-400 font-bold italic">Sắp ra mắt</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* CSS Phone Frame */}
              <div className="w-[320px] h-[650px] border-[14px] border-slate-800 rounded-[3.5rem] bg-slate-800 shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden relative">
                <div className="bg-white h-full w-full p-6 pt-16 space-y-8">
                  <div className="flex justify-between items-center text-slate-900">
                    <span className="font-black text-2xl tracking-tighter">BizFlow</span>
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-32 bg-indigo-600 rounded-3xl p-6 flex flex-col justify-between text-white shadow-xl shadow-indigo-100">
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">Doanh thu nay</span>
                    <span className="text-3xl font-black italic tracking-tighter">24.500.000 đ</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-slate-50 rounded-2xl border border-slate-100" />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-10 bg-slate-800 rounded-b-[2rem]" />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 text-center relative">
          <div className="relative z-10 max-w-4xl mx-auto space-y-12">
            <h3 className="text-6xl lg:text-9xl font-black text-slate-900 tracking-tighter leading-[0.9]">Sẵn sàng số hóa <br /> cửa hàng của bạn?</h3>
            <p className="text-2xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed">
              Tham gia cùng hơn 2,000 khách hàng đang tin dùng BizFlow mỗi ngày. Miễn phí dùng thử không giới hạn.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button size="lg" asChild className="h-20 px-16 bg-indigo-600 hover:bg-indigo-700 text-2xl shadow-2xl shadow-indigo-100 rounded-[1.5rem] font-black uppercase tracking-tight scale-110">
                <Link href="/login">Bắt đầu ngay hôm nay</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-10 pt-10 text-slate-400 font-black text-xs uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Không thẻ tín dụng</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> 14 ngày dùng thử</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white pt-32 pb-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-20 pb-20 border-b border-slate-100">
          <div className="col-span-1 md:col-span-1 space-y-8">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">BizFlow</span>
            </div>
            <p className="text-lg text-slate-500 font-bold leading-relaxed">
              Đồng hành cùng sự phát triển mạnh mẽ của kinh tế số Việt Nam.
            </p>
          </div>

          <FooterColumn
            title="Dịch vụ"
            links={["Quản lý POS", "Kho hàng AI", "Mạng lưới khách hàng", "Báo cáo nợ"]}
          />
          <FooterColumn
            title="Công ty"
            links={["Về chúng tôi", "Tuyển dụng", "Tài liệu", "Liên hệ Zalo"]}
          />
          <FooterColumn
            title="Pháp lý"
            links={["Điều khoản", "Bảo mật", "QS Privacy", "TT88 Compliance"]}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">© 2026 BizFlow Platform. Design for Excellence.</span>
          <div className="flex gap-10 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-indigo-600 transition-colors">Facebook</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">LinkedIN</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Zalo OA</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PainCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <Card className="p-10 rounded-[3rem] border-slate-100 hover:border-white bg-white hover:shadow-2xl transition-all duration-700 group hover:-translate-y-2">
      <CardContent className="p-0 space-y-8">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-indigo-100">
          {icon}
        </div>
        <div className="space-y-4">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h4>
          <p className="text-base text-slate-500 font-bold leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <div className="space-y-2">
        <h5 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h5>
        <p className="text-lg text-slate-500 font-bold leading-relaxed tracking-tight">{desc}</p>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="space-y-8">
      <h4 className="text-slate-900 font-black uppercase tracking-[0.2em] text-xs">{title}</h4>
      <ul className="space-y-6">
        {links.map((link, i) => (
          <li key={i}>
            <a href="#" className="text-sm text-slate-500 font-bold hover:text-indigo-600 transition-colors tracking-tight">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
