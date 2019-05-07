import * as matchers from 'jest-immutable-matchers'
import { finalize } from 'rxjs/operators'
import { distinctUntilChanged } from '../src'
import { of } from 'rxjs'
import { Map, fromJS } from 'immutable'

describe('Distinct until changed', () => {
  beforeEach(() => jest.addMatchers(matchers))

  it('Should understand native JS types', done => {
    const mockCallBack = jest.fn()

    of(1, 2, 2, 3, 2)
      .pipe(
        distinctUntilChanged,
        finalize(() => {
          const calls = mockCallBack.mock.calls
          expect(calls).toEqual([[1], [2], [3], [2]])
          done()
        })
      )
      .subscribe(mockCallBack, fail)
  })

  it('Should understand immutable structures', done => {
    const mockCallBack = jest.fn()

    of(
      Map({ a: 1 }),
      Map({ a: 2 }),
      Map({ a: 2 }),
      Map({ a: 3 }),
      Map({ a: 2 })
    )
      .pipe(
        distinctUntilChanged,
        finalize(() => {
          const calls = fromJS(mockCallBack.mock.calls)
          expect(calls).toEqualImmutable(
            fromJS([[{ a: 1 }], [{ a: 2 }], [{ a: 3 }], [{ a: 2 }]])
          )
          done()
        })
      )
      .subscribe(mockCallBack, fail)
  })
})
