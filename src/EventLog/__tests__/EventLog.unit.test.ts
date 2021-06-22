import { EventLog } from '../EventLog';

describe('EventLog()', () => {
  describe('static meetsThreshold(a: LogLevel | undefined, b: EchoLevel | undefined)', () => {
    it('should return false if level a < level b', () => {
      expect(
        EventLog.meetsThreshold('warn', 'error')
      ).toBe(false);
    });

    it('should return true if level a >= level b', () => {
      expect(
        EventLog.meetsThreshold('info', 'debug')
      ).toBe(true);
    });

    it("no value should meet the threshold of 'off'", () => {
      expect(
        EventLog.meetsThreshold('error', undefined)
      ).toBe(false);
    });

    it('an undefined logLevel should never meet a threshold', () => {
      expect(
        // Doesn't meet the lowest threshold
        EventLog.meetsThreshold(undefined, 'debug')
      ).toBe(false);
      expect(
        // Doesn't meet the threshold of 'off'
        EventLog.meetsThreshold(undefined, 'off')
      ).toBe(false);
    });
  });

  describe('static merge(:EventLog)', () => {
    it('should return a new EventLog containing all events from the EventLog instances in the array', () => {
      const eventLog1 = new EventLog({ echoLevel: 'debug', echoDetail: 'event' })
        .info('First', { id: 'any', data: { key: 'sample data', array: [1, 2], nested: { a: 1, b: 2 } } })
        .warn('Second');
      const eventLog2 = new EventLog()
        .warn('Last');
      const expectedMessages = [
        'Info: First',
        'Warn: Second',
        'Warn: Last',
      ];

      const mergedEventLog = EventLog.merge([eventLog1, eventLog2]);
      expect(mergedEventLog.getMessages()).toStrictEqual(expectedMessages);
    });
  });

  describe('get events.error', () => {
    it("should be an alias for getEvents('error')", () => {
      const eventLog = new EventLog();
      eventLog.error('Error event');
      const expectedMessages = eventLog.getEvents('error');

      const actualMessages = eventLog.events.error;
      expect(actualMessages).toStrictEqual(expectedMessages);
    });
  });

  describe('get messages', () => {
    it('should return a dictionary of messages of all levels', () => {
      // Example of method chaining
      const eventLog = new EventLog()
        .error('Error 1')
        .warn('Warning')
        .error('Error 2');

      expect(eventLog.messages.error).toStrictEqual([
        'Error 1',
        'Error 2',
      ]);
      expect(eventLog.messages.warn).toStrictEqual([
        'Warning',
      ]);
    });

    it('if there are no messages, should return an empty array', () => {
      const eventLog = new EventLog();
      expect(eventLog.messages.error).toStrictEqual([]);
      expect(eventLog.messages.warn).toStrictEqual([]);
      expect(eventLog.messages.info).toStrictEqual([]);
      expect(eventLog.messages.debug).toStrictEqual([]);
    });
  });

  describe('addEvent()', () => {
    it('should add the event to the EventLog', () => {
      const eventLog = new EventLog();
      expect(eventLog.count()).toBe(0);
      expect(eventLog.hasEvents).toBe(false);

      eventLog.addEvent('error', 'An error occurred');

      expect(eventLog.count()).toBe(1);
      expect(eventLog.hasEvents).toBe(true);
      expect(eventLog.events.error).toHaveLength(1);
      expect(eventLog.events.error[0]).toMatchObject({
        level: 'error',
        message: 'An error occurred',
      });
    });

    it('should use a type option passed to the constructor', () => {
      const eventLog = new EventLog({ type: 'validation' })
        .error('Message');
      const expectedEvent = { message: 'Message', type: 'validation' };

      const actualEvents = eventLog.getEvents();
      expect(actualEvents).toHaveLength(1);
      expect(actualEvents[0]).toMatchObject(expectedEvent);
    });

    it('given a type option, should override the default type passed to the constructor', () => {
      const eventLog = new EventLog({ type: 'validation' })
        .error('Message', { type: 'not validation' });
      const expectedEvent = { message: 'Message', type: 'not validation' };

      const actualEvents = eventLog.getEvents();
      expect(actualEvents).toHaveLength(1);
      expect(actualEvents[0]).toMatchObject(expectedEvent);
    });

    it('indentLevel for an event should default to the value set on the EventLog instance', () => {
      const eventLog = new EventLog();
      eventLog.addEvent('info', 'no indentLevel');
      eventLog.indentLevel = 1;
      eventLog.warn('has indentLevel');
      const expectedEvents = [
        {
          level: 'info',
          message: 'no indentLevel',
        },
        {
          indentLevel: 1,
          level: 'warn',
          message: 'has indentLevel',
        },
      ];

      const actualEvents = eventLog.getEvents();
      expect(actualEvents).toStrictEqual(expectedEvents);
    });

    it('if indentLevel is not set, should not add it to the event', () => {
      const eventLog = new EventLog();
      eventLog.addEvent('info', 'no indentLevel');
      const expectedEvent = {
        level: 'info',
        message: 'no indentLevel',
      };

      const actualEvents = eventLog.getEvents();
      expect(actualEvents).toHaveLength(1);
      expect(actualEvents[0]).toStrictEqual(expectedEvent);
    });

    it('if indentLevel is set, should add it to the event', () => {
      const eventLog = new EventLog();
      eventLog.addEvent('info', 'has indentLevel', { indentLevel: 0 });
      eventLog.error('has indentLevel', { indentLevel: 1 });
      const expectedEvents = [
        {
          indentLevel: 0,
          level: 'info',
          message: 'has indentLevel',
        },
        {
          indentLevel: 1,
          level: 'error',
          message: 'has indentLevel',
        },
      ];

      const actualEvents = eventLog.getEvents();
      expect(actualEvents).toStrictEqual(expectedEvents);
    });
  });

  it('if baseIndentLevel is set to anything but 0, should add it to the event', () => {
    const eventLog = new EventLog({ baseIndentLevel: 1 });
    eventLog.info('baseIndentLevel');
    const expectedEvent = {
      indentLevel: 1,
      level: 'info',
      message: 'baseIndentLevel',
    };

    const actualEvents = eventLog.getEvents();
    expect(actualEvents).toHaveLength(1);
    expect(actualEvents[0]).toStrictEqual(expectedEvent);
  });

  it('if both indentLevel and baseIndentLevel are set, should add their sum to the event', () => {
    const eventLog = new EventLog({ baseIndentLevel: 1 });
    eventLog.info('baseIndentLevel+indentLevel', { indentLevel: 1 });
    const expectedEvent = {
      indentLevel: 2,
      level: 'info',
      message: 'baseIndentLevel+indentLevel',
    };

    const actualEvents = eventLog.getEvents();
    expect(actualEvents).toHaveLength(1);
    expect(actualEvents[0]).toStrictEqual(expectedEvent);
  });

  describe('append(...eventLogs: EventLog[])', () => {
    it('should return a new EventLog containing all events from the EventLog arguments', () => {
      const addendumLog = new EventLog({ echoLevel: 'error' })
        .error('Second')
        .warn('Third');
      const expectedMessages = [
        'Warn: First',
        'Error: Second',
        'Warn: Third',
        'Error: Last',
      ];

      const baseLog = new EventLog({ echoLevel: 'warn' })
        .warn('First')
        .append(addendumLog)
        .error('Last');
      const actualMessages = baseLog.getMessages();

      expect(actualMessages).toStrictEqual(expectedMessages);
    });
  });

  describe('count(?:LogLevel)', () => {
    it('should return the number of events in the log', () => {
      const eventLog = new EventLog()
        .info('info 1')
        .debug('debug')
        .info('info 2')
        .warn('warn');
      expect(eventLog.count()).toBe(4);
      expect(eventLog.count('debug')).toBe(1);
      expect(eventLog.count('info')).toBe(2);
      expect(eventLog.count('warn')).toBe(1);
      expect(eventLog.count('error')).toBe(0);
    });
  });

  describe('get counts', () => {
    it('should return an object containing counts for each log level', () => {
      const eventLog = new EventLog()
        .info('info 1')
        .debug('debug')
        .info('info 2')
        .warn('warn');
      const expected = {
        debug: 1,
        info: 2,
        warn: 1,
        error: 0,
      };

      const actual = eventLog.counts;
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('debug(), error(), info() & warn()', () => {
    it('should be a shorthand for addEvent() but return the instance to allow chaining', () => {
      const eventLog = new EventLog()
        .debug('Chained debug')
        .error('Chained error')
        .info('Chained info')
        .warn('Chained warning');
      const expectedMessages = [
        'Debug: Chained debug',
        'Error: Chained error',
        'Info: Chained info',
        'Warn: Chained warning',
      ];

      const actualMessages = eventLog.getMessages();
      expect(actualMessages).toStrictEqual(expectedMessages);
      expect(eventLog.count()).toBe(4);
      expect(eventLog.hasEvents).toBe(true);
    });
  });

  describe('filterEvents({ minLevel: LogLevel, maxLevel: LogLevel, omitLevel: boolean )', () => {
    it('should return the events meeting the constraints', () => {
      const eventLog = new EventLog();
      eventLog.debug('Debug event');
      eventLog.info('Info event');
      eventLog.warn('Warn event');
      eventLog.error('Error event');

      const sets = [
        {
          params: { minLevel: 'warn' } as const,
          expectedMessages : ['Warn event', 'Error event'],
        },
        {
          params: { minLevel: 'debug', maxLevel: 'info' } as const,
          expectedMessages : ['Debug event', 'Info event'],
        },
        {
          params: { maxLevel: 'debug' } as const,
          expectedMessages : ['Debug event'],
        },
      ];
      sets.forEach(( { params, expectedMessages }) => {
        expect(eventLog.filterEvents(params).map(
          event => event.message
        )).toStrictEqual(expectedMessages);
        expect(
          eventLog.filterMessages(params, { omitLevel: true })
        ).toStrictEqual(expectedMessages);
      });
    });
  });

  describe('getEvents()', () => {
    it('should return all events', () => {
      interface Data { key: string }
      expect.assertions(2);

      const eventLog = new EventLog();
      eventLog.info<Data>( 'Info event', { data: { key: 'typed value' } });
      eventLog.debug('Debug event');


      const [firstEvent] = eventLog.getEvents<Data>();
      if (firstEvent) {
        const { key } = firstEvent.data || {};
        expect(key).toBe('typed value');
      }

      expect(eventLog.getEvents()).toHaveLength(2);
    });

    it('if logLevel is given, should return events only of that level', () => {
      const eventLog = new EventLog();
      eventLog.info('Info event');
      eventLog.debug('Debug event');

      expect(eventLog.getEvents('debug')).toHaveLength(1);
    });
  });

  describe('getMessages()', () => {
    it('should return the messages from the events', () => {
      const eventLog = new EventLog();
      eventLog.debug('Debug event');
      eventLog.error('Error event');
      eventLog.info('Info event');
      eventLog.warn('Warn event');

      expect(eventLog.getMessages()).toStrictEqual([
        'Debug: Debug event',
        'Error: Error event',
        'Info: Info event',
        'Warn: Warn event',
      ]);
    });

    it('if there are no messages, should return an empty array', () => {
      const eventLog = new EventLog();
      expect(eventLog.getMessages()).toStrictEqual([]);
    });

    it('if logLevel is given, should return messages only of that level', () => {
      const eventLog = new EventLog();
      eventLog.warn('Warn event');
      eventLog.error('Error event');

      expect(eventLog.getMessages('error')).toStrictEqual([
        'Error: Error event',
      ]);
    });
  });

  describe('has(:LogLevel)', () => {
    it('should return true if there are any events', () => {
      const eventLog = new EventLog();
      eventLog.info('Info event');
      expect(eventLog.has()).toBe(true);
    });

    it('should return false if there are no events', () => {
      const eventLog = new EventLog();
      expect(eventLog.has()).toBe(false);
    });

    it('if logLevel is given, should ignore events having a different level', () => {
      const eventLog = new EventLog();
      eventLog.info('Info event');

      expect(eventLog.has()).toBe(true);
      expect(eventLog.has('info')).toBe(true);
      expect(eventLog.has('error')).toBe(false);
    });
  });

  describe('has(:LogLevel)', () => {
    it('if there are no events, should return false', () => {
      expect(new EventLog().has()).toBe(false);
    });

    it('if logLevel is given, should return false if there are no events of that level', () => {
      const eventLog = new EventLog();
      eventLog.info('Info event');

      expect(eventLog.has('info')).toBe(true);
      const absentLogLevels = ['debug', 'error', 'warn'] as const;
      absentLogLevels.forEach(level => {
        expect(eventLog.has(level)).toBe(false);
      });
    });

    it('if logLevel is given, should return true if there are any events of that level', () => {
      const eventLog = new EventLog();
      eventLog.info('Info event');
      eventLog.warn('Warn event');

      expect(eventLog.has('error')).toBe(false);
    });
  });

  describe('highestLevel', () => {
    it('should return the highest level among all events', () => {
      const eventLog = new EventLog();

      eventLog.info('Info event');
      eventLog.warn('Warn event');
      eventLog.debug('Debug event');

      expect(eventLog.highestLevel).toBe('warn');
    });

    it('if there are no events, should return undefined', () => {
      const eventLog = new EventLog();

      expect(eventLog.highestLevel).toBeUndefined();
    });
  });

  describe('ok', () => {
    it('should return true if no messages were added', () => {
      const eventLog = new EventLog();
      expect(eventLog.ok).toBe(true);
    });

    it('should return true if no errors occurred', () => {
      const eventLog = new EventLog()
        .debug('Debug event')
        .info('Info event')
        .warn('Warn event');

      expect(eventLog.ok).toBe(true);
    });

    it('should return false if any errors occurred', () => {
      const eventLog = new EventLog()
        .error('Error event');

      expect(eventLog.ok).toBe(false);
    });
  });
});
