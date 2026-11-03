import React, { useState } from 'react';
import {
  Building2,
  Search,
  Bookmark,
  ExternalLink,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { TargetCompany, IndustryCategoryId } from '../types';
import { INITIAL_TARGET_INDUSTRIES } from '../services/databaseService';

interface CompaniesViewProps {
  companies: TargetCompany[];
  onToggleBookmark: (id: string) => void;
  onSelectIndustry: (id: IndustryCategoryId) => void;
  onAddCompany: (company: TargetCompany) => void;
  onDeleteCompany: (id: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  onToggleBookmark,
  onSelectIndustry,
  onAddCompany,
  onDeleteCompany,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Company form states
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newIndustry, setNewIndustry] = useState(INITIAL_TARGET_INDUSTRIES[0]);
  const [newLocation, setNewLocation] = useState('서울');
  const [newHiringStatus, setNewHiringStatus] = useState<'채용중' | '상반기 공채 예정' | '수시채용' | '모니터링'>('수시채용');
  const [newKeyPoint, setNewKeyPoint] = useState('');

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industryCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBookmark = showBookmarkedOnly ? c.isBookmarked : true;
    return matchesSearch && matchesBookmark;
  });

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const newComp: TargetCompany = {
      id: `custom-comp-${Date.now()}`,
      name: newCompanyName.trim(),
      industryCategory: newIndustry,
      industryId: 'auto-mobility', // fallback ID
      headquarters: newLocation,
      hiringStatus: newHiringStatus,
      recentNewsCount: 1,
      keyPoints: newKeyPoint.trim() ? [newKeyPoint.trim()] : ['채용 공고 및 주요 공정 모니터링 등록'],
      isBookmarked: true,
      latestNews: [
        {
          title: `${newCompanyName.trim()} 최신 산업 브리핑 키워드 등록`,
          date: '2026.11.03',
          topic: '동향'
        }
      ]
    };

    onAddCompany(newComp);
    setNewCompanyName('');
    setNewKeyPoint('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>관심 기업 ({companies.length}개사)</span>
          </h2>

          <button
            type="button"
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/40 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 hover:bg-sky-500 hover:text-slate-950 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>기업 직접 추가</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          초기 12대 기업 포함, 직접 관심 기업을 추가하고 채용 상태를 관리하세요.
        </p>
      </div>

      {/* Add Company Form Modal / Accordion */}
      {isAddOpen && (
        <form
          onSubmit={handleCreateCompany}
          className="bg-slate-900 border border-sky-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in text-xs shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              새 관심 기업 직접 추가
            </span>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              닫기
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">기업명 (필수)</label>
            <input
              type="text"
              required
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="예: 두산에너빌리티, 네이버, HL만도"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">산업 카테고리</label>
              <select
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                {INITIAL_TARGET_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">채용 상태</label>
              <select
                value={newHiringStatus}
                onChange={(e) => setNewHiringStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="채용중">채용중</option>
                <option value="상반기 공채 예정">상반기 공채 예정</option>
                <option value="수시채용">수시채용</option>
                <option value="모니터링">모니터링</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">취준생 관심 메모 / 포인트</label>
            <input
              type="text"
              value={newKeyPoint}
              onChange={(e) => setNewKeyPoint(e.target.value)}
              placeholder="예: 스마트팩토리 MES 공정 개선 직무 지원 준비"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition"
          >
            관심 기업 저장하기
          </button>
        </form>
      )}

      {/* Search and Bookmark Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="기업명 검색 (현대차, 포스코, 삼성전자...)"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
            showBookmarkedOnly
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${showBookmarkedOnly ? 'fill-amber-400' : ''}`} />
          <span>관심만</span>
        </button>
      </div>

      {/* Companies List */}
      <div className="space-y-3">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
            조건에 맞는 기업이 없습니다. 상단의 '기업 직접 추가' 버튼으로 새 기업을 등록해 보세요.
          </div>
        ) : (
          filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200 font-black text-sm">
                    {comp.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {comp.name}
                      <span
                        onClick={() => onSelectIndustry(comp.industryId)}
                        className="text-[10px] font-normal text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-900 cursor-pointer hover:underline"
                      >
                        {comp.industryCategory}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {comp.headquarters}
                      </span>
                      <span>•</span>
                      <span>뉴스 {comp.recentNewsCount}건</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      comp.hiringStatus === '채용중'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : comp.hiringStatus === '수시채용'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {comp.hiringStatus}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(comp.id)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                    title="북마크 토글"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        comp.isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteCompany(comp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="기업 목록에서 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Preparation Points */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  취준생 핵심 모니터링 토픽
                </span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  {comp.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-sky-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Latest News Items */}
              <div className="space-y-1 pt-1 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-medium">최신 뉴스 동향</span>
                {comp.latestNews.map((news, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 text-slate-300 hover:text-sky-300 cursor-pointer"
                  >
                    <span className="truncate max-w-[250px] text-[11px]">
                      • {news.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {news.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
