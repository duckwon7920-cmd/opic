import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Check,
  ShieldCheck,
  Server,
  Database,
  Radio,
  Sliders,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  Hash,
  EyeOff,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { IndustryCategory, UserDocument } from '../types';
import { databaseService } from '../services/databaseService';

interface SettingsViewProps {
  categories: IndustryCategory[];
  onPreferencesUpdated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ categories, onPreferencesUpdated }) => {
  const [userPrefs, setUserPrefs] = useState<UserDocument>(() => databaseService.getUserPreferences());
  const [morningTime, setMorningTime] = useState(userPrefs.morningCommuteTime || '07:30');
  const [eveningTime, setEveningTime] = useState(userPrefs.eveningCommuteTime || '18:30');
  const [defaultSpeed, setDefaultSpeed] = useState(String(userPrefs.playbackSpeed || 1.0));

  // Custom Input States
  const [newIndustryInput, setNewIndustryInput] = useState('');
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [newJobInput, setNewJobInput] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newExcludedInput, setNewExcludedInput] = useState('');

  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync state with database service
  const refreshFromDB = () => {
    const fresh = databaseService.getUserPreferences();
    setUserPrefs({ ...fresh });
    setMorningTime(fresh.morningCommuteTime);
    setEveningTime(fresh.eveningCommuteTime);
    setDefaultSpeed(String(fresh.playbackSpeed));
  };

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Toggle or add industry
  const handleToggleIndustry = (name: string) => {
    if (userPrefs.interestedIndustries.includes(name)) {
      databaseService.removeInterestedIndustry(name);
      showNotification(`관심 산업 '${name}' 삭제됨`);
    } else {
      databaseService.addInterestedIndustry(name);
      showNotification(`관심 산업 '${name}' 추가됨`);
    }
    refreshFromDB();
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  // Add custom industry
  const handleAddCustomIndustry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndustryInput.trim()) return;
    databaseService.addInterestedIndustry(newIndustryInput.trim());
    showNotification(`새 관심 산업 '${newIndustryInput.trim()}' 추가됨`);
    setNewIndustryInput('');
    refreshFromDB();
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  // Industry Weight change
  const handleWeightChange = (indName: string, weight: number) => {
    databaseService.setIndustryWeight(indName, weight);
    refreshFromDB();
  };

  // Companies Add/Remove
  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyInput.trim()) return;
    databaseService.addInterestedCompany(newCompanyInput.trim());
    showNotification(`관심 기업 '${newCompanyInput.trim()}' 추가됨`);
    setNewCompanyInput('');
    refreshFromDB();
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleRemoveCompany = (companyName: string) => {
    databaseService.removeInterestedCompany(companyName);
    showNotification(`관심 기업 '${companyName}' 제거됨`);
    refreshFromDB();
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  // Jobs Add/Remove
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobInput.trim()) return;
    databaseService.addInterestedJob(newJobInput.trim());
    showNotification(`관심 직무 '${newJobInput.trim()}' 추가됨`);
    setNewJobInput('');
    refreshFromDB();
  };

  const handleRemoveJob = (job: string) => {
    databaseService.removeInterestedJob(job);
    refreshFromDB();
  };

  // Keywords Add/Remove
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordInput.trim()) return;
    databaseService.addInterestedKeyword(newKeywordInput.trim());
    showNotification(`관심 키워드 '${newKeywordInput.trim()}' 추가됨`);
    setNewKeywordInput('');
    refreshFromDB();
  };

  const handleRemoveKeyword = (kw: string) => {
    databaseService.removeInterestedKeyword(kw);
    refreshFromDB();
  };

  // Excluded Keywords Add/Remove
  const handleAddExcluded = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExcludedInput.trim()) return;
    databaseService.addExcludedKeyword(newExcludedInput.trim());
    showNotification(`제외 키워드 '${newExcludedInput.trim()}' 추가됨`);
    setNewExcludedInput('');
    refreshFromDB();
  };

  const handleRemoveExcluded = (kw: string) => {
    databaseService.removeExcludedKeyword(kw);
    refreshFromDB();
  };

  // Save All Changes
  const handleSaveGeneral = () => {
    databaseService.updateUserPreferences({
      morningCommuteTime: morningTime,
      eveningCommuteTime: eveningTime,
      playbackSpeed: Number(defaultSpeed),
    });
    showNotification('출퇴근 시간 및 재생 설정이 저장되었습니다 (새로고침 시에도 유지)');
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm('모든 설정을 초기 상태(12대 기업, 15대 산업)로 복원하시겠습니까?')) {
      databaseService.resetToDefaults();
      refreshFromDB();
      showNotification('초기 설정으로 복원되었습니다.');
      if (onPreferencesUpdated) onPreferencesUpdated();
    }
  };

  const dbStatus = databaseService.getConnectionStatus();

  return (
    <div className="space-y-5 px-4 pb-28 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <span>설정 및 데이터 관리</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            2단계: 데이터베이스 저장, 조회, 새로고침 복원 지원
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition"
          title="기본값 복원"
        >
          <RotateCcw className="w-3 h-3" />
          <span>기본값 복원</span>
        </button>
      </div>

      {saveToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 1. 출퇴근 시간 맞춤 설정 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>출퇴근 시간 및 브리핑 분량</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">
              아침 출근 시간
            </label>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">
              저녁 퇴근 시간
            </label>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-300">목표 브리핑 분량</span>
          <span className="font-semibold text-sky-400 font-mono">약 30분 코스</span>
        </div>
      </div>

      {/* 2. 관심 산업 직접 추가/삭제 및 중요도 설정 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>관심 산업 관리 ({userPrefs.interestedIndustries.length}개 선택됨)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          산업 카테고리를 터치하여 추가/해제하거나 중요도(1~5)를 조정하세요. 직접 새로운 산업을 입력해 등록할 수도 있습니다.
        </p>

        {/* 직접 산업 추가 폼 */}
        <form onSubmit={handleAddCustomIndustry} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newIndustryInput}
            onChange={(e) => setNewIndustryInput(e.target.value)}
            placeholder="새 관심 산업 직접 추가 (예: 원자력·SMR)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs font-bold flex items-center gap-1 hover:bg-sky-500 hover:text-slate-950 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
        </form>

        {/* 15개 기본 산업 + 커스텀 산업 목록 */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 pt-1">
          {userPrefs.interestedIndustries.map((indName) => {
            const weight = userPrefs.industryWeights[indName] || 3;
            return (
              <div
                key={indName}
                className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-semibold text-white truncate">{indName}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* 중요도 선택 */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>중요도</span>
                    <select
                      value={weight}
                      onChange={(e) => handleWeightChange(indName, Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 text-sky-300 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                    >
                      <option value={1}>1 (낮음)</option>
                      <option value={2}>2</option>
                      <option value={3}>3 (보통)</option>
                      <option value={4}>4</option>
                      <option value={5}>5 (높음)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleIndustry(indName)}
                    className="text-slate-400 hover:text-rose-400 transition p-1"
                    title="산업 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 관심 기업 직접 추가 및 삭제 (초기 12개사 완비) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>관심 기업 관리 ({userPrefs.interestedCompanies.length}개사 등록됨)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          초기 12대 기업(현대차, 기아, 포스코, SK하이닉스, 삼성전자 등)이 등록되어 있으며 자유롭게 추가/삭제할 수 있습니다.
        </p>

        {/* 직접 기업 추가 폼 */}
        <form onSubmit={handleAddCompany} className="flex gap-2">
          <input
            type="text"
            value={newCompanyInput}
            onChange={(e) => setNewCompanyInput(e.target.value)}
            placeholder="새 관심 기업 직접 추가 (예: 두산에너빌리티, 네이버)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs font-bold flex items-center gap-1 hover:bg-sky-500 hover:text-slate-950 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
        </form>

        {/* 기업 태그 목록 */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {userPrefs.interestedCompanies.map((comp) => (
            <span
              key={comp}
              className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg"
            >
              <span>{comp}</span>
              <button
                type="button"
                onClick={() => handleRemoveCompany(comp)}
                className="text-slate-400 hover:text-rose-400 transition"
                title={`${comp} 삭제`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 4. 관심 직무 & 키워드 관리 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
        {/* 관심 직무 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>관심 직무 ({userPrefs.interestedJobs.length})</span>
          </div>
          <form onSubmit={handleAddJob} className="flex gap-2">
            <input
              type="text"
              value={newJobInput}
              onChange={(e) => setNewJobInput(e.target.value)}
              placeholder="관심 직무 추가 (예: 공정관리, 안전환경, SCM)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-sky-400 text-xs hover:bg-slate-700 transition"
            >
              추가
            </button>
          </form>
          <div className="flex flex-wrap gap-1">
            {userPrefs.interestedJobs.map((j) => (
              <span
                key={j}
                className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-md"
              >
                <span>{j}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveJob(j)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 관심 키워드 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider">
            <Hash className="w-4 h-4" />
            <span>핵심 관심 키워드 ({userPrefs.interestedKeywords.length})</span>
          </div>
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              placeholder="우선 수집 키워드 (예: CXL, 4680, LFP)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-sky-400 text-xs hover:bg-slate-700 transition"
            >
              추가
            </button>
          </form>
          <div className="flex flex-wrap gap-1">
            {userPrefs.interestedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 bg-sky-950/60 border border-sky-800 text-sky-300 text-[11px] px-2 py-0.5 rounded-md"
              >
                <span>#{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="text-sky-400 hover:text-rose-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 제외 키워드 필터 */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider">
            <EyeOff className="w-4 h-4" />
            <span>제외 키워드 필터 ({userPrefs.excludedKeywords.length})</span>
          </div>
          <p className="text-[10px] text-slate-400">
            해당 키워드가 포함된 기사는 브리핑 뉴스 수집 대상에서 제외됩니다.
          </p>
          <form onSubmit={handleAddExcluded} className="flex gap-2">
            <input
              type="text"
              value={newExcludedInput}
              onChange={(e) => setNewExcludedInput(e.target.value)}
              placeholder="제외 키워드 (예: 연예, 스포츠, 주식리딩방)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-rose-400 text-xs hover:bg-slate-700 transition"
            >
              추가
            </button>
          </form>
          <div className="flex flex-wrap gap-1">
            {userPrefs.excludedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px] px-2 py-0.5 rounded-md"
              >
                <span>제외: {kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExcluded(kw)}
                  className="text-rose-400 hover:text-rose-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 오디오 재생 설정 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider">
          <Radio className="w-4 h-4" />
          <span>오디오 음성 및 배속 설정</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-300">기본 재생 배속</span>
          <div className="flex gap-1">
            {['0.8', '1.0', '1.2', '1.5'].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setDefaultSpeed(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  defaultSpeed === rate
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
          <span>설정된 음성 엔진:</span>
          <span className="text-sky-300 font-medium">{userPrefs.voiceSettings.voiceName}</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSaveGeneral}
        className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl text-white font-bold text-xs shadow-lg shadow-sky-500/20 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        <span>설정 저장하기 (브라우저 영구 보관)</span>
      </button>

      {/* 6. 데이터베이스 및 복원 상태 검증 패널 */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>2단계 데이터베이스 연결 상태</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
            정상 복원 작동중
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {dbStatus.notice}
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-300">
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-slate-400 block font-sans">사용자 설정 (users)</span>
            <span className="text-sky-400 font-bold">1 레코드 동기화됨</span>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-slate-400 block font-sans">관심 기업 컬렉션</span>
            <span className="text-sky-400 font-bold">{userPrefs.interestedCompanies.length}개사 관리중</span>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-slate-400 block font-sans">관심 산업 컬렉션</span>
            <span className="text-sky-400 font-bold">{userPrefs.interestedIndustries.length}개 카테고리</span>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-slate-400 block font-sans">최종 동기화 시각</span>
            <span className="text-emerald-400 font-bold">{new Date(dbStatus.lastSyncedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="pt-2 text-[10px] text-slate-400">
          💡 <strong>새로고침 복원 검증:</strong> 브라우저를 새로고침(F5)해도 관심 산업·기업·직무·키워드가 안전하게 유지됩니다.
        </div>
      </div>
    </div>
  );
};
