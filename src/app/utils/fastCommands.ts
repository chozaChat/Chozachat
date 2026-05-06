const OPENWEATHER_API_KEY = '51677c8e092b88b18aabf4a27b66ffd9';

interface WeatherResponse {
  weather: Array<{ description: string; icon: string }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: { speed: number };
  name: string;
}

interface ForecastResponse {
  city: { name: string };
  list: Array<{
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
  }>;
}

export interface CommandResult {
  isCommand: boolean;
  shouldSend: boolean;
  response?: string;
  error?: string;
  success?: boolean;
  type?: 'weather' | 'time' | 'help' | 'error' | 'calc';
}

export async function processFastCommand(
  input: string,
  language: string,
  t: (key: string) => string
): Promise<CommandResult> {
  const trimmed = input.trim();
  let command = '';
  let args: string[] = [];

  // Check for natural language commands first (no prefix)
  const lowerInput = trimmed.toLowerCase();
  if (lowerInput.startsWith('weather ') || lowerInput.startsWith('погода ')) {
    command = 'weather';
    args = trimmed.split(' ').slice(1);
  } else if (lowerInput.startsWith('time ') || lowerInput.startsWith('время ')) {
    command = 'time';
    args = trimmed.split(' ').slice(1);
  } else if (lowerInput.startsWith('calc ') || lowerInput.startsWith('посчитать ') || lowerInput.startsWith('вычислить ')) {
    command = 'calc';
    const startWord = lowerInput.startsWith('calc ') ? 'calc' : (lowerInput.startsWith('посчитать ') ? 'посчитать' : 'вычислить');
    args = trimmed.split(' ').slice(startWord === 'calc' ? 1 : 1);
  } else if (lowerInput === 'help' || lowerInput === 'помощь') {
    command = 'help';
    args = [];
  } else if (trimmed.startsWith('/')) {
    // Command with / prefix
    const parts = trimmed.slice(1).split(' ');
    command = parts[0].toLowerCase();
    args = parts.slice(1);
  } else {
    // Not a command
    return { isCommand: false, shouldSend: true };
  }

  switch (command) {
    case 'weather': {
      if (args.length === 0) {
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: language === 'ru' ? 'Пожалуйста, введите город' : 'Please enter a location'
        };
      }

      const fullText = args.join(' ');

      // Detect command language from the text itself
      const commandLang = detectLanguage(fullText);
      const apiLang = commandLang === 'ru' ? 'ru' : 'en';

      // Parse location and time
      const { location, timeOffset, timeDescription } = parseWeatherTime(fullText, commandLang);

      if (!location) {
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: commandLang === 'ru' ? 'Пожалуйста, введите город' : 'Please enter a location'
        };
      }

      try {
        // If timeOffset is present, use forecast API
        if (timeOffset !== null) {
          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=${apiLang}`
          );

          if (!forecastResponse.ok) {
            return {
              isCommand: true,
              shouldSend: true,
              success: false,
              type: 'error',
              response: commandLang === 'ru'
                ? `Не удалось найти погоду: ${location}`
                : `Could not find weather: ${location}`
            };
          }

          const forecastData: ForecastResponse = await forecastResponse.json();

          // Find the closest forecast entry to the target time
          const targetTime = Date.now() + timeOffset;
          let closestEntry = forecastData.list[0];
          let minDiff = Math.abs(closestEntry.dt * 1000 - targetTime);

          for (const entry of forecastData.list) {
            const diff = Math.abs(entry.dt * 1000 - targetTime);
            if (diff < minDiff) {
              minDiff = diff;
              closestEntry = entry;
            }
          }

          const weatherEmoji = getWeatherEmoji(closestEntry.weather[0].icon);
          const weatherResponse = commandLang === 'ru'
            ? `${weatherEmoji} Погода: ${forecastData.city.name}${timeDescription ? ` (${timeDescription})` : ''}

Температура: ${Math.round(closestEntry.main.temp)}°C
Ощущается как: ${Math.round(closestEntry.main.feels_like)}°C
${closestEntry.weather[0].description}
Влажность: ${closestEntry.main.humidity}%
Ветер: ${Math.round(closestEntry.wind.speed)} м/с`
            : `${weatherEmoji} Weather: ${forecastData.city.name}${timeDescription ? ` (${timeDescription})` : ''}

Temperature: ${Math.round(closestEntry.main.temp)}°C
Feels like: ${Math.round(closestEntry.main.feels_like)}°C
${closestEntry.weather[0].description}
Humidity: ${closestEntry.main.humidity}%
Wind: ${Math.round(closestEntry.wind.speed)} m/s`;

          return {
            isCommand: true,
            shouldSend: true,
            success: true,
            type: 'weather',
            response: weatherResponse
          };
        }

        // Otherwise use current weather API
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=${apiLang}`
        );

        if (!response.ok) {
          return {
            isCommand: true,
            shouldSend: true,
            success: false,
            type: 'error',
            response: commandLang === 'ru'
              ? `Не удалось найти погоду: ${location}`
              : `Could not find weather: ${location}`
          };
        }

        const data: WeatherResponse = await response.json();

        const weatherEmoji = getWeatherEmoji(data.weather[0].icon);
        const weatherResponse = commandLang === 'ru'
          ? `${weatherEmoji} Погода: ${data.name}

Температура: ${Math.round(data.main.temp)}°C
Ощущается как: ${Math.round(data.main.feels_like)}°C
${data.weather[0].description}
Влажность: ${data.main.humidity}%
Ветер: ${Math.round(data.wind.speed)} м/с`
          : `${weatherEmoji} Weather: ${data.name}

Temperature: ${Math.round(data.main.temp)}°C
Feels like: ${Math.round(data.main.feels_like)}°C
${data.weather[0].description}
Humidity: ${data.main.humidity}%
Wind: ${Math.round(data.wind.speed)} m/s`;

        return {
          isCommand: true,
          shouldSend: true,
          success: true,
          type: 'weather',
          response: weatherResponse
        };
      } catch (error) {
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: commandLang === 'ru'
            ? `Не удалось получить погоду: ${location}`
            : `Could not get weather: ${location}`
        };
      }
    }

    case 'time':
    case 'время': {
      if (args.length === 0) {
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: language === 'ru' ? 'Пожалуйста, введите часовой пояс' : 'Please enter a timezone'
        };
      }

      const timezone = args.join(' ');

      try {
        const now = new Date();
        let formatter;
        let actualTz = timezone;
        let displayTz = timezone;

        // Check for GMT+/GMT- format
        const gmtMatch = timezone.match(/^GMT([+-]\d+)$/i);
        if (gmtMatch) {
          const offset = parseInt(gmtMatch[1]);
          // Convert GMT offset to Etc/GMT timezone (note: signs are reversed)
          actualTz = `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
          displayTz = `GMT${gmtMatch[1]}`;
        }

        try {
          formatter = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
            timeZone: actualTz,
            dateStyle: 'full',
            timeStyle: 'long'
          });
        } catch (e) {
          // If timezone is invalid, try common mappings
          const timezoneMap: Record<string, string> = {
            'moscow': 'Europe/Moscow',
            'москва': 'Europe/Moscow',
            'ny': 'America/New_York',
            'la': 'America/Los_Angeles',
            'london': 'Europe/London',
            'лондон': 'Europe/London',
            'tokyo': 'Asia/Tokyo',
            'токио': 'Asia/Tokyo',
            'paris': 'Europe/Paris',
            'париж': 'Europe/Paris',
          };

          const mappedTz = timezoneMap[timezone.toLowerCase()];
          if (!mappedTz) throw e;
          actualTz = mappedTz;
          displayTz = mappedTz;

          formatter = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
            timeZone: mappedTz,
            dateStyle: 'full',
            timeStyle: 'long'
          });
        }

        const timeResponse = language === 'ru'
          ? `🕐 Текущее время (${displayTz}):\n${formatter.format(now)}`
          : `🕐 Current Time (${displayTz}):\n${formatter.format(now)}`;

        return {
          isCommand: true,
          shouldSend: true,
          success: true,
          type: 'time',
          response: timeResponse
        };
      } catch (error) {
        console.error('Time command error:', error);
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: language === 'ru'
            ? `Не удалось получить время: ${timezone}`
            : `Could not get time: ${timezone}`
        };
      }
    }

    case 'calc':
    case 'посчитать':
    case 'вычислить': {
      if (args.length === 0) {
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: language === 'ru' ? 'Введите выражение для вычисления' : 'Enter an expression to calculate'
        };
      }

      const expression = args.join(' ');

      try {
        // Sanitize input - only allow numbers, operators, parentheses, and spaces
        const sanitized = expression.replace(/[^0-9+\-*/(). ]/g, '');

        if (!sanitized.trim()) {
          return {
            isCommand: true,
            shouldSend: true,
            success: false,
            type: 'error',
            response: language === 'ru' ? 'Недопустимое выражение' : 'Invalid expression'
          };
        }

        // Evaluate using Function constructor (safer than eval)
        const result = new Function(`return ${sanitized}`)();

        if (typeof result !== 'number' || !isFinite(result)) {
          return {
            isCommand: true,
            shouldSend: true,
            success: false,
            type: 'error',
            response: language === 'ru' ? 'Ошибка вычисления' : 'Calculation error'
          };
        }

        const calcResponse = language === 'ru'
          ? `🧮 Результат:

${expression} = ${result}`
          : `🧮 Result:

${expression} = ${result}`;

        return {
          isCommand: true,
          shouldSend: true,
          success: true,
          type: 'calc',
          response: calcResponse
        };
      } catch (error) {
        return {
          isCommand: true,
          shouldSend: true,
          success: false,
          type: 'error',
          response: language === 'ru' ? 'Ошибка вычисления' : 'Calculation error'
        };
      }
    }

    case 'help':
    case 'помощь': {
      const helpResponse = language === 'ru'
        ? `💡 Доступные команды:

📍 /weather [город] или "погода [город]"
   Пример: погода Москва
   С прогнозом:
   • погода Москва завтра
   • погода Москва через 3ч
   • погода Москва 3 мая
   • погода Москва 15.06
   • погода Москва 17:00

🕐 /time [часовой пояс] или "время [часовой пояс]"
   Пример: время GMT+3 или time Europe/Moscow

🧮 /calc [выражение] или "посчитать [выражение]"
   Пример: посчитать 2 + 2 * 5

❓ /help или "помощь" - Показать команды`
        : `💡 Available Commands:

📍 /weather [city] or "weather [city]"
   Example: weather Moscow
   With forecast:
   • weather Moscow tomorrow
   • weather Moscow in 3h
   • weather Moscow may 3rd
   • weather Moscow 15.06
   • weather Moscow 17:00

🕐 /time [timezone] or "time [timezone]"
   Example: time GMT+3 or time Europe/Moscow

🧮 /calc [expression] or "calc [expression]"
   Example: calc 2 + 2 * 5

❓ /help or "help" - Show commands`;

      return {
        isCommand: true,
        shouldSend: true,
        success: true,
        type: 'help',
        response: helpResponse
      };
    }

    default:
      return {
        isCommand: true,
        shouldSend: true,
        success: false,
        type: 'error',
        response: language === 'ru'
          ? 'Неизвестная команда. Напишите /help для списка команд'
          : 'Unknown command. Type /help for available commands'
      };
  }
}

function detectLanguage(text: string): 'ru' | 'en' {
  // Check for Cyrillic characters
  const cyrillicPattern = /[а-яё]/i;
  return cyrillicPattern.test(text) ? 'ru' : 'en';
}

function parseWeatherTime(text: string, language: string): {
  location: string;
  timeOffset: number | null;
  timeDescription: string;
} {
  const lowerText = text.toLowerCase();
  let location = text;
  let timeOffset: number | null = null;
  let timeDescription = '';

  // Check for specific time format HH:MM (works for both languages)
  const timeMatch = lowerText.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      // If target time is in the past today, assume tomorrow
      if (targetTime.getTime() < now.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      location = text.replace(/\d{1,2}:\d{2}/, '').trim();
      timeOffset = targetTime.getTime() - now.getTime();
      timeDescription = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return { location, timeOffset, timeDescription };
    }
  }

  // Russian patterns
  if (language === 'ru') {
    // "через Xч" or "через X часов"
    const hoursMatch = lowerText.match(/через\s+(\d+)\s*(?:ч|час)/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      location = text.replace(/через\s+\d+\s*(?:ч|час[а-я]*)/i, '').trim();
      timeOffset = hours * 3600 * 1000;
      timeDescription = `через ${hours}ч`;
      return { location, timeOffset, timeDescription };
    }

    // "завтра"
    if (lowerText.includes('завтра')) {
      location = text.replace(/завтра/i, '').trim();
      timeOffset = 24 * 3600 * 1000;
      timeDescription = 'завтра';
      return { location, timeOffset, timeDescription };
    }

    // "послезавтра"
    if (lowerText.includes('послезавтра')) {
      location = text.replace(/послезавтра/i, '').trim();
      timeOffset = 48 * 3600 * 1000;
      timeDescription = 'послезавтра';
      return { location, timeOffset, timeDescription };
    }

    // Date: "DD.MM"
    const dateMatch = lowerText.match(/(\d{1,2})\.(\d{1,2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = new Date().getFullYear();
      const targetDate = new Date(year, month, day, 12, 0, 0);
      location = text.replace(/\d{1,2}\.\d{1,2}/, '').trim();
      timeOffset = targetDate.getTime() - Date.now();
      timeDescription = `${day}.${month + 1}`;
      return { location, timeOffset, timeDescription };
    }

    // "3 мая", "15 июня"
    const monthNames: Record<string, number> = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
      'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
      'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };

    for (const [monthName, monthIndex] of Object.entries(monthNames)) {
      const monthMatch = lowerText.match(new RegExp(`(\\d{1,2})\\s+${monthName}`));
      if (monthMatch) {
        const day = parseInt(monthMatch[1]);
        const year = new Date().getFullYear();
        const targetDate = new Date(year, monthIndex, day, 12, 0, 0);
        location = text.replace(new RegExp(`\\d{1,2}\\s+${monthName}`, 'i'), '').trim();
        timeOffset = targetDate.getTime() - Date.now();
        timeDescription = `${day} ${monthName}`;
        return { location, timeOffset, timeDescription };
      }
    }
  } else {
    // English patterns
    // "in Xh" or "in X hours"
    const hoursMatch = lowerText.match(/in\s+(\d+)\s*(?:h|hour)/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      location = text.replace(/in\s+\d+\s*(?:h|hour[s]*)/i, '').trim();
      timeOffset = hours * 3600 * 1000;
      timeDescription = `in ${hours}h`;
      return { location, timeOffset, timeDescription };
    }

    // "tomorrow"
    if (lowerText.includes('tomorrow')) {
      location = text.replace(/tomorrow/i, '').trim();
      timeOffset = 24 * 3600 * 1000;
      timeDescription = 'tomorrow';
      return { location, timeOffset, timeDescription };
    }

    // Date: "DD.MM"
    const dateMatch1 = lowerText.match(/(\d{1,2})\.(\d{1,2})/);
    if (dateMatch1) {
      const day = parseInt(dateMatch1[1]);
      const month = parseInt(dateMatch1[2]) - 1;
      const year = new Date().getFullYear();
      const targetDate = new Date(year, month, day, 12, 0, 0);
      location = text.replace(/\d{1,2}\.\d{1,2}/, '').trim();
      timeOffset = targetDate.getTime() - Date.now();
      timeDescription = `${month + 1}.${day}`;
      return { location, timeOffset, timeDescription };
    }

    // "may 3rd", "june 15th"
    const monthNames: Record<string, number> = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11,
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
      'jun': 5, 'jul': 6, 'aug': 7,
      'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    for (const [monthName, monthIndex] of Object.entries(monthNames)) {
      const monthMatch = lowerText.match(new RegExp(`${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?`));
      if (monthMatch) {
        const day = parseInt(monthMatch[1]);
        const year = new Date().getFullYear();
        const targetDate = new Date(year, monthIndex, day, 12, 0, 0);
        location = text.replace(new RegExp(`${monthName}\\s+\\d{1,2}(?:st|nd|rd|th)?`, 'i'), '').trim();
        timeOffset = targetDate.getTime() - Date.now();
        timeDescription = `${monthName} ${day}`;
        return { location, timeOffset, timeDescription };
      }
    }
  }

  // No time found, return full text as location
  return { location, timeOffset, timeDescription };
}

function getWeatherEmoji(iconCode: string): string {
  const code = iconCode.slice(0, 2);
  const emojiMap: Record<string, string> = {
    '01': '☀️',
    '02': '⛅',
    '03': '☁️',
    '04': '☁️',
    '09': '🌧️',
    '10': '🌦️',
    '11': '⛈️',
    '13': '❄️',
    '50': '🌫️'
  };
  return emojiMap[code] || '🌤️';
}
