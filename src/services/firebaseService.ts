/**
 * Firebase 및 분산 데이터베이스 연동 어댑터
 *
 * 개발 원칙 준수:
 * 1. 클라우드 Firestore 연결이 설정되지 않거나 거부된 경우에도 앱이 중단되지 않고
 *    로컬 영구 데이터베이스(databaseService)를 통해 데이터가 안정적으로 지속됩니다.
 * 2. API 키는 브라우저 코드에 포함되지 않으며, 서버 격리 환경을 사용합니다.
 */

import { databaseService } from './databaseService';
import {
  UserDocument,
  ArticleDocument,
  BriefingDocument,
  AudioDocument,
  FeedbackDocument,
  PlaybackHistoryDocument,
} from '../types';

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  engine: 'cloud-firestore' | 'local-persistent-store';
  currentUserId: string;
  message: string;
  lastSyncedAt: string;
}

class FirebaseService {
  /**
   * 데이터베이스 설정 상태 검사
   */
  getStatus(): FirebaseConfigStatus {
    const status = databaseService.getConnectionStatus();
    return {
      isConfigured: false, // 클라우드 Firebase는 미연결(사용자 거부 또는 미설정)
      engine: 'local-persistent-store',
      currentUserId: 'local_guest_user',
      message: '로컬 영구 데이터베이스 정상 가동 (새로고침 후 자동 복원)',
      lastSyncedAt: status.lastSyncedAt,
    };
  }

  // User Preferences
  async getUserPreferences(): Promise<UserDocument> {
    try {
      return Promise.resolve(databaseService.getUserPreferences());
    } catch (err) {
      console.warn('[FirebaseService] Fallback to default user preferences:', err);
      return Promise.resolve(databaseService.resetToDefaults());
    }
  }

  async saveUserPreferences(prefs: Partial<UserDocument>): Promise<UserDocument> {
    try {
      return Promise.resolve(databaseService.updateUserPreferences(prefs));
    } catch (err) {
      console.error('[FirebaseService] Failed to save user preferences:', err);
      throw err;
    }
  }

  // Articles
  async saveArticle(article: ArticleDocument): Promise<void> {
    databaseService.saveArticle(article);
    return Promise.resolve();
  }

  async getArticles(): Promise<ArticleDocument[]> {
    return Promise.resolve(databaseService.getArticles());
  }

  // Briefings
  async saveBriefing(briefing: BriefingDocument): Promise<void> {
    databaseService.saveBriefing(briefing);
    return Promise.resolve();
  }

  async getBriefing(id: string): Promise<BriefingDocument | undefined> {
    return Promise.resolve(databaseService.getBriefing(id));
  }

  // Audio Segments
  async saveAudio(audio: AudioDocument): Promise<void> {
    databaseService.saveAudio(audio);
    return Promise.resolve();
  }

  async getAudioByBriefing(briefingId: string): Promise<AudioDocument[]> {
    return Promise.resolve(databaseService.getAudioByBriefing(briefingId));
  }

  // Feedback (유용해요 / 관심 없어요)
  async saveFeedback(articleId: string, type: 'useful' | 'not_interested'): Promise<FeedbackDocument> {
    return Promise.resolve(databaseService.saveFeedback(articleId, type));
  }

  // Playback History (재생 위치 저장 및 이어듣기 복원)
  async savePlaybackProgress(
    briefingId: string,
    lastPositionSec: number,
    lastSegmentIndex: number,
    isCompleted: boolean
  ): Promise<PlaybackHistoryDocument> {
    return Promise.resolve(
      databaseService.savePlaybackProgress(briefingId, lastPositionSec, lastSegmentIndex, isCompleted)
    );
  }

  async getPlaybackProgress(briefingId: string): Promise<PlaybackHistoryDocument | undefined> {
    return Promise.resolve(databaseService.getPlaybackHistory(briefingId));
  }
}

export const firebaseService = new FirebaseService();
