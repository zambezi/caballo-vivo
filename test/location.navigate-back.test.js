import { createLocation$, createNavigateTo$ } from '../src/location'
import { jumpBack$, followLink$ } from '../src/intents'

test.only('Create location with a pathToIntent and navigate, then navigate back', done => {
  function whereverHandler(params, search, action, hash) {
    expect(params).toEqual({})
    expect(search).toBe('')
    expect(action).toBe('PUSH')
    expect(hash).toBe('')
    return createNavigateTo$('/wherever').subscribe()
  }

  const location$ = createLocation$({
    '/wherever': whereverHandler,
  })

  const locationSubscription = jest.fn(() => {
    const currentCall = locationSubscription.mock.calls.length - 1
    const currentCallParam = locationSubscription.mock.calls[currentCall][0]
    if (currentCall === 0) {
      expect(currentCallParam.get('pathname')).toBe('/')
      expect(currentCallParam.getIn(['state', 'navToken'])).toBeUndefined()
    } else if (currentCall === 1) {
      expect(currentCallParam.get('pathname')).toBe('/wherever')
      expect(currentCallParam.getIn(['state', 'navToken'])).toBeTruthy()
      jumpBack$.next()
    } else {
      expect(currentCallParam.get('pathname')).toBe('/')
      expect(currentCallParam.getIn(['state', 'navToken'])).toBeUndefined()
      done()
    }
  })

  location$.subscribe(locationSubscription)
  setTimeout(() => followLink$.next('/wherever'), 0)
})
