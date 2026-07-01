// ============================================================
// Alarm & Notification System
// ============================================================

const ALARM_SETTINGS_KEY = 'planlife_alarm_settings';

// تنظیمات پیش‌فرض
const DEFAULT_ALARMS = {
    morning: { hour: 6, minute: 0, enabled: true, sound: 'ding' },
    night: { hour: 24, minute: 0, enabled: true, sound: 'ding' }
};

// ذخیره و خواندن تنظیمات
function getAlarmSettings() {
    const stored = localStorage.getItem(ALARM_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ALARMS;
}

function saveAlarmSettings(settings) {
    localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(settings));
    console.log('✓ تنظیمات alarm ذخیره شد:', settings);
}

// درخواست دسترسی اطلاع‌رسانی
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('مرورگر از Notification پشتیبانی نمی‌کند');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    
    return false;
}

// تابع نمایش notification
async function showAlarmNotification(type) {
    const isGranted = await requestNotificationPermission();
    if (!isGranted) {
        console.log('دسترسی notification داده نشد');
        return;
    }

    const title = type === 'morning' 
        ? '🌅 صبح‌کاری - وقت تمرین صبح!' 
        : '🌙 شب - وقت تمرین شب!';
    
    const message = type === 'morning'
        ? 'صبحت بخیر! 👋\nوقتشه شروع روز قدرتمند کنی.\nتمرینات صبح رو انجام بده.'
        : 'شب بخیر! 🌙\nوقتشه روزت رو مرور کنی و برنامه‌ریزی معنوی کنی.\nتمرینات شب رو انجام بده.';

    try {
        new Notification(title, {
            body: message,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231a0033" width="192" height="192"/><text x="96" y="110" font-size="80" text-anchor="middle" dominant-baseline="middle">' + (type === 'morning' ? '🌅' : '🌙') + '</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><text x="96" y="110" font-size="80" text-anchor="middle" dominant-baseline="middle">' + (type === 'morning' ? '🌅' : '🌙') + '</text></svg>',
            tag: 'planlife-alarm-' + type,
            requireInteraction: false,
            vibrate: [200, 100, 200],
            actions: [
                { action: 'open', title: '🚀 شروع کن' },
                { action: 'close', title: 'بستن' }
            ]
        });
        
        // پخش صدا
        playAlarmSound(type);
    } catch(e) {
        console.error('خطا در نمایش notification:', e);
    }
}

// صدای alarm
function playAlarmSound(type) {
    // یک oscillator با صدای نرم دینگ
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = type === 'morning' ? 2.5 : 3;
    const now = audioContext.currentTime;
    
    // دینگ اول
    createDingSound(audioContext, now, 0.8, 880);
    // دینگ دوم (کمی تأخیر)
    createDingSound(audioContext, now + 0.4, 0.6, 660);
}

function createDingSound(audioContext, startTime, gain, frequency) {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    
    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    // Envelope: سریع raise، سپس نرم decay
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(gain, startTime + 0.05);
    envelope.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
    
    osc.connect(envelope);
    envelope.connect(audioContext.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 0.8);
}

// چک کردن alarm
function checkAndTriggerAlarms() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const settings = getAlarmSettings();
    
    // صبح
    if (settings.morning.enabled && 
        currentHour === settings.morning.hour && 
        currentMinute === settings.morning.minute) {
        
        const lastAlarmTime = sessionStorage.getItem('planlife_last_morning_alarm');
        const currentTime = new Date().getTime();
        
        if (!lastAlarmTime || (currentTime - parseInt(lastAlarmTime) > 60000)) {
            showAlarmNotification('morning');
            sessionStorage.setItem('planlife_last_morning_alarm', currentTime);
        }
    }
    
    // شب
    if (settings.night.enabled && 
        currentHour === settings.night.hour && 
        currentMinute === settings.night.minute) {
        
        const lastAlarmTime = sessionStorage.getItem('planlife_last_night_alarm');
        const currentTime = new Date().getTime();
        
        if (!lastAlarmTime || (currentTime - parseInt(lastAlarmTime) > 60000)) {
            showAlarmNotification('night');
            sessionStorage.setItem('planlife_last_night_alarm', currentTime);
        }
    }
}

// شروع alarm checker
function startAlarmChecker() {
    // چک کردن هر دقیقه
    setInterval(checkAndTriggerAlarms, 60000);
    // یک چک فوری
    checkAndTriggerAlarms();
    console.log('✓ Alarm checker شروع شد');
}

// تابع نمایش/بستن settings menu
function toggleAlarmSettings() {
    const settingsPanel = document.getElementById('alarm-settings-panel');
    if (settingsPanel.style.display === 'none') {
        settingsPanel.style.display = 'block';
        loadAlarmSettingsUI();
    } else {
        settingsPanel.style.display = 'none';
    }
}

// لود کردن UI تنظیمات
function loadAlarmSettingsUI() {
    const settings = getAlarmSettings();
    
    // صبح
    document.getElementById('morning-alarm-hour').value = settings.morning.hour;
    document.getElementById('morning-alarm-minute').value = String(settings.morning.minute).padStart(2, '0');
    document.getElementById('morning-alarm-enabled').checked = settings.morning.enabled;
    
    // شب
    document.getElementById('night-alarm-hour').value = settings.night.hour;
    document.getElementById('night-alarm-minute').value = String(settings.night.minute).padStart(2, '0');
    document.getElementById('night-alarm-enabled').checked = settings.night.enabled;
}

// ذخیره تنظیمات از UI
function saveAlarmSettingsFromUI() {
    const settings = {
        morning: {
            hour: parseInt(document.getElementById('morning-alarm-hour').value),
            minute: parseInt(document.getElementById('morning-alarm-minute').value),
            enabled: document.getElementById('morning-alarm-enabled').checked,
            sound: 'ding'
        },
        night: {
            hour: parseInt(document.getElementById('night-alarm-hour').value),
            minute: parseInt(document.getElementById('night-alarm-minute').value),
            enabled: document.getElementById('night-alarm-enabled').checked,
            sound: 'ding'
        }
    };
    
    saveAlarmSettings(settings);
    alert('✓ تنظیمات alarm با موفقیت ذخیره شد!');
}

// تست alarm
function testAlarm(type) {
    showAlarmNotification(type);
}

// شروع سیستم وقتی صفحه لود شود
window.addEventListener('load', function() {
    requestNotificationPermission();
    startAlarmChecker();
    console.log('🔔 سیستم alarm فعال شد');
});
