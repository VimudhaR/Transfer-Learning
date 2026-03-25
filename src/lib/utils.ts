/**
 * Utility functions for the Clinical NLP application
 */

// Entity type colors for visualization
// Entity type colors for visualization
export const ENTITY_COLORS: Record<string, string> = {
  // Original Specific Tags
  TUMOR_SIZE: 'bg-blue-100 text-blue-800 border-blue-300',
  TUMOR_TYPE: 'bg-purple-100 text-purple-800 border-purple-300',
  TUMOR_CLASSIFICATION: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  RECEPTOR_STATUS: 'bg-green-100 text-green-800 border-green-300',
  STAGE: 'bg-orange-100 text-orange-800 border-orange-300',
  GRADE: 'bg-amber-100 text-amber-800 border-amber-300',

  // Biomedical NER Tags (d4data/biomedical-ner-all)
  Sign_symptom: 'bg-red-100 text-red-800 border-red-300',
  Diagnostic_procedure: 'bg-blue-100 text-blue-800 border-blue-300',
  Medication: 'bg-teal-100 text-teal-800 border-teal-300',
  Biological_structure: 'bg-rose-100 text-rose-800 border-rose-300',
  Lab_value: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  Date: 'bg-gray-100 text-gray-800 border-gray-300',
  Patient_characteristic: 'bg-pink-100 text-pink-800 border-pink-300',
  Family_history: 'bg-purple-100 text-purple-800 border-purple-300',
  History: 'bg-purple-50 text-purple-700 border-purple-200',
  Detailed_description: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Therapeutic_procedure: 'bg-green-100 text-green-800 border-green-300',
  Clinical_event: 'bg-orange-50 text-orange-800 border-orange-200',
  Outcome: 'bg-indigo-50 text-indigo-800 border-indigo-200',

  // Others
  TREATMENT: 'bg-teal-100 text-teal-800 border-teal-300',
  MEDICATION: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  AGE: 'bg-pink-100 text-pink-800 border-pink-300',
  GENDER: 'bg-rose-100 text-rose-800 border-rose-300',
};

// Format entity type for display
export function formatEntityType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Get color class for entity type
export function getEntityColor(type: string): string {
  return ENTITY_COLORS[type] || 'bg-gray-100 text-gray-800 border-gray-300';
}

// Export data as JSON
export function exportAsJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export data as CSV
export function exportAsCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Calculate completeness score for clinical data extraction
export function calculateCompletenessScore(entities: Array<{ type: string }>) {
  // Check which model schema appears to be in use
  const hasBiomedicalTags = entities.some(e =>
    ['Sign_symptom', 'Diagnostic_procedure', 'Medication'].includes(e.type)
  );

  let requiredTypes: string[];

  if (hasBiomedicalTags) {
    // Schema for d4data/biomedical-ner-all
    requiredTypes = [
      'Sign_symptom',
      'Diagnostic_procedure',
      'Biological_structure'
    ];
  } else {
    // Schema for specialized Breast Cancer models
    requiredTypes = [
      'TUMOR_SIZE',
      'TUMOR_TYPE',
      'RECEPTOR_STATUS',
      'STAGE',
    ];
  }

  const extractedTypes = new Set(entities.map(e => e.type));
  const matchedTypes = requiredTypes.filter(type => extractedTypes.has(type));

  return {
    score: requiredTypes.length > 0 ? (matchedTypes.length / requiredTypes.length) * 100 : 0,
    matched: matchedTypes.length,
    total: requiredTypes.length,
    missing: requiredTypes.filter(type => !extractedTypes.has(type)),
  };
}

// Generate automated insights
export function generateInsights(entities: Array<{ type: string; confidence: number }>) {
  const insights: string[] = [];
  const entityTypes = new Set(entities.map(e => e.type));
  const avgConfidence = entities.length > 0
    ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
    : 0;

  // Insights for specific Breast Cancer Model
  if (entityTypes.has('TUMOR_SIZE') && entityTypes.has('TUMOR_TYPE')) {
    insights.push('✓ Complete tumor characterization detected');
  }

  if (entityTypes.has('RECEPTOR_STATUS')) {
    const receptorCount = entities.filter(e => e.type === 'RECEPTOR_STATUS').length;
    if (receptorCount >= 3) {
      insights.push('✓ Comprehensive receptor panel identified');
    }
  }

  // Insights for General Biomedical Model
  if (entityTypes.has('Sign_symptom')) {
    const count = entities.filter(e => e.type === 'Sign_symptom').length;
    insights.push(`✓ Identified ${count} clinical signs/symptoms`);
  }

  if (entityTypes.has('Diagnostic_procedure')) {
    insights.push('✓ Diagnostic procedures documented');
  }

  if (entityTypes.has('Medication') || entityTypes.has('Therapeutic_procedure')) {
    insights.push('✓ Therapeutic interventions identified');
  }

  if (avgConfidence > 0.85) {
    insights.push('✓ High confidence extraction (>85%)');
  } else if (avgConfidence > 0.70) {
    insights.push('○ Moderate confidence extraction (70-85%)');
  } else {
    insights.push('⚠ Low confidence extraction (<70%)');
  }

  return insights;
}

// Example clinical texts for demonstration
export const EXAMPLE_TEXTS = {
  pathology: `A 58-year-old female presents with a 2.3 cm invasive ductal carcinoma in the upper outer quadrant of the left breast. Pathology reveals ER-positive, PR-positive, and HER2-negative status. The tumor is grade 2 with no lymphovascular invasion. Sentinel lymph node biopsy shows 0/3 nodes positive. Final staging is T2N0M0, Stage IIA. Treatment plan includes lumpectomy followed by adjuvant chemotherapy and radiation therapy.`,

  clinical: `Patient is a 45-year-old female diagnosed with triple-negative breast cancer. Initial presentation showed a 3.5 cm mass detected on mammography. Biopsy confirmed infiltrating ductal carcinoma, grade 3. Staging workup revealed T2N1M0, Stage IIB disease. The patient underwent neoadjuvant chemotherapy with doxorubicin and paclitaxel, followed by mastectomy. Pathological complete response was achieved.`,

  followup: `62-year-old female with history of Stage IIIA breast cancer (T3N2M0), ER-positive, PR-positive, HER2-positive. Previously treated with mastectomy, adjuvant chemotherapy, trastuzumab, and radiation therapy. Currently on anastrozole for hormonal therapy. Follow-up mammography and clinical examination show no evidence of recurrence at 24 months post-treatment.`,
};
