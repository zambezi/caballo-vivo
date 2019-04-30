import * as matchers from 'jest-immutable-matchers'
import cached$ from '../src/cached'
import { Map, fromJS } from 'immutable'
import { of, concat, Observable } from 'rxjs'
import { scan, finalize } from 'rxjs/operators'

describe('Cached HoF', () => {

  beforeEach(() => jest.addMatchers(matchers))

  it('Should cache requests', done => {

    const mockCallBack = jest.fn()
    const mockInGenerator = jest.fn()

    const createObservable$ = cached$(key =>  {
      return Observable.create(
        o => {
          console.log('Inside the observable for', key)
          mockInGenerator(key)
          o.next(`${key}-${key}`)
          o.complete()
        }
      )
    })

    concat(
      createObservable$('a'),
      createObservable$('b'),
      createObservable$('a')
    )
      .pipe(
        finalize(
          () => {
            console.log('finalize')
            const handlerCalls = mockCallBack.mock.calls
            const generatorCalls = mockInGenerator.mock.calls

            expect(handlerCalls).toEqual([[ 'a-a' ], [ 'b-b' ], [ 'a-a' ] ])
            expect(generatorCalls).toEqual([[ 'a' ], [ 'b' ] ])

            done()
          }
        )
    ).subscribe(mockCallBack)
  })

})
