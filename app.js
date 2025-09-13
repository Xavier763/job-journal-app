// Storage and state management
const STORAGE_KEY = 'jobJournalData';
const SETTINGS_KEY = 'jobJournalSettings';

// DOM elements
const calendar = document.getElementById('calendar');
const currentWeekSpan = document.getElementById('currentWeek');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const todayBtn = document.getElementById('todayBtn');
const dayModal = document.getElementById('dayModal');
const settingsModal = document.getElementById('settingsModal');
const weeklyReportModal = document.getElementById('weeklyReportModal');
const modalDate = document.getElementById('modalDate');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const description = document.getElementById('description');
const addEntryBtn = document.getElementById('addEntry');
const clearDayBtn = document.getElementById('clearDay');
const entriesList = document.getElementById('entriesList');
const bulkInput = document.getElementById('bulkInput');
const bulkImportBtn = document.getElementById('bulkImportBtn');
const settingsBtn = document.getElementById('settingsBtn');
const weeklyReportBtn = document.getElementById('weeklyReportBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

// Close buttons
const closeDayModal = document.getElementById('closeDayModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const closeWeeklyReportModal = document.getElementById('closeWeeklyReportModal');

// Settings elements
const scheduleMode = document.getElementById('scheduleMode');
const fixedDaysGroup = document.getElementById('fixedDaysGroup');
const holidayMode = document.getElementById('holidayMode');
const saveSettingsBtn = document.getElementById('saveSettings');

// Weekly report elements
const weeklyReportContent = document.getElementById('weeklyReportContent');
const copyReportBtn = document.getElementById('copyReport');
const exportReportBtn = document.getElementById('exportReport');

// Totals elements
const thisWeekTotal = document.getElementById('thisWeekTotal');
const lastWeekTotal = document.getElementById('lastWeekTotal');
const thisMonthTotal = document.getElementById('thisMonthTotal');

// State
let currentDate = new Date();
let selectedDate = null;
let workData = {};
let settings = {
    scheduleMode: 'flexible',
    fixedDays: [1, 2, 3, 4, 5], // Monday to Friday
    holidayMode: 'skip',
    darkMode: false
};

// Helper functions
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workData));
}

function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        workData = JSON.parse(stored);
    }
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        settings = { ...settings, ...JSON.parse(stored) };
    }
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function calculateDayTotal(entries) {
    return entries.reduce((total, entry) => {
        const start = parseTime(entry.startTime);
        const end = parseTime(entry.endTime);
        return total + (end - start);
    }, 0);
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    return new Date(d.setDate(diff));
}

function getWeekEnd(date) {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
}

function getWeekTotal(weekStart) {
    let total = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = formatDate(date);
        if (workData[dateStr]) {
            total += calculateDayTotal(workData[dateStr]);
        }
    }
    return total;
}

function getMonthTotal(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    let total = 0;
    
    for (const dateStr in workData) {
        const entryDate = new Date(dateStr);
        if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
            total += calculateDayTotal(workData[dateStr]);
        }
    }
    
    return total;
}

function updateTotals() {
    const today = new Date();
    const thisWeekStart = getWeekStart(today);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    const thisWeekTotalMinutes = getWeekTotal(thisWeekStart);
    const lastWeekTotalMinutes = getWeekTotal(lastWeekStart);
    const thisMonthTotalMinutes = getMonthTotal(today);
    
    thisWeekTotal.textContent = formatTime(thisWeekTotalMinutes);
    lastWeekTotal.textContent = formatTime(lastWeekTotalMinutes);
    thisMonthTotal.textContent = formatTime(thisMonthTotalMinutes);
}

// Schedule mode logic
function isScheduledDay(date) {
    if (settings.scheduleMode === 'flexible') {
        return false; // No scheduled days in flexible mode
    }
    
    if (settings.scheduleMode === 'five_fixed') {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Monday to Friday
    }
    
    if (settings.scheduleMode === 'three_fixed' || settings.scheduleMode === 'four_fixed') {
        const day = date.getDay();
        return settings.fixedDays.includes(day);
    }
    
    if (settings.scheduleMode === 'two23') {
        // 2-2-3 rotation logic
        const startDate = new Date('2024-01-01'); // Reference start date (Monday)
        const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const weekInCycle = Math.floor(daysDiff / 7) % 2;
        const dayOfWeek = date.getDay();
        
        if (weekInCycle === 0) {
            // First week: work Mon, Tue
            return dayOfWeek === 1 || dayOfWeek === 2;
        } else {
            // Second week: work Wed, Thu, Fri
            return dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5;
        }
    }
    
    return false;
}

function isHoliday(date) {
    // Simple holiday detection - you can expand this
    const holidays = [
        '2024-01-01', // New Year's Day
        '2024-07-04', // Independence Day
        '2024-12-25', // Christmas
        // Add more holidays as needed
    ];
    
    return holidays.includes(formatDate(date));
}

function shouldWorkOnDay(date) {
    if (isHoliday(date) && settings.holidayMode === 'skip') {
        return false;
    }
    
    return isScheduledDay(date);
}

// Calendar rendering
function renderCalendar() {
    calendar.innerHTML = '';
    
    // Add headers
    const headers = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    headers.forEach(header => {
        const headerEl = document.createElement('div');
        headerEl.className = 'calendar-header';
        headerEl.textContent = header;
        calendar.appendChild(headerEl);
    });
    
    const weekStart = getWeekStart(currentDate);
    const weekEnd = getWeekEnd(currentDate);
    
    // Update week display
    currentWeekSpan.textContent = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    
    // Add days
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dateStr = formatDate(date);
        const today = new Date();
        const isToday = formatDate(date) === formatDate(today);
        const hasWork = workData[dateStr] && workData[dateStr].length > 0;
        const isScheduled = shouldWorkOnDay(date);
        
        if (isToday) {
            dayEl.classList.add('today');
        }
        
        if (hasWork) {
            dayEl.classList.add('has-work');
        } else if (isScheduled) {
            dayEl.classList.add('scheduled');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayEl.appendChild(dayNumber);
        
        if (hasWork) {
            const total = calculateDayTotal(workData[dateStr]);
            const totalEl = document.createElement('div');
            totalEl.className = 'day-total';
            totalEl.textContent = formatTime(total);
            dayEl.appendChild(totalEl);
            
            const entriesEl = document.createElement('div');
            entriesEl.className = 'day-entries';
            entriesEl.textContent = workData[dateStr].map(entry => 
                `${entry.startTime}-${entry.endTime}`
            ).join(', ');
            dayEl.appendChild(entriesEl);
        }
        
        dayEl.addEventListener('click', () => openDayModal(date));
        calendar.appendChild(dayEl);
    }
    
    updateTotals();
}

// Modal functions
function openDayModal(date) {
    selectedDate = date;
    const dateStr = formatDate(date);
    modalDate.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Clear form
    startTime.value = '';
    endTime.value = '';
    description.value = '';
    
    renderEntries();
    dayModal.style.display = 'block';
}

function closeDayModalFn() {
    dayModal.style.display = 'none';
    selectedDate = null;
}

function renderEntries() {
    if (!selectedDate) return;
    
    const dateStr = formatDate(selectedDate);
    const entries = workData[dateStr] || [];
    
    entriesList.innerHTML = '';
    
    if (entries.length === 0) {
        entriesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No entries for this day</p>';
        return;
    }
    
    entries.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'entry-item';
        
        const duration = parseTime(entry.endTime) - parseTime(entry.startTime);
        
        entryEl.innerHTML = `
            <div class="entry-info">
                <div class="entry-time">${entry.startTime} - ${entry.endTime} (${formatTime(duration)})</div>
                <div class="entry-description">${entry.description}</div>
            </div>
            <div class="entry-actions">
                <button class="btn btn-danger btn-small" onclick="deleteEntry(${index})">Delete</button>
            </div>
        `;
        
        entriesList.appendChild(entryEl);
    });
}

function addEntry() {
    if (!selectedDate || !startTime.value || !endTime.value) {
        alert('Please fill in all required fields');
        return;
    }
    
    const start = parseTime(startTime.value);
    const end = parseTime(endTime.value);
    
    if (end <= start) {
        alert('End time must be after start time');
        return;
    }
    
    const dateStr = formatDate(selectedDate);
    if (!workData[dateStr]) {
        workData[dateStr] = [];
    }
    
    workData[dateStr].push({
        startTime: startTime.value,
        endTime: endTime.value,
        description: description.value || 'Work'
    });
    
    // Sort entries by start time
    workData[dateStr].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    
    saveToStorage();
    renderEntries();
    renderCalendar();
    
    // Clear form
    startTime.value = '';
    endTime.value = '';
    description.value = '';
}

function deleteEntry(index) {
    if (!selectedDate) return;
    
    const dateStr = formatDate(selectedDate);
    if (workData[dateStr]) {
        workData[dateStr].splice(index, 1);
        if (workData[dateStr].length === 0) {
            delete workData[dateStr];
        }
        saveToStorage();
        renderEntries();
        renderCalendar();
    }
}

function clearDay() {
    if (!selectedDate) return;
    
    if (confirm('Are you sure you want to clear all entries for this day?')) {
        const dateStr = formatDate(selectedDate);
        delete workData[dateStr];
        saveToStorage();
        renderEntries();
        renderCalendar();
    }
}

// Bulk import
function bulkImport() {
    const text = bulkInput.value.trim();
    if (!text) return;
    
    const lines = text.split('\n').filter(line => line.trim());
    let imported = 0;
    let errors = [];
    
    lines.forEach((line, lineNum) => {
        try {
            // Parse format: "Day HH:MM-HH:MM Description"
            const match = line.match(/^(mon|tue|wed|thu|fri|sat|sun)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+(.+)$/i);
            
            if (!match) {
                errors.push(`Line ${lineNum + 1}: Invalid format`);
                return;
            }
            
            const [, dayName, startTimeStr, endTimeStr, desc] = match;
            
            // Find the date for this day in the current week
            const weekStart = getWeekStart(currentDate);
            const dayIndex = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(dayName.toLowerCase());
            const targetDate = new Date(weekStart);
            targetDate.setDate(weekStart.getDate() + dayIndex);
            
            const dateStr = formatDate(targetDate);
            
            if (!workData[dateStr]) {
                workData[dateStr] = [];
            }
            
            workData[dateStr].push({
                startTime: startTimeStr,
                endTime: endTimeStr,
                description: desc.trim()
            });
            
            // Sort entries by start time
            workData[dateStr].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
            
            imported++;
        } catch (error) {
            errors.push(`Line ${lineNum + 1}: ${error.message}`);
        }
    });
    
    if (errors.length > 0) {
        alert(`Imported ${imported} entries with ${errors.length} errors:\n\n${errors.join('\n')}`);
    } else {
        alert(`Successfully imported ${imported} entries!`);
    }
    
    if (imported > 0) {
        saveToStorage();
        renderCalendar();
        bulkInput.value = '';
    }
}

// Settings
function openSettings() {
    scheduleMode.value = settings.scheduleMode;
    holidayMode.value = settings.holidayMode;
    
    // Update fixed days checkboxes
    const checkboxes = fixedDaysGroup.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = settings.fixedDays.includes(parseInt(checkbox.value));
    });
    
    updateFixedDaysVisibility();
    settingsModal.style.display = 'block';
}

function updateFixedDaysVisibility() {
    const showFixedDays = scheduleMode.value === 'three_fixed' || scheduleMode.value === 'four_fixed';
    fixedDaysGroup.style.display = showFixedDays ? 'block' : 'none';
}

function saveSettingsFn() {
    settings.scheduleMode = scheduleMode.value;
    settings.holidayMode = holidayMode.value;
    
    // Get fixed days from checkboxes
    const checkboxes = fixedDaysGroup.querySelectorAll('input[type="checkbox"]:checked');
    settings.fixedDays = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Set default fixed days for five_fixed mode
    if (settings.scheduleMode === 'five_fixed') {
        settings.fixedDays = [1, 2, 3, 4, 5]; // Monday to Friday
    }
    
    saveSettings();
    renderCalendar();
    settingsModal.style.display = 'none';
    alert('Settings saved!');
}

// Weekly report
function generateWeeklyReport() {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = getWeekEnd(currentDate);
    
    let report = `Weekly Report: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}\n`;
    report += '='.repeat(60) + '\n\n';
    
    let weekTotal = 0;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = formatDate(date);
        const entries = workData[dateStr] || [];
        
        report += `${days[i]}, ${date.toLocaleDateString()}\n`;
        report += '-'.repeat(30) + '\n';
        
        if (entries.length === 0) {
            report += 'No work logged\n\n';
        } else {
            let dayTotal = 0;
            entries.forEach(entry => {
                const duration = parseTime(entry.endTime) - parseTime(entry.startTime);
                dayTotal += duration;
                report += `${entry.startTime} - ${entry.endTime} (${formatTime(duration)}): ${entry.description}\n`;
            });
            report += `Day Total: ${formatTime(dayTotal)}\n\n`;
            weekTotal += dayTotal;
        }
    }
    
    report += '='.repeat(60) + '\n';
    report += `Week Total: ${formatTime(weekTotal)}\n`;
    
    weeklyReportContent.textContent = report;
    weeklyReportModal.style.display = 'block';
}

function copyReport() {
    navigator.clipboard.writeText(weeklyReportContent.textContent).then(() => {
        alert('Report copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy report:', err);
        alert('Failed to copy report to clipboard');
    });
}

function exportReport() {
    const blob = new Blob([weeklyReportContent.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${formatDate(getWeekStart(currentDate))}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Dark mode
function toggleDarkMode() {
    settings.darkMode = !settings.darkMode;
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    darkModeToggle.textContent = settings.darkMode ? '☀️' : '🌙';
    saveSettings();
}

function initializeDarkMode() {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    darkModeToggle.textContent = settings.darkMode ? '☀️' : '🌙';
}

// Event listeners
prevWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar();
});

nextWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar();
});

todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
});

addEntryBtn.addEventListener('click', addEntry);
clearDayBtn.addEventListener('click', clearDay);
bulkImportBtn.addEventListener('click', bulkImport);
settingsBtn.addEventListener('click', openSettings);
weeklyReportBtn.addEventListener('click', generateWeeklyReport);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Modal close events
closeDayModal.addEventListener('click', closeDayModalFn);
closeSettingsModal.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});
closeWeeklyReportModal.addEventListener('click', () => {
    weeklyReportModal.style.display = 'none';
});

// Settings events
scheduleMode.addEventListener('change', updateFixedDaysVisibility);
saveSettingsBtn.addEventListener('click', saveSettingsFn);

// Weekly report events
copyReportBtn.addEventListener('click', copyReport);
exportReportBtn.addEventListener('click', exportReport);

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === dayModal) {
        closeDayModalFn();
    }
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
    if (event.target === weeklyReportModal) {
        weeklyReportModal.style.display = 'none';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (dayModal.style.display === 'block') {
            closeDayModalFn();
        }
        if (settingsModal.style.display === 'block') {
            settingsModal.style.display = 'none';
        }
        if (weeklyReportModal.style.display === 'block') {
            weeklyReportModal.style.display = 'none';
        }
    }
});

// Initialize
loadSettings();
loadFromStorage();
initializeDarkMode();
renderCalendar();

// Make deleteEntry available globally
window.deleteEntry = deleteEntry;