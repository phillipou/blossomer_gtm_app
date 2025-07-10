/**
 * DraftManager - Centralized localStorage management for draft entities
 * 
 * Handles draft storage, retrieval, and cleanup for all AI-generated entities
 * in the Blossomer GTM application.
 */

export type EntityType = 'company' | 'account' | 'persona' | 'campaign';

export interface DraftEntity {
  id?: string;
  tempId: string;
  entityType: EntityType;
  data: any;
  createdAt: string;
  parentId?: string; // For accounts -> company, personas -> account, campaigns -> persona
}

export class DraftManager {
  private static readonly DRAFT_PREFIX = 'draft_';
  private static readonly DRAFT_LIST_KEY = 'draft_entities_list';

  /**
   * Save a draft entity to localStorage
   */
  static saveDraft(entityType: EntityType, data: any, parentId?: string): string {
    const tempId = `temp_${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const draft: DraftEntity = {
      tempId,
      entityType,
      data,
      createdAt: new Date().toISOString(),
      parentId,
    };

    const key = `${this.DRAFT_PREFIX}${entityType}_${tempId}`;
    localStorage.setItem(key, JSON.stringify(draft));
    
    // Update the draft list for easier tracking
    this.addToDraftList(tempId, entityType);
    
    console.log(`DraftManager: Saved draft ${entityType} with tempId: ${tempId}`);
    return tempId;
  }

  /**
   * Get a specific draft by tempId
   */
  static getDraft(entityType: EntityType, tempId: string): DraftEntity | null {
    const key = `${this.DRAFT_PREFIX}${entityType}_${tempId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as DraftEntity;
    } catch (error) {
      console.error(`DraftManager: Failed to parse draft ${key}:`, error);
      this.removeDraft(entityType, tempId);
      return null;
    }
  }

  /**
   * Get all drafts for a specific entity type
   */
  static getDrafts(entityType: EntityType): DraftEntity[] {
    const draftList = this.getDraftList();
    const drafts: DraftEntity[] = [];

    for (const entry of draftList) {
      if (entry.entityType === entityType) {
        const draft = this.getDraft(entityType, entry.tempId);
        if (draft) {
          drafts.push(draft);
        }
      }
    }

    return drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all drafts for a specific parent (e.g., all account drafts for a company)
   */
  static getDraftsByParent(entityType: EntityType, parentId: string): DraftEntity[] {
    return this.getDrafts(entityType).filter(draft => draft.parentId === parentId);
  }

  /**
   * Remove a specific draft
   */
  static removeDraft(entityType: EntityType, tempId: string): void {
    const key = `${this.DRAFT_PREFIX}${entityType}_${tempId}`;
    localStorage.removeItem(key);
    this.removeFromDraftList(tempId);
    console.log(`DraftManager: Removed draft ${entityType} with tempId: ${tempId}`);
  }

  /**
   * Check if a draft exists
   */
  static hasDraft(entityType: EntityType, tempId: string): boolean {
    const key = `${this.DRAFT_PREFIX}${entityType}_${tempId}`;
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get total draft count for an entity type
   */
  static getDraftCount(entityType: EntityType): number {
    return this.getDrafts(entityType).length;
  }

  /**
   * Clean up old drafts (older than specified days)
   */
  static cleanupOldDrafts(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const draftList = this.getDraftList();
    let removedCount = 0;

    for (const entry of draftList) {
      const draft = this.getDraft(entry.entityType, entry.tempId);
      if (draft && new Date(draft.createdAt) < cutoffDate) {
        this.removeDraft(entry.entityType, entry.tempId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`DraftManager: Cleaned up ${removedCount} old drafts`);
    }
  }

  /**
   * Clear all drafts (use with caution)
   */
  static clearAllDrafts(): void {
    const draftList = this.getDraftList();
    
    for (const entry of draftList) {
      this.removeDraft(entry.entityType, entry.tempId);
    }

    localStorage.removeItem(this.DRAFT_LIST_KEY);
    console.log('DraftManager: Cleared all drafts');
  }


  /**
   * Private methods for managing the draft list
   */
  private static getDraftList(): Array<{ tempId: string; entityType: EntityType }> {
    const stored = localStorage.getItem(this.DRAFT_LIST_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('DraftManager: Failed to parse draft list:', error);
      localStorage.removeItem(this.DRAFT_LIST_KEY);
      return [];
    }
  }

  private static addToDraftList(tempId: string, entityType: EntityType): void {
    const draftList = this.getDraftList();
    draftList.push({ tempId, entityType });
    localStorage.setItem(this.DRAFT_LIST_KEY, JSON.stringify(draftList));
  }

  private static removeFromDraftList(tempId: string): void {
    const draftList = this.getDraftList();
    const filtered = draftList.filter(entry => entry.tempId !== tempId);
    localStorage.setItem(this.DRAFT_LIST_KEY, JSON.stringify(filtered));
  }
}

// Auto-cleanup on page load (optional)
if (typeof window !== 'undefined') {
  // Run cleanup once when the module loads
  setTimeout(() => {
    DraftManager.cleanupOldDrafts();
  }, 1000);
}