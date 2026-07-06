---
name: ui-component
description: "Generate an atomic, isolated React UI component with proper styling and prop types."
argument-hint: "Describe the React UI component..."
---

# UI Component Generator

Generate a modular, reusable React UI component based on the request.

Request: {{prompt}}

## Component Construction Rules
1. **File Structure:** Create a clean separation (e.g., `ComponentName.tsx` and an accompanying stylesheet or CSS module if needed, depending on the project style).
2. **Prop Types:** Always define clear, well-commented TypeScript interfaces for component `Props`.
3. **Accessibility:** Ensure basic accessibility rules are met (e.g., `aria-label`, correct heading hierarchies, `role` attributes where applicable, and keyboard navigation).
4. **State Management:** Keep it as a stateless "dumb" component unless local state is specifically demanded by the design.
5. **Styling Guidelines:** Follow modern UI patterns. Ensure the component is responsive by default.
6. **Exports:** Provide a default export for the page views and a named export for smaller atomic elements as dictated by common React patterns.

Provide the exact code required for this UI component, ready to be dropped straight into our frontend code.