# Design Document: FidelChart Component

## Overview

The FidelChart component is a React functional component that renders the Amharic Fidel (alphabet) chart as an educational grid. The component displays consonant families in rows and vowel modifications in columns, using CSS Grid for layout and Tailwind CSS for styling. The design prioritizes clarity, accessibility, and mobile responsiveness with a sticky first column for small screens.

This initial implementation uses hardcoded placeholder data for two consonant families (Ha and Le) to validate the layout structure before future integration with dynamic data sources.

## Architecture

### Component Architecture

The FidelChart component follows a simple, self-contained architecture:

```
FidelChart (Functional Component)
├── Placeholder Data (hardcoded constant)
├── Grid Container (CSS Grid with 8 columns)
│   ├── Header Row (vowel labels)
│   └── Data Rows (consonant families)
└── Responsive Wrapper (horizontal scroll on mobile)
```

### Technology Stack

- **React 19.2.0**: Functional component with hooks
- **Tailwind CSS 3.4.19**: Utility-first styling
- **CSS Grid**: Native grid layout system
- **Vite 7.3.1**: Build tool and dev server

### Design Principles

1. **Simplicity**: Single-file component with no external dependencies
2. **Accessibility-First**: Semantic HTML and ARIA attributes
3. **Mobile-Responsive**: Horizontal scroll with sticky column
4. **Educational Aesthetic**: Clean, poster-like visual design

## Components and Interfaces

### FidelChart Component

**File Location**: `frontend/src/components/FidelChart.jsx`

**Component Signature**:
```jsx
function FidelChart() {
  return (/* JSX */);
}

export default FidelChart;
```

**Props**: None (initial implementation uses hardcoded data)

**Internal Structure**:

1. **Data Constant**: Hardcoded array of consonant family objects
2. **Vowel Headers**: Array defining the 7 vowel order
3. **Grid Container**: Outer wrapper with responsive scroll behavior
4. **Grid Layout**: CSS Grid with 8 columns
5. **Header Row**: Vowel labels (ä, u, i, a, e, ə, o)
6. **Data Rows**: Consonant family rows with cells

### Component Hierarchy

```jsx
<div className="fidel-chart-container"> {/* Responsive wrapper */}
  <div className="fidel-chart-grid"> {/* CSS Grid */}
    
    {/* Header Row */}
    <div className="header-cell sticky">Label</div>
    <div className="header-cell">ä</div>
    <div className="header-cell">u</div>
    <div className="header-cell">i</div>
    <div className="header-cell">a</div>
    <div className="header-cell">e</div>
    <div className="header-cell">ə</div>
    <div className="header-cell">o</div>
    
    {/* Data Rows - Ha Family */}
    <div className="label-cell sticky">Ha</div>
    <div className="data-cell">ሀ</div>
    <div className="data-cell">ሁ</div>
    <div className="data-cell">ሂ</div>
    <div className="data-cell">ሃ</div>
    <div className="data-cell">ሄ</div>
    <div className="data-cell">ህ</div>
    <div className="data-cell">ሆ</div>
    
    {/* Data Rows - Le Family */}
    <div className="label-cell sticky">Le</div>
    <div className="data-cell">ለ</div>
    <div className="data-cell">ሉ</div>
    <div className="data-cell">ሊ</div>
    <div className="data-cell">ላ</div>
    <div className="data-cell">ሌ</div>
    <div className="data-cell">ል</div>
    <div className="data-cell">ሎ</div>
    
  </div>
</div>
```

## Data Models

### Consonant Family Data Structure

```javascript
const PLACEHOLDER_DATA = [
  {
    id: 'ha',
    label: 'Ha',
    characters: ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ']
  },
  {
    id: 'le',
    label: 'Le',
    characters: ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ']
  }
];
```

**Field Descriptions**:
- `id` (string): Unique identifier for the consonant family
- `label` (string): Display name for the consonant family (e.g., "Ha", "Le")
- `characters` (array): Array of 7 Amharic characters corresponding to vowel modifications

### Vowel Order Constant

```javascript
const VOWEL_ORDER = ['ä', 'u', 'i', 'a', 'e', 'ə', 'o'];
```

This constant defines the column headers and ensures consistent vowel ordering across the grid.

## CSS Grid Implementation

### Grid Structure

The component uses CSS Grid with the following specifications:

**Grid Template Columns**:
```css
grid-template-columns: auto repeat(7, 1fr);
```

- Column 1: `auto` width for consonant family labels (sticky on mobile)
- Columns 2-8: `1fr` each for equal-width vowel columns

**Grid Behavior**:
- All cells are direct children of the grid container
- Grid flows naturally in row-major order
- No explicit row definitions (auto-generated)

### Tailwind CSS Classes

**Container Classes**:
```jsx
className="w-full overflow-x-auto md:overflow-x-visible"
```

**Grid Classes**:
```jsx
className="grid grid-cols-[auto_repeat(7,1fr)] gap-0 border border-gray-300 bg-white"
```

**Header Cell Classes**:
```jsx
className="bg-blue-100 border border-gray-300 p-3 text-center font-semibold text-gray-800"
```

**Sticky Label Cell Classes** (first column):
```jsx
className="bg-gray-50 border border-gray-300 p-3 font-semibold text-gray-800 sticky left-0 z-10"
```

**Data Cell Classes**:
```jsx
className="border border-gray-300 p-4 text-center text-2xl text-gray-900"
```

### Sticky Column Implementation

The first column (consonant family labels) uses CSS `position: sticky` with `left: 0` to remain fixed during horizontal scrolling on mobile devices.

**Key CSS Properties**:
- `position: sticky`
- `left: 0`
- `z-index: 10` (ensures labels appear above scrolling content)
- `background-color` (prevents content from showing through)

## Responsive Design Strategy

### Breakpoint Strategy

The component uses Tailwind's `md:` breakpoint (768px) as the threshold for responsive behavior:

**Mobile (< 768px)**:
- Enable horizontal scrolling on container
- Sticky first column remains visible
- Grid maintains 8-column structure
- User swipes horizontally to view all vowel columns

**Desktop (≥ 768px)**:
- Disable horizontal scrolling
- All columns visible simultaneously
- Grid expands to fill available width

### Implementation Approach

```jsx
<div className="w-full overflow-x-auto md:overflow-x-visible">
  <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-[640px] md:min-w-0">
    {/* Grid content */}
  </div>
</div>
```

**Key Responsive Classes**:
- `overflow-x-auto`: Enable horizontal scroll on mobile
- `md:overflow-x-visible`: Disable scroll on desktop
- `min-w-[640px]`: Ensure minimum width for mobile scroll
- `md:min-w-0`: Remove minimum width on desktop

## Tailwind CSS Specifications

### Color Palette

- **Header Background**: `bg-blue-100` (light blue for vowel headers)
- **Label Background**: `bg-gray-50` (subtle gray for consonant labels)
- **Data Background**: `bg-white` (clean white for character cells)
- **Border Color**: `border-gray-300` (medium gray for all borders)
- **Text Color**: `text-gray-800` (dark gray for headers), `text-gray-900` (near-black for characters)

### Typography

- **Header Font**: `font-semibold` (600 weight)
- **Label Font**: `font-semibold` (600 weight)
- **Character Font**: Default weight with `text-2xl` size
- **Text Alignment**: `text-center` for all cells

### Spacing

- **Cell Padding**: `p-3` for headers and labels, `p-4` for data cells
- **Grid Gap**: `gap-0` (borders provide visual separation)
- **Border Width**: `border` (1px default)

### Layout Utilities

- **Width**: `w-full` on container
- **Display**: `grid` on grid container
- **Position**: `sticky` on first column cells
- **Z-Index**: `z-10` on sticky cells

## Accessibility Implementation

### Semantic HTML

The component uses semantic `<div>` elements with appropriate ARIA roles and attributes:

```jsx
<div role="table" aria-label="Amharic Fidel Chart">
  <div role="row">
    <div role="columnheader">Label</div>
    <div role="columnheader">ä</div>
    {/* ... */}
  </div>
  <div role="row">
    <div role="rowheader">Ha</div>
    <div role="cell">ሀ</div>
    {/* ... */}
  </div>
</div>
```

### ARIA Attributes

- `role="table"`: Identifies the grid as a data table
- `role="row"`: Identifies each row
- `role="columnheader"`: Identifies vowel headers
- `role="rowheader"`: Identifies consonant family labels
- `role="cell"`: Identifies data cells
- `aria-label="Amharic Fidel Chart"`: Provides table description

### Keyboard Navigation

The component maintains natural tab order and focus visibility:

- Tab order follows grid reading order (left-to-right, top-to-bottom)
- Focus styles use Tailwind's default `focus:` utilities
- Sticky column remains accessible during horizontal scroll

### Color Contrast

All text meets WCAG AA standards:

- Header text (`text-gray-800` on `bg-blue-100`): Contrast ratio > 4.5:1
- Label text (`text-gray-800` on `bg-gray-50`): Contrast ratio > 4.5:1
- Character text (`text-gray-900` on `bg-white`): Contrast ratio > 7:1
- Border contrast (`border-gray-300`): Sufficient for visual separation

### Screen Reader Support

- Logical reading order maintained through grid structure
- Row and column headers properly associated with data cells
- Sticky column behavior does not interfere with screen reader navigation
- Table structure announced correctly by assistive technologies

## Error Handling

### Rendering Errors

Since this component uses hardcoded data, rendering errors are minimal. Future considerations:

1. **Missing Data**: If data structure is malformed, component should render empty grid with headers
2. **Invalid Characters**: Unicode characters should render correctly or show fallback
3. **Browser Compatibility**: CSS Grid and sticky positioning are widely supported (IE11 excluded)

### Graceful Degradation

- If CSS Grid is not supported, content flows as block elements
- If sticky positioning is not supported, first column scrolls with content
- If Tailwind CSS fails to load, semantic HTML structure remains accessible

## Testing Strategy

### Testing Approach

This component is primarily focused on UI rendering and layout, which is not suitable for property-based testing. The testing strategy will use:

1. **Snapshot Tests**: Verify rendered HTML structure and class names
2. **Visual Regression Tests**: Ensure consistent visual appearance
3. **Responsive Behavior Tests**: Verify mobile and desktop layouts
4. **Accessibility Tests**: Validate ARIA attributes and semantic structure

### Unit Tests

**Test Framework**: Vitest with React Testing Library

**Test Cases**:

1. **Rendering Tests**:
   - Component renders without errors
   - Correct number of rows (1 header + 2 data rows)
   - Correct number of columns (8 total)
   - All vowel headers present in correct order
   - All consonant family labels present

2. **Data Display Tests**:
   - Ha family characters render correctly
   - Le family characters render correctly
   - All 7 vowel variations present for each family

3. **Styling Tests**:
   - Grid layout classes applied correctly
   - Sticky column classes present on first column
   - Responsive classes present on container
   - Border and spacing classes applied

4. **Accessibility Tests**:
   - ARIA roles present on grid elements
   - aria-label present on table
   - Semantic structure maintained
   - Tab order follows logical reading order

5. **Responsive Tests**:
   - Horizontal scroll enabled on mobile viewport
   - Sticky column behavior on mobile
   - Full grid visible on desktop viewport

### Snapshot Testing

Create snapshots for:
- Default component render
- Mobile viewport (< 768px)
- Desktop viewport (≥ 768px)

### Integration Tests

Test integration with parent components:
- Component imports successfully
- Component renders within React Router pages
- No console errors or warnings

### Manual Testing Checklist

- [ ] Visual appearance matches classroom poster aesthetic
- [ ] Horizontal scroll works smoothly on mobile
- [ ] First column remains sticky during scroll
- [ ] All characters display correctly (no Unicode issues)
- [ ] Borders and spacing appear consistent
- [ ] Component is readable on various screen sizes
- [ ] Screen reader announces table structure correctly
- [ ] Keyboard navigation works as expected

## Implementation Notes

### File Organization

```
frontend/src/components/
└── FidelChart.jsx (single file, ~150 lines)
```

### Dependencies

No additional dependencies required beyond existing project setup:
- React 19.2.0 (already installed)
- Tailwind CSS 3.4.19 (already configured)

### Integration Points

The component can be imported and used in any page:

```jsx
import FidelChart from '../components/FidelChart';

function SomePage() {
  return (
    <div>
      <h1>Amharic Alphabet</h1>
      <FidelChart />
    </div>
  );
}
```

### Future Enhancements

This design supports future extensions:

1. **Dynamic Data**: Replace hardcoded data with props or API calls
2. **Interactive Cells**: Add click handlers for pronunciation or details
3. **Filtering**: Add controls to show/hide specific consonant families
4. **Theming**: Support light/dark mode or custom color schemes
5. **Print Styles**: Optimize layout for printing as study materials

### Performance Considerations

- Component is lightweight (~2KB gzipped)
- No re-renders needed (static data)
- CSS Grid is hardware-accelerated
- Minimal DOM nodes (~27 elements for 2 families)

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid support required (95%+ global support)
- Sticky positioning support required (95%+ global support)
- No IE11 support (project uses Vite and modern React)

## Conclusion

The FidelChart component provides a clean, accessible, and responsive solution for displaying the Amharic Fidel chart. The design leverages modern CSS Grid and Tailwind utilities to create an educational interface that works seamlessly across devices. The hardcoded placeholder data validates the layout structure and provides a foundation for future dynamic data integration.
