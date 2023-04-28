import {
  createLocation$,
  createNavigateTo$,
  followLink$,
  preventNavigation,
} from '../src'

test('Try to navigate with blocked navigation, then unblock navigation and try again', done => {
  function whereverHandler() {
    return createNavigateTo$('/wherever').subscribe()
  }
  
  const location$ = createLocation$({
    '/wherever': whereverHandler,
  })

  const locationSubscription = jest.fn()
  let navigationCallback;
  const getCurrentPathname = () => locationSubscription.mock.calls.at(-1)[0].get('pathname')
  location$.subscribe(locationSubscription)

  setTimeout(
    () => {
      expect(locationSubscription.mock.calls.length).toBe(1)
      expect(getCurrentPathname()).toBe('/')
      const unblockNavigation = preventNavigation(cb => navigationCallback = cb)
      followLink$.next('/wherever')
      expect(locationSubscription.mock.calls.length).toBe(1)
      expect(getCurrentPathname()).toBe('/')
      unblockNavigation()
      followLink$.next('/wherever')
      expect(locationSubscription.mock.calls.length).toBe(2)
      expect(getCurrentPathname()).toBe('/wherever')
      done()
    }, 0)
})
