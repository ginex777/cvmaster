import {
  LEGACY_DONE_STATUS,
  LEGACY_OPEN_STATUS,
  legacyToStatus,
  STATUS_META,
  STATUS_ORDER,
  type ApplicationStatus,
} from './status.utils';

describe('legacyToStatus', () => {
  it('maps OPEN without export flag to DRAFT', () => {
    expect(legacyToStatus(LEGACY_OPEN_STATUS)).toBe('DRAFT');
  });

  it('maps OPEN with exported=false to DRAFT', () => {
    expect(legacyToStatus(LEGACY_OPEN_STATUS, false)).toBe('DRAFT');
  });

  it('maps OPEN with exported=true to APPLIED', () => {
    expect(legacyToStatus(LEGACY_OPEN_STATUS, true)).toBe('APPLIED');
  });

  it('maps DONE to APPLIED', () => {
    expect(legacyToStatus(LEGACY_DONE_STATUS)).toBe('APPLIED');
  });

  it('maps EXPORTED to APPLIED', () => {
    expect(legacyToStatus('EXPORTED')).toBe('APPLIED');
  });

  it('maps SENT to APPLIED', () => {
    expect(legacyToStatus('SENT')).toBe('APPLIED');
  });

  it('maps REPLIED to INTERVIEW', () => {
    expect(legacyToStatus('REPLIED')).toBe('INTERVIEW');
  });

  it('maps FAILED to REJECTED', () => {
    expect(legacyToStatus('FAILED')).toBe('REJECTED');
  });

  it('passes through valid new statuses', () => {
    const statuses: ApplicationStatus[] = ['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
    for (const s of statuses) {
      expect(legacyToStatus(s)).toBe(s);
    }
  });

  it('falls back to DRAFT for unknown strings', () => {
    expect(legacyToStatus('UNKNOWN_LEGACY')).toBe('DRAFT');
  });
});

describe('STATUS_META', () => {
  it('has entries for all 5 statuses', () => {
    expect(Object.keys(STATUS_META)).toHaveLength(5);
  });

  it('each entry has label, color, bg, short, order', () => {
    for (const meta of Object.values(STATUS_META)) {
      expect(meta.label).toBeTruthy();
      expect(meta.color).toBeTruthy();
      expect(meta.bg).toBeTruthy();
      expect(meta.short).toBeTruthy();
      expect(typeof meta.order).toBe('number');
    }
  });
});

describe('STATUS_ORDER', () => {
  it('contains all 5 statuses in correct order', () => {
    expect(STATUS_ORDER).toEqual(['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']);
  });
});
