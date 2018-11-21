import { createLocation$ } from '../src/location'
import { followLink$ } from '../src/intents'

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
