import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>)

      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
    })

    it('renders children correctly', () => {
      render(<Button>Test Content</Button>)

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('variants', () => {
    it('applies default variant styles', () => {
      render(<Button variant="default">Default</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'default')
    })

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'destructive')
    })

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'outline')
    })

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'secondary')
    })

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'ghost')
    })

    it('applies link variant styles', () => {
      render(<Button variant="link">Link</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-variant', 'link')
    })
  })

  describe('sizes', () => {
    it('applies default size', () => {
      render(<Button size="default">Default Size</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'default')
    })

    it('applies small size', () => {
      render(<Button size="sm">Small</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'sm')
    })

    it('applies large size', () => {
      render(<Button size="lg">Large</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'lg')
    })

    it('applies icon size', () => {
      render(<Button size="icon">🎯</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-size', 'icon')
    })
  })

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      let clicked = false

      render(<Button onClick={() => { clicked = true }}>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(clicked).toBe(true)
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      let clicked = false

      render(<Button disabled onClick={() => { clicked = true }}>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(clicked).toBe(false)
    })

    it('has disabled attribute when disabled', () => {
      render(<Button disabled>Disabled</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('asChild', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/test">Link Button</a>
        </Button>
      )

      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('data attributes', () => {
    it('has data-slot attribute', () => {
      render(<Button>Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-slot', 'button')
    })
  })

  describe('accessibility', () => {
    it('can have an aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>)

      const button = screen.getByRole('button', { name: 'Close dialog' })
      expect(button).toBeInTheDocument()
    })

    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })
})
