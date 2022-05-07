import * as matchers from 'jest-immutable-matchers'
import * as R from 'ramda'
import { Map } from 'immutable';
import { TestScheduler } from 'rxjs/testing'
import { distinctUntilChanged } from '../src'

describe('Distinct until changed', () => {
  beforeEach(() => jest.addMatchers(matchers))

  it('Should understand native JS types', () => {
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })

    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers
      const e1 = cold(' -1--2--2-3-2-|');
      const e1subs = '  ^------------!'
      const expected = '-1--2----3-2-'
      expectObservable(e1.pipe(distinctUntilChanged), e1subs).toBe(expected)
    })
  })

  it('Should work with plain javascript objects', () => {
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers
      const e1 = cold(' -a--b--c---|', {
        a: { someKey: 'someValue' },
        b: { someKey: 'someValue' },
        c: { someKey: 'someValue' }
      })
      const e1subs = '  ^----------!'
      const expected = '-a---------'
      expectObservable(e1.pipe(distinctUntilChanged), e1subs).toBe(expected, {
        a: { someKey: 'someValue' }
      })
    })
  })

  
  it('Should understand immutable structures', () => {
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    })

    testScheduler.run(({cold, expectObservable}) => {
      const values = [
        Map({ a: 1 }),
        Map({ a: 2 }),
        Map({ a: 2 }),
        Map({ a: 3 }),
        Map({ a: 2 })
      ];

      const e1 = cold('-0-1-2-3-4-|', values);

      expectObservable(e1.pipe(distinctUntilChanged), '^- 20ms -!').toBe('-0-2---3-4-|', values);
    });
  })

  it('Should account for implemented equals method', () => {
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers
      const getSecondProp = R.prop('secondProp')
      const equalityFn = function (a) {
        return getSecondProp(a) === getSecondProp(this)
      }
      const values = {
        a: {
          someKey: 'someValue1',
          secondProp: 'thatIsSame',
          equals: equalityFn
        },
        b: {
          someKey: 'someValue2',
          secondProp: 'thatIsSame',
          equals: equalityFn
        },
        c: {
          someKey: 'someValue3',
          secondProp: 'thatIsSame',
          equals: equalityFn
        }
      }
      const e1 = cold(' -a--b--c---|', values)
      const e1subs = '  ^----------!'
      const expected = '-a---------'
      expectObservable(e1.pipe(distinctUntilChanged), e1subs).toBe(expected, {
        a: values.a
      })
    })
  })
})
