/**
 * 출근 브리핑 2.0 타입 정의
 * 취업 준비생을 위한 30분 맞춤형 산업 오디오 브리핑
 */

export type IndustryCategoryId =
  | 'steel-metal'
  | 'auto-mobility'
  | 'defense-aerospace'
  | 'semiconductor'
  | 'battery-energy'
  | 'smart-factory-ai'
  | 'shipbuilding-marine'
  | 'qa-qc'
  | 'production-process'
  | 'chemical-petro'
  | 'materials-supply-chain'
  | 'policy-economy'
  | 'earnings-investment'
  | 'hiring-trends'
  | 'esg-carbon';

export interface IndustryCategory {
  id: IndustryCategoryId;
  name: string; // 철강·금속, 반도체 등 요구사항 15종
  englishName: string;
  icon: string;
  description: string;
  focusKeywords: string[];
  recentIssuesCount: number;
  featuredCompanies: string[];
  keyIssues: {
    id: string;
    title: string;
    summary: string;
    interviewCheckPoint: string;
  }[];
  briefingSample: {
    title: string;
    duration: string;
    narrator: string;
  };
}

export interface BriefingChapter {
  id: string;
  title: string;
  durationSec: number;
  summary: string;
  keyTerm?: string;
}

export type BriefingType = 'morning' | 'evening' | 'industry_focus';

export interface BriefingItem {
  id: string;
  type: BriefingType;
  title: string;
  subtitle: string;
  targetCommuteMinutes: number; // 약 30분
  date: string;
  scheduledTime: string; // e.g. "07:30 AM" or "18:30 PM"
  narratorName: string;
  categoryTags: string[];
  chapters: BriefingChapter[];
  totalDurationSec: number;
  isAvailable: boolean;
  statusBadge: string; // e.g. "오늘 아침 완성", "저녁 6시 오픈 예정"
  highlightNotes: string[];
}

export interface IndustryNewsItem {
  id: string;
  categoryId: IndustryCategoryId;
  categoryName: string;
  title: string;
  companyName: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  jobSeekerTakeaway: string; // 취준생 면접/서류 작성 시 활용 포인트
  sourceName: string;
  isHot?: boolean;
}

export interface TargetCompany {
  id: string;
  name: string;
  industryCategory: string;
  industryId: IndustryCategoryId;
  headquarters: string;
  hiringStatus: '채용중' | '상반기 공채 예정' | '수시채용' | '모니터링';
  recentNewsCount: number;
  keyPoints: string[];
  isBookmarked: boolean;
  latestNews: {
    title: string;
    date: string;
    topic: string;
  }[];
}

export interface AudioPlayState {
  currentBriefing: BriefingItem | null;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  playbackSpeed: number;
  currentChapterIndex: number;
  isMinimized: boolean;
}

export type NavTab = 'home' | 'explore' | 'library' | 'companies' | 'settings';

/**
 * 2단계 Firestore 및 데이터베이스 정규 스키마 정의
 */

// 1. users
export interface UserDocument {
  id: string;
  interestedIndustries: string[]; // 관심 산업 (15개 카테고리 중 선택 및 추가)
  industryWeights: Record<string, number>; // 산업별 중요도 (1~5)
  interestedCompanies: string[]; // 관심 기업
  interestedJobs: string[]; // 관심 직무 (생산기술, 품질관리, 공정개발 등)
  interestedKeywords: string[]; // 관심 키워드
  excludedKeywords: string[]; // 제외 키워드
  voiceSettings: {
    provider: 'local-tts' | 'google-cloud-tts' | 'elevenlabs';
    voiceName: string;
    pitch: number;
    rate: number;
  };
  playbackSpeed: number; // 재생 속도 (0.8, 1.0, 1.2, 1.5)
  morningCommuteTime: string; // "07:30"
  eveningCommuteTime: string; // "18:30"
  updatedAt: string;
}

// 2. articles
export interface ArticleDocument {
  id: string;
  title: string; // 기사 제목
  publisher: string; // 언론사
  date: string; // 날짜
  originUrl: string; // 원문 URL
  description: string; // 설명
  industryCategory: string; // 산업 카테고리
  relatedCompany: string; // 관련 기업
  duplicateGroupId: string; // 중복 그룹 ID
  collectedAt: string; // 수집 시각
  jobSeekerTakeaway?: string; // 취준생 면접 포인트
}

// 3. briefings
export interface BriefingDocument {
  id: string;
  date: string; // 브리핑 날짜 (YYYY-MM-DD)
  type: 'morning' | 'evening'; // 출근 또는 퇴근 유형
  title: string; // 브리핑 제목
  fullScript: string; // 전체 대본
  status: 'pending' | 'generating' | 'completed' | 'failed'; // 생성 상태
  actualAudioDurationSec: number; // 실제 음성 재생 시간
  articleIds: string[]; // 기사 ID 목록
  createdAt: string;
}

// 4. audio
export interface AudioDocument {
  id: string;
  briefingId: string; // 브리핑 ID
  segmentNumber: number; // 구간 번호
  filePath: string; // 음성 파일 경로
  status: 'pending' | 'ready' | 'failed'; // 파일 생성 상태
  audioDurationSec: number; // 음성 재생 시간
  createdAt: string;
}

// 5. feedback
export interface FeedbackDocument {
  id: string;
  articleId: string; // 기사 ID
  feedbackType: 'useful' | 'not_interested'; // '유용해요' 또는 '관심 없어요'
  inputDate: string; // 입력 날짜 (ISO string)
}

// 6. playback_history
export interface PlaybackHistoryDocument {
  id: string;
  briefingId: string; // 브리핑 ID
  lastPositionSec: number; // 마지막 재생 위치
  lastSegmentIndex: number; // 마지막 재생 구간
  isCompleted: boolean; // 재생 완료 여부
  updatedAt: string; // 갱신 시각
}
