## Native Desktop App (Electrobun)

- Runtime: Bun
- Framework: Electrobun (native desktop app)
- Frontend: React + Vite + TailwindCSS v4 + shadcn/ui (dark theme)
- Main process: `src/main/index.ts`
- Renderer: `src/renderer/` (Vite root)
- shadcn components: `src/renderer/components/ui/`
- Path alias: `@/` -> `src/renderer/`

### Commands

- `bun run dev:vite` - Start Vite dev server only
- `bun run dev:electrobun` - Start Electrobun with watch mode
- `bun run dev` - Start both Vite + Electrobun
- `bun run build` - Production build (Vite + Electrobun)

### Adding shadcn components

Use `bunx shadcn@latest add <component>` to add new shadcn components.
