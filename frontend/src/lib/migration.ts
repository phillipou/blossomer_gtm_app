import { getStoredTargetAccounts } from './accountService';
import { createAccount } from './accountService';
import { createPersona } from './personaService';
import { createCampaign } from './campaignService';

export async function migrateLocalStorageToDb(token: string) {
  const accounts = getStoredTargetAccounts();
  for (const account of accounts) {
    const { id, companyId, name, accountData, personas = [], campaigns = [] } = account;
    // createAccount expects (companyId, { name, accountData }, token)
    const newAccount = await createAccount(companyId, { name, accountData }, token).catch(e => console.error("Failed to migrate account", e));
    if (newAccount && Array.isArray(personas)) {
      for (const persona of personas) {
        // createPersona expects (accountId, personaData, token)
        await createPersona(newAccount.id, persona, token).catch(e => console.error("Failed to migrate persona", e));
      }
    }
    if (newAccount && Array.isArray(campaigns)) {
      for (const campaign of campaigns) {
        // createCampaign expects (campaignData, token), add accountId to campaignData if needed
        await createCampaign({ ...campaign, accountId: newAccount.id }, token).catch(e => console.error("Failed to migrate campaign", e));
      }
    }
  }
}
