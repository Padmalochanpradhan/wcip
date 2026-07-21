import { DataSourcePlugin, DataResult } from '../../models/data-source.models';

export const CENSUS_ACS_VARIABLES: { label: string; value: string }[] = [
  { label: 'Total Population',           value: 'B01001_001E' },
  { label: 'Median Household Income',    value: 'B19013_001E' },
  { label: 'Total Housing Units',        value: 'B25001_001E' },
  { label: 'Median Home Value',          value: 'B25077_001E' },
  { label: 'Median Gross Rent',          value: 'B25064_001E' },
  { label: 'Below Poverty Level',        value: 'B17001_002E' },
  { label: 'Unemployed (Labor Force)',   value: 'B23025_005E' },
  { label: 'No Health Insurance',        value: 'B27010_033E' },
  { label: "Bachelor's Degree+",        value: 'B15003_022E' },
  { label: 'Foreign Born',              value: 'B05002_013E' },
  { label: 'Hispanic or Latino',        value: 'B03002_012E' },
  { label: 'Black or African American', value: 'B02001_003E' },
  { label: 'White alone',              value: 'B02001_002E' },
  { label: 'Households with Internet', value: 'B28011_002E' },
];

export const CENSUS_ACS_GEOS: { label: string; value: string }[] = [
  { label: 'All States',                   value: 'state:*' },
  { label: 'DC (State 11)',                value: 'state:11' },
  { label: 'All Counties in DC',           value: 'county:*&in=state:11' },
  { label: 'All Counties – Maryland',      value: 'county:*&in=state:24' },
  { label: 'All Counties – Virginia',      value: 'county:*&in=state:51' },
  { label: 'All US Counties',             value: 'county:*' },
  { label: 'Congressional Districts – DC', value: 'congressional district:*&in=state:11' },
];

const VAR_LABELS: Record<string, string> = {};
CENSUS_ACS_VARIABLES.forEach(v => { VAR_LABELS[v.value] = v.label; });

export const CensusACSSource: DataSourcePlugin = {
  id:          'census-acs5',
  name:        'Census ACS 5-Year',
  description: 'American Community Survey 5-year estimates from the US Census Bureau.',
  docsUrl:     'https://www.census.gov/data/developers/data-sets/acs-5year.html',
  category:    'Demographics',

  parameters: [
    {
      key:      'year',
      label:    'Data Year',
      type:     'select',
      default:  '2022',
      options:  ['2022','2021','2020','2019','2018'].map(y => ({ label: y, value: y })),
      required: true,
    },
    {
      key:      'variables',
      label:    'Variables',
      type:     'multiselect',
      default:  'B01001_001E,B19013_001E,B17001_002E',
      options:  CENSUS_ACS_VARIABLES,
      hint:     'Select one or more measures',
      required: true,
    },
    {
      key:      'geography',
      label:    'Geography',
      type:     'select',
      default:  'state:*',
      options:  CENSUS_ACS_GEOS,
      required: true,
    },
    {
      key:     'api_key',
      label:   'API Key (optional)',
      type:    'text',
      default: 'DEMO_KEY',
      hint:    'Free key at api.census.gov/data/key_signup.html',
    },
  ],

  buildProxyRequest(params) {
    const year = params['year']      || '2022';
    const geo  = params['geography'] || 'state:*';
    const key  = params['api_key']   || 'DEMO_KEY';
    const vars = (params['variables'] || 'B01001_001E').split(',').filter(Boolean);

    const getParam = ['NAME', ...vars].join(',');
    const forClause = geo.includes('&in=') ? `for=${geo.split('&')[0]}&${geo.split('&in=')[1] ? 'in=' + geo.split('&in=')[1] : ''}` : `for=${geo}`;
    const externalUrl = `https://api.census.gov/data/${year}/acs/acs5?get=${getParam}&${forClause}&key=${key}`;
    return { externalUrl };
  },

  parseResult(raw, externalUrl, params): DataResult {
    if (!Array.isArray(raw) || raw.length < 2) {
      throw new Error('No data returned from Census API. Check your parameters.');
    }
    const headers = (raw[0] as string[]).map((h: string) => VAR_LABELS[h] || h);
    const rows    = raw.slice(1) as string[][];
    return {
      headers,
      rows,
      total:     rows.length,
      source:    'U.S. Census Bureau — ACS 5-Year Estimates',
      vintage:   params['year'] || '2022',
      url:       externalUrl,
      fetchedAt: new Date(),
    };
  }
};
