import { DraftManager } from './draftManager';
import { getAllPersonas } from './personaService';
import { getAccounts } from './accountService';
import { normalizePersonaResponse } from './personaService';
import { normalizeAccountResponse } from './accountService';

/**
 * Central data synchronization service
 * Syncs API data to DraftManager for universal component access
 */
export class DataSyncService {
  /**
   * Sync all data for a company to DraftManager
   * This is the main entry point for authenticated users
   */
  static async syncAllDataToDraftManager(companyId: string, token: string): Promise<void> {
    console.log('[DATA-SYNC] Starting full data sync for company:', companyId);
    
    try {
      // Sync in parallel for better performance
      await Promise.all([
        this.syncAccounts(companyId, token),
        this.syncPersonas(companyId, token),
        // Add more sync operations as needed
        // this.syncCampaigns(companyId, token),
      ]);
      
      console.log('[DATA-SYNC] Full data sync completed successfully');
    } catch (error) {
      console.error('[DATA-SYNC] Full data sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync accounts from API to DraftManager
   */
  static async syncAccounts(companyId: string, token: string): Promise<void> {
    try {
      console.log('[DATA-SYNC] Syncing accounts for company:', companyId);
      
      const accounts = await getAccounts(companyId, token);
      
      if (accounts && accounts.length > 0) {
        // Clear existing API accounts to prevent duplicates
        this.clearExistingAPIEntities('account');
        
        accounts.forEach(account => {
          const normalizedAccount = normalizeAccountResponse(account);
          DraftManager.saveDraft('account', normalizedAccount);
          
          console.log('[DATA-SYNC] Synced account:', {
            accountId: normalizedAccount.id,
            name: normalizedAccount.name || normalizedAccount.targetAccountName,
            hasData: !!normalizedAccount.data
          });
        });
        
        console.log(`[DATA-SYNC] Synced ${accounts.length} accounts to DraftManager`);
      } else {
        console.log('[DATA-SYNC] No accounts found for company');
      }
    } catch (error) {
      console.error('[DATA-SYNC] Failed to sync accounts:', error);
      throw error;
    }
  }

  /**
   * Sync personas from API to DraftManager
   */
  static async syncPersonas(companyId: string, token: string): Promise<void> {
    try {
      console.log('[DATA-SYNC] Syncing personas for company:', companyId);
      
      const personas = await getAllPersonas(companyId, token);
      
      if (personas && personas.length > 0) {
        // Clear existing API personas to prevent duplicates
        this.clearExistingAPIEntities('persona');
        
        personas.forEach(persona => {
          const accountId = persona.accountId || persona.account_id;
          if (accountId) {
            const normalizedPersona = normalizePersonaResponse(persona);
            DraftManager.saveDraft('persona', normalizedPersona, accountId);
            
            console.log('[DATA-SYNC] Synced persona:', {
              personaId: normalizedPersona.id,
              accountId,
              name: normalizedPersona.targetPersonaName || normalizedPersona.name,
              hasUseCases: !!(normalizedPersona.useCases && normalizedPersona.useCases.length > 0),
              useCasesCount: normalizedPersona.useCases?.length || 0
            });
          }
        });
        
        console.log(`[DATA-SYNC] Synced ${personas.length} personas to DraftManager`);
      } else {
        console.log('[DATA-SYNC] No personas found for company');
      }
    } catch (error) {
      console.error('[DATA-SYNC] Failed to sync personas:', error);
      throw error;
    }
  }

  /**
   * Clear existing API entities from DraftManager to prevent duplicates
   * Only removes entities with real API IDs (not temp_ IDs)
   */
  private static clearExistingAPIEntities(entityType: 'account' | 'persona' | 'campaign'): void {
    const existingDrafts = DraftManager.getDrafts(entityType);
    
    existingDrafts.forEach(draft => {
      // Remove entities that have real API IDs (not temp IDs) to prevent duplicates
      if (draft.data && draft.data.id && !draft.data.id.startsWith('temp_')) {
        console.log(`[DATA-SYNC] Removing existing API ${entityType} draft to prevent duplicate:`, draft.data.id);
        DraftManager.removeDraft(entityType, draft.tempId);
      }
    });
  }

  /**
   * Force refresh all data (useful for periodic updates)
   */
  static async refreshAllData(companyId: string, token: string): Promise<void> {
    console.log('[DATA-SYNC] Force refreshing all data');
    await this.syncAllDataToDraftManager(companyId, token);
  }

  /**
   * Get sync status information
   */
  static getSyncStatus() {
    const accounts = DraftManager.getDrafts('account');
    const personas = DraftManager.getDrafts('persona');
    const campaigns = DraftManager.getDrafts('campaign');
    
    return {
      accounts: {
        total: accounts.length,
        api: accounts.filter(d => d.data.id && !d.data.id.startsWith('temp_')).length,
        drafts: accounts.filter(d => !d.data.id || d.data.id.startsWith('temp_')).length
      },
      personas: {
        total: personas.length,
        api: personas.filter(d => d.data.id && !d.data.id.startsWith('temp_')).length,
        drafts: personas.filter(d => !d.data.id || d.data.id.startsWith('temp_')).length
      },
      campaigns: {
        total: campaigns.length,
        api: campaigns.filter(d => d.data.id && !d.data.id.startsWith('temp_')).length,
        drafts: campaigns.filter(d => !d.data.id || d.data.id.startsWith('temp_')).length
      }
    };
  }
}