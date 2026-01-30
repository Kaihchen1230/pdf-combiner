# PDF Combiner - Project Instructions

## Build & Deploy Workflow

After every code change:
1. Build the Tauri app: `npm run tauri build`
2. Copy exe to desktop: `cp "C:/Users/a4890/OneDrive/Desktop/Dev/pdf-combiner/src-tauri/target/release/app.exe" "C:/Users/a4890/OneDrive/Desktop/PDF Combiner.exe"`

This ensures the user can immediately test changes.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Tauri 2.x (Rust backend)
- **PDF Processing**: pdf-lib (manipulation), pdfjs-dist (rendering)
- **State**: Zustand with persist middleware
- **Theme**: next-themes (light/dark/system)

## Key Directories

- `/src` - React frontend code
- `/src-tauri` - Tauri/Rust backend
- `/src/components` - UI components
- `/src/services` - PDF processing logic
- `/src/store` - Zustand state management
