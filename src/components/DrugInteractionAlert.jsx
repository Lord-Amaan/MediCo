import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

export default function DrugInteractionAlert({
  visible,
  conflicts,
  hasCritical,
  onGoBack,
  onContinue,
  aiUsed,
}) {
  const criticalConflicts = (conflicts || []).filter((item) => item.risk === 'Critical');
  const warningConflicts = (conflicts || []).filter((item) => item.risk === 'Warning');

  const renderInvolvedText = (conflict) => {
    if (conflict.involved) return conflict.involved;
    if (conflict.type === 'Drug-Drug') return `${conflict.drug1} + ${conflict.drug2}`;
    return `${conflict.drug1} + ${conflict.allergy} allergy`;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="mr-2 text-2xl">⚠</Text>
              <Text className={`text-lg font-bold ${hasCritical ? 'text-red-600' : 'text-amber-600'}`}>
                {hasCritical ? 'Critical Conflicts Found' : 'Warnings Found'}
              </Text>
            </View>
            {aiUsed ? (
              <View className="rounded-full bg-green-100 px-3 py-1">
                <Text className="text-xs font-semibold text-green-700">AI Verified</Text>
              </View>
            ) : null}
          </View>

          <Text className="mb-3 text-sm text-gray-500">Review before proceeding with transfer</Text>

          <View className="mb-4 h-px bg-gray-200" />

          <ScrollView className="mb-4" style={{ maxHeight: 320 }}>
            {criticalConflicts.map((conflict, index) => (
              <View
                key={`critical-${index}`}
                className="mb-3 rounded-xl border p-3"
                style={{ backgroundColor: '#FCEBEB', borderColor: '#E24B4A' }}
              >
                <Text className="mb-1 font-bold text-red-600">CRITICAL</Text>
                <Text className="mb-1 text-sm font-semibold text-gray-800">
                  {conflict.type === 'Drug-Drug' ? 'Drug-Drug Interaction' : 'Allergy Conflict'}
                </Text>
                <Text className="mb-1 text-sm text-gray-700">Involved: {renderInvolvedText(conflict)}</Text>
                <Text className="mb-1 text-sm text-gray-700">Reason: {conflict.reason}</Text>
                {conflict.recommendation ? (
                  <Text className="text-sm italic text-gray-700">Recommendation: {conflict.recommendation}</Text>
                ) : null}
              </View>
            ))}

            {warningConflicts.map((conflict, index) => (
              <View
                key={`warning-${index}`}
                className="mb-3 rounded-xl border p-3"
                style={{ backgroundColor: '#FAEEDA', borderColor: '#BA7517' }}
              >
                <Text className="mb-1 font-bold" style={{ color: '#BA7517' }}>WARNING</Text>
                <Text className="mb-1 text-sm font-semibold text-gray-800">
                  {conflict.type === 'Drug-Drug' ? 'Drug-Drug Interaction' : 'Allergy Conflict'}
                </Text>
                <Text className="mb-1 text-sm text-gray-700">Involved: {renderInvolvedText(conflict)}</Text>
                <Text className="mb-1 text-sm text-gray-700">Reason: {conflict.reason}</Text>
                {conflict.recommendation ? (
                  <Text className="text-sm italic text-gray-700">Recommendation: {conflict.recommendation}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            className="mb-3 w-full rounded-xl px-4 py-4"
            style={{ backgroundColor: '#E24B4A' }}
            onPress={onGoBack}
          >
            <Text className="text-center font-bold text-white">Go Back and Edit Medications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`w-full rounded-xl px-4 py-4 ${hasCritical ? 'border-2 bg-white' : 'bg-gray-200'}`}
            style={hasCritical ? { borderColor: '#E24B4A' } : undefined}
            onPress={onContinue}
          >
            <Text className={`text-center font-bold ${hasCritical ? 'text-red-600' : 'text-gray-700'}`}>
              {hasCritical ? 'Override and Continue (Not Recommended)' : 'I Acknowledge — Continue Transfer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
