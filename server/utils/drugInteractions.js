const interactions = [
  { drug1: 'Warfarin', drug2: 'Aspirin', allergy: null, risk: 'Critical', reason: 'Increased bleeding risk' },
  { drug1: 'Warfarin', drug2: 'Ibuprofen', allergy: null, risk: 'Critical', reason: 'Increased bleeding risk' },
  { drug1: 'Warfarin', drug2: 'Naproxen', allergy: null, risk: 'Critical', reason: 'Increased bleeding risk' },
  { drug1: 'Digoxin', drug2: 'Amiodarone', allergy: null, risk: 'Critical', reason: 'Digoxin toxicity risk' },
  { drug1: 'Metformin', drug2: 'Contrast', allergy: null, risk: 'Critical', reason: 'Lactic acidosis risk' },
  { drug1: 'Clopidogrel', drug2: 'Omeprazole', allergy: null, risk: 'Warning', reason: 'Reduced antiplatelet effect' },
  { drug1: 'ACE Inhibitor', drug2: 'Potassium', allergy: null, risk: 'Warning', reason: 'Hyperkalemia risk' },
  { drug1: 'Lithium', drug2: 'Ibuprofen', allergy: null, risk: 'Critical', reason: 'Lithium toxicity risk' },
  { drug1: 'Simvastatin', drug2: 'Amiodarone', allergy: null, risk: 'Warning', reason: 'Myopathy risk' },
  { drug1: 'Methotrexate', drug2: 'Aspirin', allergy: null, risk: 'Critical', reason: 'Methotrexate toxicity' },
  { drug1: 'Penicillin', drug2: null, allergy: 'Penicillin', risk: 'Critical', reason: 'Direct allergy match' },
  { drug1: 'Amoxicillin', drug2: null, allergy: 'Penicillin', risk: 'Critical', reason: 'Cross-reactive with Penicillin' },
  { drug1: 'Ibuprofen', drug2: null, allergy: 'NSAID', risk: 'Critical', reason: 'Direct allergy match' },
  { drug1: 'Aspirin', drug2: null, allergy: 'NSAID', risk: 'Critical', reason: 'Direct allergy match' },
  { drug1: 'Sulfamethoxazole', drug2: null, allergy: 'Sulfa', risk: 'Critical', reason: 'Direct allergy match' },
  { drug1: 'Codeine', drug2: null, allergy: 'Opioid', risk: 'Warning', reason: 'Cross-reactive opioid' },
  { drug1: 'Morphine', drug2: null, allergy: 'Opioid', risk: 'Critical', reason: 'Direct allergy match' },
  { drug1: 'Cephalexin', drug2: null, allergy: 'Penicillin', risk: 'Warning', reason: 'Possible cross-reactivity' },
];

function checkInteractionsOffline(medications, allergies) {
  console.log('[InteractionCheck] Offline check started');
  console.log('[InteractionCheck] Raw medications:', JSON.stringify(medications || []));
  console.log('[InteractionCheck] Raw allergies:', JSON.stringify(allergies || []));

  const meds = (medications || [])
    .map((med) => (med?.name || '').toLowerCase())
    .filter(Boolean);

  const allergyList = (allergies || [])
    .map((allergy) => String(allergy || '').toLowerCase())
    .filter(Boolean);

  console.log('[InteractionCheck] Normalized medications:', JSON.stringify(meds));
  console.log('[InteractionCheck] Normalized allergies:', JSON.stringify(allergyList));

  const conflicts = [];

  interactions.forEach((entry) => {
    const drug1Lower = entry.drug1.toLowerCase();
    const drug2Lower = entry.drug2 ? entry.drug2.toLowerCase() : null;
    const allergyLower = entry.allergy ? entry.allergy.toLowerCase() : null;

    if (entry.drug2) {
      const hasDrug1 = meds.some((med) => med.includes(drug1Lower));
      const hasDrug2 = meds.some((med) => med.includes(drug2Lower));

      if (hasDrug1 || hasDrug2) {
        console.log(
          `[InteractionCheck] Drug-Drug compare: ${entry.drug1} + ${entry.drug2} => hasDrug1=${hasDrug1}, hasDrug2=${hasDrug2}`
        );
      }

      if (hasDrug1 && hasDrug2) {
        console.log(`[InteractionCheck] Drug-Drug conflict matched: ${entry.drug1} + ${entry.drug2} (${entry.risk})`);
        conflicts.push({
          type: 'Drug-Drug',
          drug1: entry.drug1,
          drug2: entry.drug2,
          allergy: null,
          risk: entry.risk,
          reason: entry.reason,
        });
      }
    }

    if (entry.allergy) {
      const hasDrug = meds.some((med) => med.includes(drug1Lower));
      const hasAllergy = allergyList.some((allergy) => allergy.includes(allergyLower));

      if (hasDrug || hasAllergy) {
        console.log(
          `[InteractionCheck] Allergy-Drug compare: drug=${entry.drug1}, allergy=${entry.allergy} => hasDrug=${hasDrug}, hasAllergy=${hasAllergy}`
        );
      }

      if (hasDrug && hasAllergy) {
        console.log(`[InteractionCheck] Allergy-Drug conflict matched: ${entry.drug1} + ${entry.allergy} (${entry.risk})`);
        conflicts.push({
          type: 'Allergy-Drug',
          drug1: entry.drug1,
          drug2: null,
          allergy: entry.allergy,
          risk: entry.risk,
          reason: entry.reason,
        });
      }
    }
  });

  console.log(`[InteractionCheck] Offline check completed. Conflicts found: ${conflicts.length}`);
  console.log('[InteractionCheck] Conflicts:', JSON.stringify(conflicts));

  return conflicts;
}

module.exports = { checkInteractionsOffline };
