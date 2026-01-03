# Initialize Next.js with recommended defaults
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core dependencies
npm install mongodb lucide-react clsx tailwind-merge zod @monaco-editor/react

# Install Shadcn UI (Component Library)
npx shadcn@latest init

npm i

npm run dev
