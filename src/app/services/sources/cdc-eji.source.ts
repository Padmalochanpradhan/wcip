import { DataSourcePlugin, DataResult } from '../../models/data-source.models';

/*
  CDC Environmental Justice Index (EJI) 2022
  Socrata Open Data API — no key required.
  Dataset: https://data.cdc.gov/resource/r6bc-tbis.json
  Docs: https://www.atsdr.cdc.gov/placeandhealth/eji/index.html
*/

const STATE_FIPS = [
  { label: 'DC (11)',              value: '11' },
  { label: 'Maryland (24)',        value: '24' },
  { label: 'Virginia (51)',        value: '51' },
  { label: 'California (06)',      value: '06' },
  { label: 'New York (36)',        value: '36' },
  { label: 'Texas (48)',           value: '48' },
  { label: 'Florida (12)',         value: '12' },
  { label: 'Illinois (17)',        value: '17' },
  { label: 'Pennsylvania (42)',    value: '42' },
  { label: 'Ohio (39)',            value: '39' },
  { label: 'All States',           value: '' },
];

const MODULES = [
  { label: 'All Indices (summary)',          value: 'summary' },
  { label: 'Environmental Burden',           value: 'environmental' },
  { label: 'Social Vulnerability',           value: 'social' },
  { label: 'Health Vulnerability',           value: 'health' },
];

const SUMMARY_FIELDS  = 'COUNTY,STATE,SPL_EJI,RPL_EBM,RPL_SVM,RPL_HVM';
const ENV_FIELDS      = 'COUNTY,STATE,RPL_EBM,EPL_OZONE,EPL_PM,EPL_DSLPM,EPL_TOTCR,EPL_NPL,EPL_TRI,EPL_TSD,EPL_RMP,EPL_COAL,EPL_LEAD';
const SOCIAL_FIELDS   = 'COUNTY,STATE,RPL_SVM,EP_UNEMP,EP_HBURD,EP_UNINS,EP_NOINT,EP_POV200,EP_MINRTY,EP_LIMENG';
const HEALTH_FIELDS   = 'COUNTY,STATE,RPL_HVM,EP_BPHIGH,EP_ASTHMA,EP_CANCER,EP_MHLTH,EP_DIABETES,EP_DISABILITY';

const FIELD_LABELS: Record<string, string> = {
  COUNTY: 'County', STATE: 'State',
  SPL_EJI: 'EJI Score', RPL_EBM: 'Env Burden Rank', RPL_SVM: 'Social Vuln Rank', RPL_HVM: 'Health Vuln Rank',
  EPL_OZONE: 'Ozone', EPL_PM: 'PM2.5', EPL_DSLPM: 'Diesel PM', EPL_TOTCR: 'Air Toxics Cancer Risk',
  EPL_NPL: 'Superfund Sites', EPL_TRI: 'Toxic Release', EPL_TSD: 'Hazardous Waste',
  EPL_RMP: 'Chemical Risk', EPL_COAL: 'Coal Mines', EPL_LEAD: 'Lead Paint',
  EP_UNEMP: 'Unemployment %', EP_HBURD: 'Housing Burden %', EP_UNINS: 'Uninsured %',
  EP_NOINT: 'No Internet %', EP_POV200: 'Poverty (200%) %', EP_MINRTY: 'Minority %', EP_LIMENG: 'Lim. English %',
  EP_BPHIGH: 'High BP %', EP_ASTHMA: 'Asthma %', EP_CANCER: 'Cancer %',
  EP_MHLTH: 'Poor Mental Health %', EP_DIABETES: 'Diabetes %', EP_DISABILITY: 'Disability %',
};

function fieldsForModule(module: string): string {
  return { summary: SUMMARY_FIELDS, environmental: ENV_FIELDS, social: SOCIAL_FIELDS, health: HEALTH_FIELDS }[module] || SUMMARY_FIELDS;
}

export const CDCEJISource: DataSourcePlugin = {
  id:          'cdc-eji',
  name:        'CDC EJI',
  description: 'CDC/ATSDR Environmental Justice Index — county-level composite scores for environmental, social, and health vulnerability.',
  docsUrl:     'https://www.atsdr.cdc.gov/placeandhealth/eji/index.html',
  category:    'Environmental Justice',

  parameters: [
    {
      key:      'state_fips',
      label:    'State',
      type:     'select',
      default:  '11',
      options:  STATE_FIPS,
      required: true,
    },
    {
      key:      'module',
      label:    'Index Module',
      type:     'select',
      default:  'summary',
      options:  MODULES,
      required: true,
    },
    {
      key:      'limit',
      label:    'Max rows',
      type:     'select',
      default:  '100',
      options:  ['50','100','250','500','1000'].map(v => ({ label: v, value: v })),
    },
  ],

  buildProxyRequest(params) {
    const stateFips = params['state_fips'] || '11';
    const module    = params['module']     || 'summary';
    const limit     = params['limit']      || '100';

    const fields  = fieldsForModule(module);
    const select  = encodeURIComponent(fields);
    const where   = stateFips
      ? encodeURIComponent(`STATEFP='${stateFips}'`)
      : encodeURIComponent(`SPL_EJI IS NOT NULL`);

    const externalUrl =
      `https://data.cdc.gov/resource/r6bc-tbis.json?$select=${select}&$where=${where}&$limit=${limit}&$order=RPL_EBM DESC`;

    return { externalUrl };
  },

  parseResult(raw, externalUrl, params): DataResult {
    if (!Array.isArray(raw)) throw new Error('Unexpected response from CDC EJI API.');
    if (raw.length === 0)    throw new Error('No EJI data returned for this state. Try "All States".');

    const module  = params['module'] || 'summary';
    const fields  = fieldsForModule(module).split(',');
    const headers = fields.map(f => FIELD_LABELS[f] || f);

    const rows = raw.map((r: any) =>
      fields.map(f => {
        const val = r[f.toLowerCase()] ?? r[f];
        if (val == null || val === '') return '—';
        const n = Number(val);
        if (isNaN(n)) return String(val);
        // Rank percentiles → show as 0.00–1.00 with 3 decimals
        if (f.startsWith('RPL_') || f.startsWith('SPL_')) return n.toFixed(4);
        // Percent estimates
        if (f.startsWith('EP_')) return `${n.toFixed(1)}%`;
        // Raw percentile layers
        return n.toFixed(4);
      })
    );

    return {
      headers,
      rows,
      total:     rows.length,
      source:    'CDC/ATSDR Environmental Justice Index 2022',
      vintage:   '2022',
      url:       externalUrl,
      fetchedAt: new Date(),
    };
  }
};
