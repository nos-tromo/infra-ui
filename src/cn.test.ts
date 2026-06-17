import { cn } from './cn'

test('merges and dedupes conflicting tailwind classes (last wins)', () => {
  expect(cn('px-2', 'px-4')).toBe('px-4')
})

test('drops falsy values and joins the rest', () => {
  expect(cn('a', false, null, undefined, 'b')).toBe('a b')
})
