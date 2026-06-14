# ♿ Accessibility (A11Y) Guide

## WCAG 2.1 Compliance

### Level A (Must Have)
- [x] Keyboard navigation
- [x] Alt text for images
- [x] Form labels
- [x] Semantic HTML
- [x] Color contrast

### Level AA (Should Have)
- [ ] Focus indicators
- [ ] Skip links
- [ ] ARIA labels
- [ ] Screen reader support
- [ ] Responsive design

## Implementation Guide

### 1. Keyboard Navigation
```typescript
// Ensure all interactive elements are keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  tabIndex={0}
>
  Action Button
</button>

// Skip to main content link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### 2. ARIA Labels
```typescript
// Button with icon
<button aria-label="IRAC tahlilni boshlash">
  <PlayIcon />
</button>

// Search input
<input
  type="search"
  aria-label="Qonunlar bazasida qidirish"
  placeholder="Qidirish..."
/>

// Loading state
<div role="status" aria-live="polite">
  {loading ? 'Yuklanmoqda...' : 'Tayyor'}
</div>
```

### 3. Semantic HTML
```typescript
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>

// ❌ Bad
<div className="heading">Title</div>

// ✅ Good
<h1>Title</h1>
```

### 4. Focus Management
```typescript
import { useRef, useEffect } from 'react'

function Modal({ isOpen }) {
  const firstFocusableElement = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      firstFocusableElement.current?.focus()
    }
  }, [isOpen])

  return (
    <dialog
      open={isOpen}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">Modal Title</h2>
      <p id="modal-description">Modal content</p>
      <button ref={firstFocusableElement}>Action</button>
    </dialog>
  )
}
```

### 5. Color Contrast
```css
/* Ensure sufficient contrast ratios */
/* Normal text: 4.5:1 minimum */
/* Large text: 3:1 minimum */

.text {
  color: #1a1a1a; /* Dark text */
  background: #ffffff; /* Light background */
  /* Contrast ratio: 20:1 ✅ */
}

.button {
  color: #ffffff;
  background: #2563eb; /* Blue */
  /* Contrast ratio: 8.6:1 ✅ */
}
```

### 6. Form Accessibility
```typescript
<form>
  <label htmlFor="email">
    Email Address
    <span aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <span id="email-error" role="alert">
      {errors.email}
    </span>
  )}
</form>
```

### 7. Screen Reader Support
```typescript
// Visually hidden but screen reader accessible
<style jsx>{`
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`}</style>

<span className="sr-only">
  Bu matn faqat screen reader uchun
</span>
```

## Testing Accessibility

### Automated Testing
```bash
# Install axe-core
npm install --save-dev @axe-core/react

# In development
import { useEffect } from 'react'

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}
```

### Manual Testing
1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Use Enter/Space to activate buttons
   - Use Arrow keys for menus/sliders
   - Escape to close modals

2. **Screen Reader**
   - NVDA (Windows - Free)
   - JAWS (Windows - Paid)
   - VoiceOver (Mac - Built-in)

3. **Color Blindness**
   - Use browser extensions
   - Test with grayscale

## Accessibility Checklist

### Content
- [ ] All images have alt text
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Content is readable without CSS
- [ ] Headings are hierarchical (h1, h2, h3...)

### Navigation
- [ ] Skip to main content link
- [ ] All functionality available via keyboard
- [ ] Focus indicators visible
- [ ] Tab order is logical
- [ ] No keyboard traps

### Forms
- [ ] All inputs have labels
- [ ] Error messages are clear
- [ ] Required fields indicated
- [ ] Form validation accessible
- [ ] Success/error states announced

### Interactive Elements
- [ ] Buttons have descriptive labels
- [ ] Links have meaningful text
- [ ] Icons have ARIA labels
- [ ] Loading states announced
- [ ] Error states announced

### Visual
- [ ] Color contrast meets WCAG AA
- [ ] Text resizable to 200%
- [ ] No content loss when zoomed
- [ ] Responsive design works
- [ ] Dark mode support

## ARIA Roles Reference

```typescript
// Landmarks
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>

// Widgets
<div role="button" tabIndex={0}>...</div>
<div role="checkbox" aria-checked="false">...</div>
<div role="dialog" aria-labelledby="title">...</div>
<div role="alert">...</div>

// Live Regions
<div role="status" aria-live="polite">...</div>
<div role="alert" aria-live="assertive">...</div>
```

## Resources

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN A11Y**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **WebAIM**: https://webaim.org/
- **A11Y Project**: https://www.a11yproject.com/
