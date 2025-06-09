# Sandpack Code Artifacts

We have some nice artifacts in place for docs, sheets, code. BUT the code artifacts seem to be mainly python. 

See src/artifacts/code.tsx and the server file with it. I believe it uses pyodide. It does work nicely but it is python only. I would like to refactor to have different types of runnable code artifacts where we know that we have extra abilities. python-file-pyodide vs js-project-sandpack which is multifile. Could/should also have plain HTML/css/jss artifact type html-fragment that does not require sandpack. 

## Instructions

- Review current artifacts implementation and how it is invoked via prompts.
- Fill in the remaining sections of this doc with your feature design and implementation plan.
- Execute the plan
- Work with user to test and troubleshoot until working

Use Context7 and Tavily when researching. 

If copying/adapting something, really copy it first using CLI, then adapt.

## Feature Design

The enhanced code artifacts system will consist of three distinct artifact types:

1. **python-file-pyodide**: Refactored from the existing code artifact
   - Single-file Python code execution using Pyodide
   - Support for matplotlib and other Python libraries
   - Console output with text and image rendering

2. **js-project-sandpack**: New multi-file JavaScript project support
   - Multiple file editing and navigation via file explorer
   - Support for various templates (React, Vue, vanilla JS)
   - Live preview of running code
   - Package dependency management
   - Console output for JavaScript execution

3. **html-fragment**: Simple HTML/CSS/JS snippet execution
   - Single HTML file with embedded CSS and JavaScript
   - Live preview without requiring full Sandpack setup
   - Ideal for simple demos and code snippets

Each artifact type will be detected based on content analysis and user intent, with appropriate prompts to guide the AI in generating the correct artifact type.

## UX Design

### Common Elements Across All Code Artifacts
- Code editor with syntax highlighting
- Copy code button
- Version history navigation (undo/redo)
- Toolbar with common actions

### python-file-pyodide
- Run button to execute Python code
- Console output panel showing text results and matplotlib visualizations
- Package loading indicator during execution

### js-project-sandpack
- File explorer sidebar for navigating multiple files
- Preview panel showing the running application
- Template selector (React, Vue, vanilla JS)
- Console output panel for JavaScript logs
- Dependency management interface

### html-fragment
- HTML/CSS/JS editor with tabs for each section
- Live preview that updates as code changes
- Simplified interface for quick snippets

### User Interaction Flow
1. User requests code generation with specific language/framework hints
2. AI determines appropriate artifact type based on request
3. AI generates code in the correct artifact format
4. User interacts with the artifact using the specialized tools for that type

## Technical Design

### Directory Structure
```
src/artifacts/code/
├── index.ts           # Main entry point and artifact type detection
├── python-file-pyodide/
│   ├── client.tsx     # Python code artifact implementation
│   └── server.ts      # Server-side handling for Python artifacts
├── js-project-sandpack/
│   ├── client.tsx     # JavaScript project artifact implementation
│   └── server.ts      # Server-side handling for JS artifacts
└── html-fragment/
    ├── client.tsx     # HTML fragment artifact implementation
    └── server.ts      # Server-side handling for HTML artifacts
```

### Implementation Details

#### 1. Artifact Type Detection
- Create a detection system in `index.ts` that analyzes content and user intent
- Implement prompt templates to guide the AI in generating appropriate artifact types
- Add metadata to artifacts to identify their type

#### 2. python-file-pyodide Implementation
- Refactor existing code artifact to be specifically for Python
- Maintain all current functionality including Pyodide integration
- Update UI to clearly indicate Python-specific features

#### 3. js-project-sandpack Implementation
- Integrate Sandpack React components for multi-file JavaScript projects
- Implement file explorer for navigating project structure
- Add support for different templates (React, Vue, vanilla JS)
- Create console output component for JavaScript execution results

#### 4. html-fragment Implementation
- Create simplified HTML/CSS/JS editor with live preview
- Implement basic rendering without full Sandpack setup
- Support embedded CSS and JavaScript in a single HTML file

#### 5. Integration with Existing System
- Update the artifact detection system to route to the correct artifact type
- Ensure backward compatibility with existing code artifacts
- Add appropriate prompts and examples for each artifact type

### Dependencies
- `@codesandbox/sandpack-react`: For JavaScript project sandbox
- `@codesandbox/sandpack-themes`: For theming Sandpack components
- Existing Pyodide integration for Python code execution

~~### Testing Strategy~~
~~1. Unit tests for artifact type detection~~
~~2. Integration tests for each artifact type~~
~~3. End-to-end tests with the chat interface~~
~~4. Performance testing for large projects in Sandpack~~

No automated tests needed unless explicitly requested.

USUALLY THE USER WILL TEST. You can do basic smoke tests. 

## Review and Retro (R1)

### Understanding of "code" Artifact Kind

After reviewing the implementation, I've identified a fundamental misunderstanding in our approach. The "code" artifact kind is not a fallback for all code artifacts - it's a specific artifact kind defined in the system. The existing architecture has a limited set of artifact kinds (`text`, `code`, `image`, `sheet`) as defined in the `ArtifactKind` type.

We've been trying to force our new artifact types (`python-file-pyodide`, `js-project-sandpack`, `html-fragment`) to use the "code" kind, which is causing TypeScript errors because:

1. The server handlers expect specific artifact kinds that match the type constraints
2. The client artifacts are defined with their specific kinds but we're trying to make them compatible with "code"

### Key Issues Identified

1. **Type Mismatch**: We're using `@ts-ignore` to bypass TypeScript errors rather than properly extending the type system to support our new artifact kinds.

2. **Overcomplication**: We're creating server handlers for all artifact types when some could be client-only, as you mentioned.

3. **Inconsistent Naming**: We're mixing naming conventions between the server handlers and client artifacts.

4. **Duplicate Exports**: We have multiple exports of the same handlers with different names, causing confusion.

5. **Detection Logic**: The artifact detection logic in `index.ts` has some issues with the conditional checks and return values.

### Will This Work When Tested?

**Prediction**: No, the current implementation will not work correctly when tested. Here's why:

1. The TypeScript errors indicate fundamental type mismatches that will cause runtime issues.

2. The server handlers are using "code" as their kind, but the client artifacts are using their specific kinds, which will cause inconsistencies in how they're processed.

3. The artifact detection logic has some bugs that will prevent it from correctly identifying the right artifact type.

4. We're missing proper integration between the server handlers and client artifacts.

### Better Approach

A better approach would be:

1. Understand that "code" is a specific artifact kind, not a generic fallback.

2. Either:
   - Extend the `ArtifactKind` type to include our new artifact kinds, or
   - Use the existing "code" kind for all code artifacts but differentiate them through metadata

3. Make the client artifacts use the same kind as their corresponding server handlers.

4. Simplify the detection logic to be more robust and consistent.

5. Remove unnecessary server handlers for client-only artifacts.

6. Ensure proper integration between the detection logic, server handlers, and client artifacts.

In the next iteration, we should focus on fixing these fundamental issues before adding more features.