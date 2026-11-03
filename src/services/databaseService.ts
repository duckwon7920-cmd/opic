import {
  UserDocument,
  ArticleDocument,
  BriefingDocument,
  AudioDocument,
  FeedbackDocument,
  PlaybackHistoryDocument,
} from '../types';

const STORAGE_KEY = 'commute_briefing_2_database';

// 초기 12개 필수 관심 기업
export const INITIAL_TARGET_COMPANIES: string[] = [
  '현대자동차',
  '기아',
  '현대제철',
  '포스코',
  '한화에어로스페이스',
  'LIG넥스원',
  'HD현대중공업',
  '한화오션',
  '삼성전자',
  'SK하이닉스',
  'LG에너지솔루션',
  '삼성SDI',
];

// 초기 15개 필수 관심 산업
export const INITIAL_TARGET_INDUSTRIES: string[] = [
  '철강·금속',
  '자동차·모빌리티',
  '방산·항공우주',
  '반도체',
  '배터리·에너지',
  '스마트팩토리·제조 AI',
  '조선·해양',
  '품질관리·품질보증',
  '생산기술·공정관리',
  '화학·정유·석유화학',
  '원자재·글로벌 공급망',
  '산업 정책·경제·환율·관세',
  '기업 실적·투자',
  '기업 채용·취업 동향',
  'ESG·탄소중립',
];

export interface DatabaseState {
  users: Record<string, UserDocument>;
  articles: Record<string, ArticleDocument>;
  briefings: Record<string, BriefingDocument>;
  audio: Record<string, AudioDocument>;
  feedback: Record<string, FeedbackDocument>;
  playback_history: Record<string, PlaybackHistoryDocument>;
  connectionStatus: {
    engine: 'local-persistent-store' | 'cloud-firestore';
    isReady: boolean;
    lastSyncedAt: string;
    notice: string;
  };
}

class DatabaseService {
  private state: DatabaseState;
  private currentUserId = 'default_user_local';

  constructor() {
    this.state = this.loadFromStorage();
  }

  /**
   * 스토리지에서 상태 복원 (오류 방지 및 복원 보장)
   */
  private loadFromStorage(): DatabaseState {
    const defaultUser: UserDocument = {
      id: this.currentUserId,
      interestedIndustries: [...INITIAL_TARGET_INDUSTRIES],
      industryWeights: INITIAL_TARGET_INDUSTRIES.reduce((acc, ind) => {
        acc[ind] = 3;
        return acc;
      }, {} as Record<string, number>),
      interestedCompanies: [...INITIAL_TARGET_COMPANIES],
      interestedJobs: ['생산기술', '품질관리·품질보증', '공정설계', '연구개발(R&D)', '제조AI'],
      interestedKeywords: ['HBM4', 'SDV', 'CBAM', '수소환원제철', '전고체 배터리', '수주잔고'],
      excludedKeywords: ['단순 루머', '가십'],
      voiceSettings: {
        provider: 'local-tts',
        voiceName: '한국어 표준 아나운서 음성',
        pitch: 1.0,
        rate: 1.0,
      },
      playbackSpeed: 1.0,
      morningCommuteTime: '07:30',
      eveningCommuteTime: '18:30',
      updatedAt: new Date().toISOString(),
    };

    const initialDefaultState: DatabaseState = {
      users: { [this.currentUserId]: defaultUser },
      articles: {},
      briefings: {},
      audio: {},
      feedback: {},
      playback_history: {},
      connectionStatus: {
        engine: 'local-persistent-store',
        isReady: true,
        lastSyncedAt: new Date().toISOString(),
        notice: '로컬 영구 데이터베이스 활성화 (새로고침 후 자동 복원 지원)',
      },
    };

    if (typeof window === 'undefined') {
      return initialDefaultState;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.saveToStorage(initialDefaultState);
        return initialDefaultState;
      }
      const parsed = JSON.parse(stored) as DatabaseState;
      // 누락된 기본 사용자 복구
      if (!parsed.users || !parsed.users[this.currentUserId]) {
        parsed.users = { [this.currentUserId]: defaultUser };
      }
      return parsed;
    } catch (e) {
      console.warn('[DatabaseService] Failed to parse stored DB, resetting to defaults safely:', e);
      return initialDefaultState;
    }
  }

  /**
   * 스토리지에 안전 저장
   */
  private saveToStorage(stateToSave?: DatabaseState): void {
    if (typeof window === 'undefined') return;
    try {
      const data = stateToSave || this.state;
      data.connectionStatus.lastSyncedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[DatabaseService] Storage save error (quota exceeded or storage blocked):', e);
    }
  }

  // ==================== 1. USERS & PREFERENCES ====================

  getUserPreferences(): UserDocument {
    return this.state.users[this.currentUserId];
  }

  updateUserPreferences(partial: Partial<UserDocument>): UserDocument {
    const existing = this.getUserPreferences();
    const updated: UserDocument = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.state.users[this.currentUserId] = updated;
    this.saveToStorage();
    return updated;
  }

  // 관심 산업 추가/삭제
  addInterestedIndustry(industryName: string): boolean {
    const user = this.getUserPreferences();
    if (!user.interestedIndustries.includes(industryName)) {
      user.interestedIndustries.push(industryName);
      user.industryWeights[industryName] = 3;
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  removeInterestedIndustry(industryName: string): boolean {
    const user = this.getUserPreferences();
    if (user.interestedIndustries.includes(industryName)) {
      user.interestedIndustries = user.interestedIndustries.filter((i) => i !== industryName);
      delete user.industryWeights[industryName];
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  setIndustryWeight(industryName: string, weight: number): void {
    const user = this.getUserPreferences();
    user.industryWeights[industryName] = weight;
    this.updateUserPreferences(user);
  }

  // 관심 기업 추가/삭제
  addInterestedCompany(companyName: string): boolean {
    const trimmed = companyName.trim();
    if (!trimmed) return false;
    const user = this.getUserPreferences();
    if (!user.interestedCompanies.includes(trimmed)) {
      user.interestedCompanies.push(trimmed);
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  removeInterestedCompany(companyName: string): boolean {
    const user = this.getUserPreferences();
    if (user.interestedCompanies.includes(companyName)) {
      user.interestedCompanies = user.interestedCompanies.filter((c) => c !== companyName);
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  // 관심 직무 추가/삭제
  addInterestedJob(jobName: string): boolean {
    const trimmed = jobName.trim();
    if (!trimmed) return false;
    const user = this.getUserPreferences();
    if (!user.interestedJobs.includes(trimmed)) {
      user.interestedJobs.push(trimmed);
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  removeInterestedJob(jobName: string): boolean {
    const user = this.getUserPreferences();
    user.interestedJobs = user.interestedJobs.filter((j) => j !== jobName);
    this.updateUserPreferences(user);
    return true;
  }

  // 관심 키워드 추가/삭제
  addInterestedKeyword(keyword: string): boolean {
    const trimmed = keyword.trim();
    if (!trimmed) return false;
    const user = this.getUserPreferences();
    if (!user.interestedKeywords.includes(trimmed)) {
      user.interestedKeywords.push(trimmed);
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  removeInterestedKeyword(keyword: string): boolean {
    const user = this.getUserPreferences();
    user.interestedKeywords = user.interestedKeywords.filter((k) => k !== keyword);
    this.updateUserPreferences(user);
    return true;
  }

  // 제외 키워드 추가/삭제
  addExcludedKeyword(keyword: string): boolean {
    const trimmed = keyword.trim();
    if (!trimmed) return false;
    const user = this.getUserPreferences();
    if (!user.excludedKeywords.includes(trimmed)) {
      user.excludedKeywords.push(trimmed);
      this.updateUserPreferences(user);
      return true;
    }
    return false;
  }

  removeExcludedKeyword(keyword: string): boolean {
    const user = this.getUserPreferences();
    user.excludedKeywords = user.excludedKeywords.filter((k) => k !== keyword);
    this.updateUserPreferences(user);
    return true;
  }

  // ==================== 2. ARTICLES ====================

  saveArticle(article: ArticleDocument): void {
    this.state.articles[article.id] = article;
    this.saveToStorage();
  }

  getArticles(): ArticleDocument[] {
    return Object.values(this.state.articles);
  }

  // ==================== 3. BRIEFINGS ====================

  saveBriefing(briefing: BriefingDocument): void {
    this.state.briefings[briefing.id] = briefing;
    this.saveToStorage();
  }

  getBriefing(id: string): BriefingDocument | undefined {
    return this.state.briefings[id];
  }

  // ==================== 4. AUDIO ====================

  saveAudio(audio: AudioDocument): void {
    this.state.audio[audio.id] = audio;
    this.saveToStorage();
  }

  getAudioByBriefing(briefingId: string): AudioDocument[] {
    return Object.values(this.state.audio).filter((a) => a.briefingId === briefingId);
  }

  // ==================== 5. FEEDBACK ====================

  saveFeedback(articleId: string, feedbackType: 'useful' | 'not_interested'): FeedbackDocument {
    const id = `fb_${articleId}_${Date.now()}`;
    const record: FeedbackDocument = {
      id,
      articleId,
      feedbackType,
      inputDate: new Date().toISOString(),
    };
    this.state.feedback[id] = record;
    this.saveToStorage();
    return record;
  }

  getFeedbackForArticle(articleId: string): FeedbackDocument | undefined {
    return Object.values(this.state.feedback).find((fb) => fb.articleId === articleId);
  }

  // ==================== 6. PLAYBACK HISTORY ====================

  savePlaybackProgress(briefingId: string, lastPositionSec: number, lastSegmentIndex: number, isCompleted: boolean): PlaybackHistoryDocument {
    const id = `hist_${briefingId}`;
    const record: PlaybackHistoryDocument = {
      id,
      briefingId,
      lastPositionSec,
      lastSegmentIndex,
      isCompleted,
      updatedAt: new Date().toISOString(),
    };
    this.state.playback_history[id] = record;
    this.saveToStorage();
    return record;
  }

  getPlaybackHistory(briefingId: string): PlaybackHistoryDocument | undefined {
    return this.state.playback_history[`hist_${briefingId}`];
  }

  getAllPlaybackHistory(): PlaybackHistoryDocument[] {
    return Object.values(this.state.playback_history);
  }

  // ==================== 7. DIAGNOSTICS & RESET ====================

  getConnectionStatus() {
    return this.state.connectionStatus;
  }

  resetToDefaults(): UserDocument {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadFromStorage();
    return this.getUserPreferences();
  }
}

export const databaseService = new DatabaseService();
