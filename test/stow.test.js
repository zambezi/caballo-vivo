import * as matchers from 'jest-immutable-matchers'
import stow from '../src/stow'
import { Map, fromJS } from 'immutable'
import { of } from 'rxjs'
import { scan, finalize } from 'rxjs/operators'

describe('Stow operator', () => {

  beforeEach(() => jest.addMatchers(matchers))

  it('stows data with simple keys', done => {
    const mockCallBack = jest.fn()
    of('canarias', 'espóticas')
      .pipe(
        stow('islas'),
        scan(reduce, Map({a: 1})),
        finalize(() => {
          const calls = mockCallBack.mock.calls
          expect(calls[0][0]).toEqualImmutable(Map({a: 1, islas: 'canarias'}))
          expect(calls[1][0]).toEqualImmutable(Map({a: 1, islas: 'espóticas'}))
          done()
        })
      )
      .subscribe(mockCallBack)
  })

  it('stows data with nested keys', done => {
    const mockCallBack = jest.fn()
    of('canarias', 'espóticas')
      .pipe(
        stow(['mareas', 'islas']),
        scan(reduce, Map({a: 1 })),
        finalize(() => {
          const calls = mockCallBack.mock.calls
          expect(calls[0][0]).toEqualImmutable(fromJS({a: 1, mareas: {islas: 'canarias'}}))
          expect(calls[1][0]).toEqualImmutable(fromJS({a: 1, mareas: {islas: 'espóticas'}}))
          done()
        })
      )
      .subscribe(mockCallBack)
  })

})

function reduce(state, fn) {
  return fn(state)
}
