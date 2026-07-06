---
name: feature-generator
description: "Generate robust frontend UI components and backend logic for a new feature"
argument-hint: "Describe the feature to build..."
---

# Feature Generator

Please construct the frontend UI and backend logic for the requested feature.

Feature Request: 
{{prompt}}

## Guidelines

**1. Backend Logic:**
- Create the necessary API endpoints (e.g., Express/Node.js).
- Write optimized database queries and handle necessary relationships.
- Ensure all incoming inputs are sanitized and validated.
- Include proper error handling and status codes.

**2. Frontend UI:**
- Generate accessible, responsive React components.
- Implement robust state management (e.g., local state, hooks, or context as needed).
- Handle loading states, success messages, and error states gracefully to provide good UI feedback.

**3. Integration:**
- Ensure the frontend API calls match the generated backend endpoints.
- Maintain clean separation of concerns and clear typing/interfaces if using TypeScript.
