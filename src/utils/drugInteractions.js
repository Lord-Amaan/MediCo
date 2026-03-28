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
  const meds = (medications || [])
    .map((med) => (med?.name || '').toLowerCase())
    .filter(Boolean);

  const allergyList = (allergies || [])
    .map((allergy) => String(allergy || '').toLowerCase())
    .filter(Boolean);

  const conflicts = [];

  interactions.forEach((entry) => {
    const drug1Lower = entry.drug1.toLowerCase();
    const drug2Lower = entry.drug2 ? entry.drug2.toLowerCase() : null;
    const allergyLower = entry.allergy ? entry.allergy.toLowerCase() : null;

    if (entry.drug2) {
      const hasDrug1 = meds.some((med) => med.includes(drug1Lower));
      const hasDrug2 = meds.some((med) => med.includes(drug2Lower));

      if (hasDrug1 && hasDrug2) {
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

      if (hasDrug && hasAllergy) {
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

  return conflicts;
}

module.exports = { checkInteractionsOffline };
