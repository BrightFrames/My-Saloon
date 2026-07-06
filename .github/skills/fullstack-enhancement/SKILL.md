---
name: fullstack-enhancement
description: 'Workflow for React and Node.js full-stack developers emphasizing system design, DB management, and frontend UI/UX improvements. Use when building or refactoring cross-stack features.'
user-invocable: true
---

# Full Stack Enhancement Workflow (React + Node.js)

## When to Use
- Implementing new features across a React frontend and Node.js backend.
- Designing system architecture or updating database schemas.
- Refactoring and optimizing the frontend for better user experience and performance.

## Process / Workflow

### 1. System Design & DB Strategy
- **Requirement Analysis:** Map out the end-to-end data flow before touching the code.
- **Database Management:** Define table/collection changes, indexes, and write migration plans if necessary.
- **Architecture:** Determine the most efficient way the client (React) will request data from the server (Node.js/Express).

### 2. Backend Implementation (Node.js)
- **API Development:** Create or update REST/GraphQL API endpoints.
- **Data Layer:** Implement optimal database queries (prevent N+1 queries, ensure caching if needed).
- **Security & Validation:** Always sanitize inputs and handle errors gracefully.

### 3. Frontend Enhancement (React)
- **State Management:** Decide if local component state, context, or external state managers (Zustand/Redux) are necessary.
- **Component Design:** Build reusable and accessible React components.
- **Performance & UI:** Make interfaces snappy. Pre-fetch where useful, use lazy loading appropriately, and ensure visual feedback for user interactions.

### 4. Integration & Verification
- **E2E Connection:** Verify that React seamlessly integrates with the Node.js backend.
- **Review:** Check against the initial system design to ensure scale, security, and maintainability expectations are met.
- **Polish:** Perform a final visual and functional pass on the frontend layout.