import { DataSourcePlugin, DataResult } from '../../models/data-source.models';

/*
  CDC PLACES — community-level health data derived from BRFSS.
  Socrata Open Data API (no key required for public access).
  Dataset: PLACES County Data 2023 release
  Docs: https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/cwsq-ngmh
*/

const STATES = [
  { label: 'DC',            value: 'DC' },
  { label: 'Maryland',      value: 'MD' },
  { label: 'Virginia',      value: 'VA' },
  { label: 'California',    value: 'CA' },
  { label: 'New York',      value: 'NY' },
  { label: 'Texas',         value: 'TX' },
  { label: 'Florida',       value: 'FL' },
  { label: 'Illinois',      value: 'IL' },
  { label: 'Pennsylvania',  value: 'PA' },
  { label: 'Ohio',          value: 'OH' },
];

const MEASURES = [
  { label: 'Obesity',                  value: 'OBESITY' },
  { label: 'Diabetes',                 value: 'DIABETES' },
  { label: 'High Blood Pressure',      value: 'BPHIGH' },
  { label: 'High Cholesterol',         value: 'HIGHCHOL' },
  { label: 'Coronary Heart Disease',   value: 'CHD' },
  { label: 'Stroke',                   value: 'STROKE' },
  { label: 'COPD',                     value: 'COPD' },
  { label: 'Cancer (excl. skin)',      value: 'CANCER' },
  { label: 'Depression',               value: 'DEPRESSION' },
  { label: 'Current Smoking',          value: 'CSMOKING' },
  { label: 'Binge Drinking',           value: 'BINGE' },
  { label: 'Physical Inactivity',      value: 'LPA' },
  { label: 'Sleep < 7 hours',          value: 'SLEEP' },
  { label: 'Asthma (current)',         value: 'CASTHMA' },
  { label: 'Annual Checkup',           value: 'CHECKUP' },
  { label: 'Dental Visit',             value: 'DENTAL' },
  { label: 'Mammography Use',          value: 'MAMMOUSE' },
  { label: 'Colon Screening',          value: 'COLON_SCREEN' },
  { label: 'Kidney Disease',           value: 'KIDNEY' },
  { label: 'Arthritis',                value: 'ARTHRITIS' },
];

export const BRFSSSource: DataSourcePlugin = {
  id:          'cdc-brfss-places',
  name:        'CDC BRFSS / PLACES',
  description: 'County-level health estimates from CDC PLACES, powered by BRFSS survey data.',
  docsUrl:     'https://www.cdc.gov/places',
  category:    'Public Health',

  parameters: [
    {
      key:      'state',
      label:    'State',
      type:     'select',
      default:  'DC',
      options:  STATES,
      required: true,
    },
    {
      key:      'measure',
      label:    'Health Measure',
      type:     'select',
      default:  'OBESITY',
      options:  MEASURES,
      required: true,
    },
    {
      key:      'data_value_type',
      label:    'Value Type',
      type:     'select',
      default:  'Age-adjusted prevalence',
      options:  [
        { label: 'Age-adjusted prevalence', value: 'Age-adjusted prevalence' },
        { label: 'Crude prevalence',        value: 'Crude prevalence' },
      ],
    },
    {
      key:      'limit',
      label:    'Max rows',
      type:     'select',
      default:  '100',
      options:  ['50','100','250','500'].map(v => ({ label: v, value: v })),
    },
  ],

  buildProxyRequest(params) {
    const state   = params['state']   || 'DC';
    const measure = params['measure'] || 'OBESITY';
    const limit   = params['limit']   || '100';

    const where = encodeURIComponent(
      `stateabbr='${state}' AND measureid='${measure}' AND datavaluetypeid='AgeAdj'`
    );
    const select = encodeURIComponent(
      'locationname,stateabbr,measure,data_value_type,data_value,data_value_unit,low_confidence_limit,high_confidence_limit,totalpopulation'
    );
    const externalUrl =
      `https://data.cdc.gov/resource/cwsq-ngmh.json?$where=${where}&$select=${select}&$limit=${limit}&$order=locationname`;

    return { externalUrl };
  },

  parseResult(raw, externalUrl): DataResult {
    if (!Array.isArray(raw)) throw new Error('Unexpected response from CDC PLACES API.');
    if (raw.length === 0)    throw new Error('No data returned. Try a different state or measure.');

    const headers = ['County', 'State', 'Measure', 'Value (%)', 'Low CI', 'High CI', 'Population'];
    const rows = raw.map((r: any) => [
      r.locationname      || '—',
      r.stateabbr         || '—',
      r.measure           || '—',
      r.data_value        != null ? `${r.data_value}%` : '—',
      r.low_confidence_limit  != null ? `${r.low_confidence_limit}%`  : '—',
      r.high_confidence_limit != null ? `${r.high_confidence_limit}%` : '—',
      r.totalpopulation   != null ? Number(r.totalpopulation).toLocaleString() : '—',
    ]);

    return {
      headers,
      rows,
      total:     rows.length,
      source:    'CDC PLACES — Local Data for Better Health',
      vintage:   '2023 Release',
      url:       externalUrl,
      fetchedAt: new Date(),
    };
  }
};
