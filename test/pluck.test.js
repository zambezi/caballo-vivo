import * as matchers from 'jest-immutable-matchers'
import pluck from '../src/pluck'
import { Map, fromJS } from 'immutable'
import { of } from 'rxjs'
import { scan, finalize } from 'rxjs/operators'

describe('Pluck operator', () => {

  beforeEach(() => jest.addMatchers(matchers))

  it('Plucks simple keys', done => {
    const mockCallBack = jest.fn()
    of(Map({a: 1, b: 2}), fromJS({b: { nested: 'li mu bai'}}))
      .pipe(
        pluck('b'),
        finalize(() => {
          const calls = mockCallBack.mock.calls
          expect(calls[0][0]).toEqual(2)
          expect(calls[1][0]).toEqualImmutable(Map({nested: 'li mu bai'}))
          done()
        })
      )
      .subscribe(mockCallBack)
  })

  it('Plucks complex keys', done => {
    const mockCallBack = jest.fn()
    of(fromJS({a: 1, b: { c: 'sharp' }}), fromJS({b: { c: { nested: 'li mu bai'}} }))
      .pipe(
        pluck(['b', 'c']),
        finalize(() => {
          const calls = mockCallBack.mock.calls
          expect(calls[0][0]).toEqual('sharp')
          expect(calls[1][0]).toEqualImmutable(Map({nested: 'li mu bai'}))
          done()
        })
      )
      .subscribe(mockCallBack)
  })

})
