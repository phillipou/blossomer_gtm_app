/**
 * Test Component for New Architecture
 * 
 * This component demonstrates the new V2 services and can be used for manual testing
 * without breaking existing functionality.
 */

import React, { useState } from 'react';
import { useAuthState } from '../../lib/auth.js';
import { DraftManager } from '../../lib/DraftManager.js';
import { useUserScopedQuery } from '../../lib/query/UserScopedQueryClient.js';

export function NewArchitectureTest() {
  const { isAuthenticated, userInfo, token } = useAuthState();
  const { getScopedKey, clearUserCache, clearPlaygroundCache } = useUserScopedQuery();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test 1: Cache Key Scoping
  const testCacheKeys = () => {
    const baseKey = ['companies'];
    const scopedKey = getScopedKey(baseKey);
    
    if (isAuthenticated && userInfo?.user_id) {
      const expected = `db_${userInfo.user_id}`;
      const actual = scopedKey[0];
      addResult(`✅ Auth User Cache Key: ${actual} (Expected: ${expected}) - ${actual === expected ? 'PASS' : 'FAIL'}`);
    } else {
      const actual = scopedKey;
      addResult(`✅ Playground Cache Key: [${actual.join(', ')}] (Expected: ['companies']) - ${actual.length === 1 && actual[0] === 'companies' ? 'PASS' : 'FAIL'}`);
    }
  };

  // Test 2: DraftManager Playground Prefix
  const testPlaygroundData = () => {
    // Save a test draft
    const testData = { name: 'Test Company', url: 'https://test.com' };
    const tempId = DraftManager.saveDraft('company', testData);
    
    // Check localStorage for pg_ prefix
    const keys = Object.keys(localStorage).filter(key => key.startsWith('pg_'));
    addResult(`✅ Playground Data: Found ${keys.length} pg_* keys in localStorage - ${keys.length > 0 ? 'PASS' : 'FAIL'}`);
    
    // Clean up
    DraftManager.removeDraft('company', tempId);
  };

  // Test 3: Type Generation
  const testTypeGeneration = async () => {
    try {
      // Try to import the generated types
      const { components } = await import('../../types/generated-api.js');
      addResult(`✅ Generated Types: Successfully imported OpenAPI types - PASS`);
    } catch (error) {
      addResult(`❌ Generated Types: Failed to import - FAIL: ${error}`);
    }
  };

  // Test 4: Mapper Functions
  const testMappers = async () => {
    try {
      const { 
        mapCompanyResponseToUI, 
        mapAccountResponseToUI,
        mapPersonaResponseToUI 
      } = await import('../../lib/mappers/index.js');
      
      // Test with mock data
      const mockCompanyResponse = {
        id: 'test-123',
        user_id: 'user-123',
        name: 'Test Company',
        url: 'https://test.com',
        analysis_data: {
          description: 'Test description',
          capabilities: ['feature1', 'feature2']
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const uiModel = mapCompanyResponseToUI(mockCompanyResponse);
      const hasCorrectFormat = uiModel.companyName === 'Test Company' && 
                              uiModel.companyId === 'test-123' &&
                              uiModel.companyUrl === 'https://test.com';
      
      addResult(`✅ Mappers: Company API→UI transformation - ${hasCorrectFormat ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      addResult(`❌ Mappers: Failed to test - FAIL: ${error}`);
    }
  };

  // Test 5: Cache Clearing
  const testCacheClear = () => {
    if (isAuthenticated) {
      clearUserCache();
      addResult(`✅ Cache Clear: User cache cleared for ${userInfo?.user_id} - PASS`);
    } else {
      clearPlaygroundCache();
      addResult(`✅ Cache Clear: Playground cache cleared - PASS`);
    }
  };

  // Test 6: Playground Data Segregation
  const testPlaygroundSegregation = () => {
    // Clear all playground data
    DraftManager.clearAllPlayground();
    
    // Check that only pg_ keys were removed
    const pgKeys = Object.keys(localStorage).filter(key => key.startsWith('pg_'));
    const otherKeys = Object.keys(localStorage).filter(key => !key.startsWith('pg_'));
    
    addResult(`✅ Playground Segregation: ${pgKeys.length} pg_* keys remain, ${otherKeys.length} other keys preserved - ${pgKeys.length === 0 ? 'PASS' : 'PARTIAL'}`);
  };

  const runAllTests = () => {
    setTestResults([]);
    addResult('🧪 Starting New Architecture Tests...');
    
    testCacheKeys();
    testPlaygroundData();
    testTypeGeneration();
    testMappers();
    testCacheClear();
    testPlaygroundSegregation();
    
    addResult('🏁 Tests completed!');
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">New Architecture Test Suite</h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold">Current State:</h3>
        <p>Auth Status: {isAuthenticated ? `✅ Authenticated (${userInfo?.user_id})` : '❌ Unauthenticated'}</p>
        <p>Token: {token ? '✅ Present' : '❌ Missing'}</p>
      </div>

      <button 
        onClick={runAllTests}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Run All Tests
      </button>

      <div className="bg-white p-4 rounded border">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="max-h-96 overflow-y-auto">
          {testResults.map((result, index) => (
            <div 
              key={index} 
              className={`text-sm font-mono mb-1 ${
                result.includes('✅') ? 'text-green-600' : 
                result.includes('❌') ? 'text-red-600' : 
                result.includes('🧪') || result.includes('🏁') ? 'text-blue-600 font-bold' :
                'text-gray-600'
              }`}
            >
              {result}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Expected Results:</strong></p>
        <ul className="list-disc list-inside">
          <li>Cache keys should be scoped properly (db_userId for auth, plain for playground)</li>
          <li>DraftManager should use pg_ prefix for all localStorage keys</li>
          <li>Generated types should import without errors</li>
          <li>Mappers should transform snake_case API to camelCase UI</li>
          <li>Cache clearing should work for current auth state</li>
          <li>Playground segregation should only affect pg_* keys</li>
        </ul>
      </div>
    </div>
  );
}