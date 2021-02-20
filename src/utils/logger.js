/* eslint-disable no-console */
const isChrome =
  /Chrome/.test(window.navigator.userAgent) && /Google Inc/.test(window.navigator.vendor);
export var LogLevel;
(function (LogLevel) {
  LogLevel['LOG'] = 'LOG';
  LogLevel['INFO'] = 'INFO';
  LogLevel['WARN'] = 'WARN';
  LogLevel['ERROR'] = 'ERROR';
})(LogLevel || (LogLevel = {}));
export const LoggingLevel = {
  VERBOSE: 100000,
  [LogLevel.LOG]: 10000,
  [LogLevel.INFO]: 1000,
  [LogLevel.WARN]: 100,
  [LogLevel.ERROR]: 10,
  NONE: 0,
};
export class LoggerSettings {
  constructor(_store) {
    this._store = _store;
    this.setSettings = getter => {
      this._store = getter(this.getSettings());
    };
  }
  setAggregator(aggregator) {
    this._store.aggregator = aggregator;
  }
  getSettings() {
    return this._store;
  }
}
export class Logger {
  constructor(_name, settings) {
    this._name = _name;
    this.settings = settings;
  }
  get name() {
    return this._name || '';
  }
  static getTimestamp() {
    return `${new Date().toLocaleTimeString(
      'en-GB',
    )}:${new Date().getMilliseconds().toString().padEnd(3)}`;
  }
  static get nameFormat() {
    return Logger.getBoxStyles('white', 'black');
  }
  static get timestampFormat() {
    return Logger.getBoxStyles('white', 'gray');
  }
  static getBoxStyles(color, background) {
    return `color: ${color}; background: ${background}; border-radius: 5px; margin-right: 0.5em; padding: 0.1em 1em;`;
  }
  static getLevelFormat(level) {
    switch (level) {
      case LogLevel.INFO:
        return Logger.getBoxStyles('white', 'blue');
      case LogLevel.LOG:
        return Logger.getBoxStyles('white', 'gray');
      case LogLevel.WARN:
        return Logger.getBoxStyles('black', 'orange');
      case LogLevel.ERROR:
        return Logger.getBoxStyles('white', 'red');
      default:
        return Logger.getBoxStyles('white', 'gray');
    }
  }
  getGroupMethod(level) {
    const { expand, internalLogger } = this.settings.getSettings();
    const { group, groupCollapsed } = internalLogger;
    return expand[level] ? group : groupCollapsed;
  }
  getLogMethod(level) {
    const { internalLogger } = this.settings.getSettings();
    const { log, warn, error } = internalLogger;
    switch (level) {
      case LogLevel.INFO:
        return log;
      case LogLevel.LOG:
        return log;
      case LogLevel.WARN:
        return warn;
      case LogLevel.ERROR:
        return error;
      default:
        return log;
    }
  }
  sendToAggregator(...args) {
    const { aggregator } = this.settings.getSettings();
    if (!aggregator) {
      return;
    }
    aggregator.send(...args).catch(e => {
      this.emit({
        level: LogLevel.ERROR,
        message: e,
        withoutAggregator: true,
      });
    });
  }
  static formatValue(value) {
    /**
     * In the other browsers we don't have an API to customize logged value styles
     * so we don't want to have just nonformatted messages like '%cMessage color: someColor;'
     * so we disabling any formatting on the non-Chrome browsers and make ASCII-like format
     */
    return isChrome ? `%c${value}` : ` [ ${value} ] `;
  }
  static formatPrefix(prefixValue, logLevel) {
    const prefix = [prefixValue];
    /**
     * In the other browsers we don't have an API to customize logged value styles
     * so we don't want to have just nonformatted messages like '%cMessage color: someColor;'
     * so we disabling any formatting on the non-Chrome browsers and make ASCII-like format
     */
    if (isChrome) {
      prefix.push(Logger.timestampFormat);
      prefix.push(Logger.nameFormat);
      prefix.push(Logger.getLevelFormat(logLevel));
    }
    return prefix;
  }
  emit({ message, level, withoutAggregator }) {
    const timestamp = Logger.getTimestamp();
    if (!withoutAggregator) {
      this.sendToAggregator({ message, level }, timestamp);
    }
    const { loggingLevel, internalLogger } = this.settings.getSettings();
    if (loggingLevel < LoggingLevel[level]) {
      return;
    }
    const groupMethod = this.getGroupMethod(level);
    const logMethod = this.getLogMethod(level);
    const formattedTimestamp = Logger.formatValue(timestamp);
    const formattedName = Logger.formatValue(this.name);
    const formattedLevel = Logger.formatValue(level);
    const prefix = Logger.formatPrefix(
      `${formattedTimestamp}${formattedName}${formattedLevel}`,
      level,
    );
    groupMethod(...prefix);
    logMethod(...message);
    internalLogger.groupEnd();
  }
  warn(msg, ...args) {
    this.emit({
      level: LogLevel.WARN,
      message: [msg, ...args],
    });
  }
  info(msg, ...args) {
    this.emit({
      level: LogLevel.INFO,
      message: [msg, ...args],
    });
  }
  log(msg, ...args) {
    this.emit({
      level: LogLevel.LOG,
      message: [msg, ...args],
    });
  }
  error(msg, ...args) {
    this.emit({
      level: LogLevel.ERROR,
      message: [msg, ...args],
    });
  }
}

/**
 * Global logger settings singleton
 *
 * @example
 * // Set the new settings for the logger
 * GlobalLoggerSettings.setSettings(oldSettings => ({
 *    ...oldSettings,
 *    expandError: true
 * }));
 *
 * // Set the log aggregator
 * GlobalLoggerSettings.setAggregator({
 *    send: async message => {
 *      console.log('aggregator', message);
 *    },
 * });
 */
export const GlobalLoggerSettings = new LoggerSettings({
  expand: {
    [LogLevel.INFO]: true,
    [LogLevel.LOG]: true,
    [LogLevel.WARN]: true,
    [LogLevel.ERROR]: true,
  },
  loggingLevel: LoggingLevel.VERBOSE,
  internalLogger: window.console,
});

export class LoggerInstance extends Logger {
  constructor(name) {
    super(name, GlobalLoggerSettings);
  }
}

export const logger = new LoggerInstance('CKEDITOR');
export const createLogger = name => new LoggerInstance(name);
