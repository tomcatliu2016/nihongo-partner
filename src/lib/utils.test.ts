import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className utility)', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('handles undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('merges tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('handles object syntax', () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    })
    expect(result).toBe('foo baz')
  })

  it('handles complex tailwind merging', () => {
    const result = cn(
      'text-sm text-gray-500',
      'text-lg',
      'hover:text-blue-500'
    )
    expect(result).toBe('text-gray-500 text-lg hover:text-blue-500')
  })

  it('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles only falsy values', () => {
    const result = cn(false, null, undefined, '')
    expect(result).toBe('')
  })
})
