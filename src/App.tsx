/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavTab, IndustryCategoryId, BriefingItem, TargetCompany } from './types';
import {
  INDUSTRY_CATEGORIES,
  MORNING_COMMUTE_BRIEFING,
  EVENING_COMMUTE_BRIEFING,
  TODAY_INDUSTRY_NEWS,
  TARGET_COMPANIES,
  RECENT_AUDIO_HISTORY,
} from './data/mockData';
import { ttsService } from './services/ttsService';
import { databaseService } from './services/databaseService';

import { Header } from './components/Header';
import { NoticeBanner } from './components/NoticeBanner';
import { BottomNav } from './components/BottomNav';
import { AudioMiniBar } from './components/AudioMiniBar';
import { AudioPlayerModal } from './components/AudioPlayerModal';

import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { IndustryDetailView } from './views/IndustryDetailView';
import { LibraryView } from './views/LibraryView';
import { CompaniesView } from './views/CompaniesView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<IndustryCategoryId | null>(null);

  // Data States (Restored from databaseService)
  const [targetCompanies, setTargetCompanies] = useState<TargetCompany[]>(() => {
    // 2단계: 데이터베이스에 등록된 관심 기업명과 목업 기업 매핑
    const userPrefs = databaseService.getUserPreferences();
    if (!userPrefs || !userPrefs.interestedCompanies) return TARGET_COMPANIES;

    // 기존 12대 기업에 커스텀 추가된 기업들 병합
    const existingNames = new Set(TARGET_COMPANIES.map((c) => c.name));
    const customComps: TargetCompany[] = userPrefs.interestedCompanies
      .filter((name) => !existingNames.has(name))
      .map((name, idx) => ({
        id: `comp-custom-${idx}-${Date.now()}`,
        name,
        industryCategory: '기타 제조·IT',
        industryId: 'smart-factory-ai',
        headquarters: '국내 거점',
        hiringStatus: '수시채용',
        recentNewsCount: 1,
        keyPoints: ['사용자 직접 등록 관심 기업'],
        isBookmarked: true,
        latestNews: [{ title: `${name} 공채/수시 채용 모니터링`, date: '2026.11.03', topic: '채용' }],
      }));

    return [...TARGET_COMPANIES, ...customComps];
  });

  // Audio Playback States
  const [activeBriefing, setActiveBriefing] = useState<BriefingItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    return databaseService.getUserPreferences().playbackSpeed || 1.0;
  });
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playback timer ticker reference
  const timerRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      ttsService.stop();
    };
  }, []);

  // Timer loop for audio scrubbing simulation & progress saving
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTimeSec((prev) => {
          const next = prev + 1;
          if (next >= durationSec && durationSec > 0) {
            setIsPlaying(false);
            ttsService.stop();
            if (activeBriefing) {
              databaseService.savePlaybackProgress(activeBriefing.id, durationSec, 0, true);
            }
            return durationSec;
          }

          // 5초마다 재생 기록 자동 저장 (새로고침 복원 보장)
          if (next % 5 === 0 && activeBriefing) {
            databaseService.savePlaybackProgress(activeBriefing.id, next, 0, false);
          }

          return next;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, durationSec, playbackSpeed, activeBriefing]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle Play Briefing (with playback position restoration from DB)
  const handlePlayBriefing = (briefing: BriefingItem) => {
    setActiveBriefing(briefing);
    const totalDuration = briefing.totalDurationSec || 1800;
    setDurationSec(totalDuration);

    // 2단계: playback_history 컬렉션에서 이전 재생 위치 복원 (이어듣기)
    const history = databaseService.getPlaybackHistory(briefing.id);
    let startPos = 0;
    if (history && history.lastPositionSec > 5 && !history.isCompleted) {
      startPos = Math.min(history.lastPositionSec, totalDuration - 5);
      showToast(`이전 청취 위치(${Math.floor(startPos / 60)}분 ${startPos % 60}초)부터 이어서 재생합니다.`);
    }

    setCurrentTimeSec(startPos);
    setIsPlaying(true);
    setIsFullPlayerOpen(true);

    // Speak introductory script preview via Web Speech API
    const speakText = `${briefing.title}. ${briefing.subtitle}. 챕터 1. ${briefing.chapters[0]?.title || ''}. ${briefing.chapters[0]?.summary || ''}`;
    ttsService.speakPreview(speakText);
  };

  const handleTogglePlay = () => {
    if (!activeBriefing) {
      handlePlayBriefing(MORNING_COMMUTE_BRIEFING);
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      ttsService.pause();
      // 일시정지 시 즉시 위치 저장
      databaseService.savePlaybackProgress(activeBriefing.id, currentTimeSec, 0, false);
    } else {
      setIsPlaying(true);
      ttsService.resume();
    }
  };

  const handleSeek = (newTimeSec: number) => {
    const clamped = Math.max(0, Math.min(durationSec, newTimeSec));
    setCurrentTimeSec(clamped);
    if (activeBriefing) {
      databaseService.savePlaybackProgress(activeBriefing.id, clamped, 0, false);
    }
  };

  const handleSkip = (seconds: number) => {
    setCurrentTimeSec((prev) => {
      const next = Math.max(0, Math.min(durationSec, prev + seconds));
      if (activeBriefing) {
        databaseService.savePlaybackProgress(activeBriefing.id, next, 0, false);
      }
      return next;
    });
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    databaseService.updateUserPreferences({ playbackSpeed: speed });
  };

  // Select Industry Category to View Details
  const handleSelectCategory = (categoryId: IndustryCategoryId) => {
    setSelectedCategoryId(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from Category Details
  const handleBackFromCategory = () => {
    setSelectedCategoryId(null);
  };

  // Tab switching
  const handleTabChange = (tab: NavTab) => {
    setSelectedCategoryId(null); // Clear category detail if open
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle company bookmark
  const handleToggleCompanyBookmark = (companyId: string) => {
    setTargetCompanies((prev) =>
      prev.map((c) => {
        if (c.id === companyId) {
          const nextState = !c.isBookmarked;
          if (nextState) {
            databaseService.addInterestedCompany(c.name);
          } else {
            databaseService.removeInterestedCompany(c.name);
          }
          return { ...c, isBookmarked: nextState };
        }
        return c;
      })
    );
  };

  // Add Company Directly (2단계)
  const handleAddCompany = (newComp: TargetCompany) => {
    setTargetCompanies((prev) => [newComp, ...prev]);
    databaseService.addInterestedCompany(newComp.name);
    showToast(`관심 기업 '${newComp.name}'이 데이터베이스에 등록되었습니다.`);
  };

  // Delete Company Directly (2단계)
  const handleDeleteCompany = (id: string) => {
    const target = targetCompanies.find((c) => c.id === id);
    if (target) {
      databaseService.removeInterestedCompany(target.name);
      setTargetCompanies((prev) => prev.filter((c) => c.id !== id));
      showToast(`기업 '${target.name}'이 목록에서 삭제되었습니다.`);
    }
  };

  // 2단계: 기사 피드백 저장 (feedback 컬렉션)
  const handleArticleFeedback = (articleId: string, type: 'useful' | 'not_interested') => {
    databaseService.saveFeedback(articleId, type);
    showToast(
      type === 'useful'
        ? '👍 피드백 반영: 향후 브리핑에서 유사 뉴스가 우선 추천됩니다.'
        : '👎 피드백 반영: 향후 브리핑에서 해당 주제 노출이 감소합니다.'
    );
  };

  // Selected Category Object
  const selectedCategoryObj = selectedCategoryId
    ? INDUSTRY_CATEGORIES.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-sky-500/50 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl animate-in fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile-First Frame container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-screen bg-slate-950 relative border-x border-slate-900 shadow-2xl">
        {/* Fixed Top Header with Title and Today's Date */}
        <Header
          onOpenNotifications={() => {
            alert('출근 브리핑 알림: 오늘 아침 7시 15분에 반도체 및 모빌리티 브리핑이 업데이트되었습니다.');
          }}
        />

        {/* Development Transparency Banner */}
        <NoticeBanner />

        {/* Dynamic Views */}
        <main className="flex-1 mt-3">
          {selectedCategoryObj ? (
            // Category Detail View
            <IndustryDetailView
              category={selectedCategoryObj}
              onBack={handleBackFromCategory}
              onPlayBriefing={handlePlayBriefing}
            />
          ) : currentTab === 'home' ? (
            // 1. Home View (All 7 required sections + article feedback)
            <HomeView
              morningBriefing={MORNING_COMMUTE_BRIEFING}
              eveningBriefing={EVENING_COMMUTE_BRIEFING}
              industryCategories={INDUSTRY_CATEGORIES}
              todayNews={TODAY_INDUSTRY_NEWS}
              targetCompanies={targetCompanies}
              recentHistory={RECENT_AUDIO_HISTORY}
              onPlayBriefing={handlePlayBriefing}
              onSelectCategory={handleSelectCategory}
              onNavigateToTab={handleTabChange}
              onToggleCompanyBookmark={handleToggleCompanyBookmark}
              onArticleFeedback={handleArticleFeedback}
            />
          ) : currentTab === 'explore' ? (
            // 2. Explore View (All 15 industry categories)
            <ExploreView
              categories={INDUSTRY_CATEGORIES}
              onSelectCategory={handleSelectCategory}
            />
          ) : currentTab === 'library' ? (
            // 3. Audio Library View
            <LibraryView
              onPlayBriefing={handlePlayBriefing}
              morningBriefing={MORNING_COMMUTE_BRIEFING}
              eveningBriefing={EVENING_COMMUTE_BRIEFING}
            />
          ) : currentTab === 'companies' ? (
            // 4. Target Companies View (With Add/Delete/Bookmark)
            <CompaniesView
              companies={targetCompanies}
              onToggleBookmark={handleToggleCompanyBookmark}
              onSelectIndustry={handleSelectCategory}
              onAddCompany={handleAddCompany}
              onDeleteCompany={handleDeleteCompany}
            />
          ) : currentTab === 'settings' ? (
            // 5. Settings View (With Database CRUD & Restoration)
            <SettingsView
              categories={INDUSTRY_CATEGORIES}
              onPreferencesUpdated={() => {
                // Settings view updated preferences
              }}
            />
          ) : null}
        </main>

        {/* Floating Mini Audio Bar (Visible when active briefing is selected) */}
        {activeBriefing && (
          <AudioMiniBar
            briefing={activeBriefing}
            isPlaying={isPlaying}
            currentTimeSec={currentTimeSec}
            durationSec={durationSec}
            onTogglePlay={handleTogglePlay}
            onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
            onSkip={handleSkip}
          />
        )}

        {/* Expanded Fullscreen Audio Briefing Modal */}
        {activeBriefing && isFullPlayerOpen && (
          <AudioPlayerModal
            briefing={activeBriefing}
            isPlaying={isPlaying}
            currentTimeSec={currentTimeSec}
            durationSec={durationSec}
            playbackSpeed={playbackSpeed}
            onClose={() => setIsFullPlayerOpen(false)}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onSkip={handleSkip}
            onChangeSpeed={handleChangeSpeed}
          />
        )}

        {/* Bottom Navigation (5 items: 홈, 산업 탐색, 오디오 보관함, 관심 기업, 설정) */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          hasActivePlayer={!!activeBriefing}
        />
      </div>
    </div>
  );
}
