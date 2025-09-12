# Seating Chart Application

A React/TypeScript application for teachers to efficiently generate and manage seating arrangements for their students.

## Features

- Input student roster (9-40 students)
- Configure table sizes (1, 2, or 4 students per table)
- Drag and drop student tiles to rearrange seating
- Lock/unlock students to prevent randomization
- Resizable and moveable tables
- Randomize button to shuffle unlocked students
- Visual classroom layout with front/back orientation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

1. Enter student names (one per line) in the roster
2. Select table size (1, 2, or 4 students)
3. Optionally specify number of tables (defaults to minimum required)
4. Click "Create Seating Chart" to generate the layout
5. Drag student tiles to rearrange manually
6. Click lock icons to prevent students from being randomized
7. Use "Randomize" button to shuffle unlocked students
8. Drag tables to reposition them in the classroom
9. Resize tables by dragging the bottom-right corner

## Technical Details

- Built with React 18 and TypeScript
- Uses react-draggable for drag and drop functionality
- Responsive design with modern UI components
- Validates minimum table requirements automatically
