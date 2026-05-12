# DailyFOSS Development Guidelines

## Core Principles

### 🎯 Always Read Skills Before Implementing

**MANDATORY**: Before implementing any feature, component, or functionality, you MUST:

1. **Check Available Skills**: Use the `skill` tool to list and read all available skills
2. **Relevant Skills**: Identify skills relevant to your current task
3. **Apply Best Practices**: Follow the specific best practices and patterns outlined in those skills
4. **Skill-First Development**: Let the skills guide your implementation approach

### 🛠️ Available Skills Categories

- **Frontend Design**: For UI components, layouts, and styling
- **Vue.js**: Vue 3 Composition API, components, and best practices
- **TypeScript**: Advanced types and type safety
- **Build Tools**: Vite configuration and optimization
- **Linting**: oxlint configuration and code quality

### 📋 Implementation Checklist

Before writing any code:

- [ ] Read relevant skills for the technology stack
- [ ] Follow Vue 3 Composition API with `<script setup>` (unless project requires Options API)
- [ ] Use TypeScript for type safety
- [ ] Apply oxlint for code quality
- [ ] Follow responsive design principles
- [ ] Ensure accessibility standards

### 🔄 Development Workflow

1. **Skill Assessment**: Read skills related to the task
2. **Planning**: Create/update todo list based on skill recommendations
3. **Implementation**: Follow skill-guided patterns
4. **Validation**: Ensure code meets skill-defined standards
5. **Integration**: Test within the DailyFOSS context

### 🚨 Critical Rules

- **NEVER skip skill reading** - This is non-negotiable
- **ALWAYS use Composition API** with `<script setup>` for Vue components
- **ALWAYS use TypeScript** for type safety
- **ALWAYS run oxlint** after code changes
- **ALWAYS follow responsive design** principles

### 📚 Skill Integration Examples

#### Vue Components
```vue
<script setup lang="ts">
// Follow vue-best-practices skill guidelines
import { ref, computed } from 'vue'
</script>

<template>
  <!-- Follow frontend-design skill for UI -->
</template>
```

#### TypeScript
```typescript
// Follow typescript-advanced-types skill for complex types
interface AppData {
  id: string
  name: string
  category: string
}
```

#### Build Configuration
```typescript
// Follow vite skill for build optimization
export default defineConfig({
  // Vite best practices
})
```

## Project-Specific Guidelines

### DailyFOSS Context
- Focus on open-source software curation
- Community-driven content
- Responsive, accessible design
- Modern web technologies

### Code Quality Standards
- oxlint for JavaScript/TypeScript linting
- Prettier for code formatting
- TypeScript for type safety
- Vue 3 Composition API

### Performance Considerations
- Lazy loading for large datasets
- Optimized bundle sizes
- Efficient state management with Pinia

---

**Remember**: Skills are your primary development resource. Always read them first!
