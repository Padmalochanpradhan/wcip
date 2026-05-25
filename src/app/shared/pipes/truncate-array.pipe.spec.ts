import { TruncateArrayPipe } from './truncate-array.pipe';

describe('TruncateArrayPipe', () => {
  it('create an instance', () => {
    const pipe = new TruncateArrayPipe();
    expect(pipe).toBeTruthy();
  });
});
