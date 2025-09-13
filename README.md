# Job Journal Scheduler

A web-based application for tracking work hours and managing job schedules with multiple scheduling modes and reporting features.

## Features

- **Calendar View**: Weekly calendar interface for easy time entry
- **Multiple Schedule Modes**: 
  - Flexible scheduling
  - 2-2-3 rotation
  - Fixed 3, 4, or 5-day schedules
- **Time Tracking**: Add, edit, and delete work entries
- **Bulk Import**: Import multiple entries at once
- **Weekly Reports**: Generate and export detailed weekly reports
- **Dark Mode**: Toggle between light and dark themes
- **Local Storage**: All data is stored locally in your browser

## Getting Started

1. Download or clone this repository
2. Run the PowerShell server script: `./server.ps1`
3. Open your browser and navigate to `http://localhost:8000`

## Usage

- Click on any day in the calendar to add work entries
- Use the Settings button to configure your schedule mode
- Generate weekly reports for time tracking
- Use bulk import for quick entry of multiple work sessions

## Files

- `index.html` - Main application interface
- `styles.css` - Application styling with light/dark theme support
- `app.js` - Core application logic and functionality
- `server.ps1` - Simple PowerShell HTTP server for local development

## Browser Compatibility

This application works in all modern browsers and uses local storage for data persistence.