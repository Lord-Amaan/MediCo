import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

const FIELD_LABELS = {
  patientName: 'Patient Name',
  age: 'Age',
  gender: 'Gender',
  primaryDiagnosis: 'Primary Diagnosis',
  transferReason: 'Transfer Reason',
  allergies: 'Allergies',
  medications: 'Medications',
  sendingHospital: 'Sending Hospital',
  receivingHospital: 'Receiving Hospital',
  bp: 'Blood Pressure',
  pulse: 'Pulse',
  spo2: 'SpO2',
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const formatValue = (key, value) => {
  if (key === 'allergies' && Array.isArray(value)) {
    return value.join(', ');
  }

  if (key === 'medications' && Array.isArray(value)) {
    return value
      .map((med) => {
        if (!med || typeof med !== 'object') return '';
        return med.name || '';
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

export default function AutoFillPreview({ fields, onApply, onDismiss }) {
  const [selectedFields, setSelectedFields] = useState({});

  const detectedEntries = useMemo(() => {
    const safeFields = fields && typeof fields === 'object' ? fields : {};
    return Object.entries(safeFields).filter(([, value]) => hasValue(value));
  }, [fields]);

  useEffect(() => {
    const nextSelected = {};
    detectedEntries.forEach(([key, value]) => {
      nextSelected[key] = value;
    });
    setSelectedFields(nextSelected);
  }, [detectedEntries]);

  const selectedCount = Object.keys(selectedFields).length;

  const toggleField = (fieldKey, fieldValue) => {
    setSelectedFields((prev) => {
      if (prev[fieldKey] !== undefined) {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      }
      return {
        ...prev,
        [fieldKey]: fieldValue,
      };
    });
  };

  if (detectedEntries.length === 0) return null;

  return (
    <View className="mt-4 rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm">
      <View className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <Text className="text-sm font-bold text-emerald-900">
          Auto-fill detected - {detectedEntries.length} fields found
        </Text>
        <Text className="mt-1 text-xs text-emerald-700">
          Uncheck any fields you don't want to fill
        </Text>
      </View>

      <ScrollView className="max-h-52">
        {detectedEntries.map(([key, value]) => {
          const isSelected = selectedFields[key] !== undefined;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => toggleField(key, value)}
              className={`mb-2 flex-row items-center rounded-xl border p-3 ${
                isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <View
                className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                  isSelected ? 'border-emerald-700 bg-emerald-700' : 'border-slate-400 bg-white'
                }`}
              >
                <Text className="text-xs font-bold text-white">{isSelected ? '✓' : ''}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-[11px] uppercase tracking-wide text-slate-500">{FIELD_LABELS[key] || key}</Text>
                <Text className="text-sm font-semibold text-slate-900">{formatValue(key, value)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={() => onApply(selectedFields)}
        disabled={selectedCount === 0}
        className={`mt-3 rounded-xl px-3 py-3 ${selectedCount === 0 ? 'bg-emerald-300' : 'bg-emerald-700'}`}
      >
        <Text className="text-center text-sm font-semibold text-white">Apply {selectedCount} fields</Text>
      </TouchableOpacity>

      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} className="mt-2 self-end">
          <Text className="text-xs font-medium text-slate-500">Dismiss</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
