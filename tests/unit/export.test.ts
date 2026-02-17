import { describe, expect, it } from 'vitest';
import { queryResultToCsv } from '../../lib/export';

describe('queryResultToCsv', () => {
  it('serializes rows and escapes nested objects', () => {
    const csv = queryResultToCsv({
      columns: [
        { key: 'name', label: 'name', type: 'VARCHAR' },
        { key: 'meta', label: 'meta', type: 'STRUCT' }
      ],
      data: [
        {
          name: 'Andrew',
          meta: { location: 'US' }
        }
      ],
      executionTime: '0.001s',
      affectedRows: 1
    });

    expect(csv).toContain('name,meta');
    expect(csv).toContain('Andrew');
    expect(csv).toContain('{""location"":""US""}');
  });
});
