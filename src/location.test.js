import { createLocation$, createNavigateTo$ } from './location'
import { followLink$ } from './intents'

test('Create location with a empty pathToIntent and follow a link', done => {
  const location$ = createLocation$({})
  const locationSubscription = jest.fn(() => {
    const currentCall = locationSubscription.mock.calls.length - 1
    const currentCallParam = locationSubscription.mock.calls[currentCall][0]
    if (!currentCall) {
      expect(currentCallParam.get('pathname')).toBe('/')
    } else {
      expect(currentCallParam.get('pathname')).toBe('/wherever')
      done()
    }
  })
  location$.subscribe(locationSubscription)
  setTimeout(() => followLink$.next('/wherever'), 0) // This is needed bacause history is listened too late
})

test('Create location with a pathToIntent and navigate', done => {
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
    if (!currentCall) {
      expect(currentCallParam.get('pathname')).toBe('/')
      expect(currentCallParam.getIn(['state', 'navToken'])).toBeUndefined()
    } else {
      expect(currentCallParam.get('pathname')).toBe('/wherever')
      expect(currentCallParam.getIn(['state', 'navToken'])).toBeTruthy()
      done()
    }
  })

  location$.subscribe(locationSubscription)
  setTimeout(() => followLink$.next('/wherever'), 0)
})
