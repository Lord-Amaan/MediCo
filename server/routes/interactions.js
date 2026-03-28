const express = require('express');
const { checkInteractionsOffline } = require('../utils/drugInteractions');
const { checkInteractionsAI, getLastAIStatus } = require('../utils/checkInteractionsAI');

const router = express.Router();

router.post('/check-interactions', async (req, res) => {
  try {
    const { medications, allergies } = req.body || {};
    console.log('[InteractionRoute] /check-interactions called');
    console.log('[InteractionRoute] Incoming medications:', JSON.stringify(medications || []));
    console.log('[InteractionRoute] Incoming allergies:', JSON.stringify(allergies || []));

    if (!Array.isArray(medications) || !Array.isArray(allergies)) {
      console.log('[InteractionRoute] Validation failed: medications/allergies missing or invalid');
      return res.status(400).json({ error: 'medications and allergies are required' });
    }

    const offlineConflicts = checkInteractionsOffline(medications, allergies);
    console.log(`[InteractionRoute] Offline conflicts count: ${offlineConflicts.length}`);

    let aiConflicts = [];
    let aiUsed = false;

    try {
      aiConflicts = await checkInteractionsAI(medications, allergies);
      aiUsed = Array.isArray(aiConflicts) && aiConflicts.length > 0;
      console.log(`[InteractionRoute] AI conflicts count: ${(aiConflicts || []).length}`);
    } catch (aiError) {
      aiConflicts = [];
      aiUsed = false;
      console.log('[InteractionRoute] AI check failed, fallback to offline only:', aiError.message);
    }

    const offlineDrugNames = new Set();
    offlineConflicts.forEach((conflict) => {
      if (conflict.drug1) offlineDrugNames.add(String(conflict.drug1).toLowerCase());
      if (conflict.drug2) offlineDrugNames.add(String(conflict.drug2).toLowerCase());
    });

    const uniqueAIConflicts = (aiConflicts || []).filter((aiConflict) => {
      const involved = String(aiConflict?.involved || '').toLowerCase();
      for (const drug of offlineDrugNames) {
        if (involved.includes(drug)) {
          console.log(`[InteractionRoute] AI conflict skipped (duplicate by drug match): ${involved}`);
          return false;
        }
      }
      return true;
    });

    const mergedConflicts = [...offlineConflicts, ...uniqueAIConflicts];
    const hasCritical = mergedConflicts.some((conflict) => conflict.risk === 'Critical');
    const hasWarnings = mergedConflicts.some((conflict) => conflict.risk === 'Warning');
    const aiStatus = getLastAIStatus();
    console.log(`[InteractionRoute] Unique AI conflicts count: ${uniqueAIConflicts.length}`);
    console.log(`[InteractionRoute] Merged conflicts count: ${mergedConflicts.length}`);
    console.log(`[InteractionRoute] hasCritical=${hasCritical}, hasWarnings=${hasWarnings}, aiUsed=${aiUsed}`);
    console.log(`[InteractionRoute] aiStatus=${aiStatus.status}`);

    return res.json({
      success: true,
      conflicts: mergedConflicts,
      hasCritical,
      hasWarnings,
      totalFound: mergedConflicts.length,
      aiUsed,
      aiStatus,
      message: mergedConflicts.length > 0 ? `${mergedConflicts.length} conflict(s) found` : 'No conflicts detected',
    });
  } catch (error) {
    console.log('[InteractionRoute] Route error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
