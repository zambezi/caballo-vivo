import {
    createLocation$,
    createNavigateTo$,
    followLink$,
    preventNavigation,
} from '../src'

test('Block navigation and decide not to continue', done => {
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
            preventNavigation(cb => navigationCallback = cb)
            followLink$.next('/wherever')
            expect(locationSubscription.mock.calls.length).toBe(1)
            expect(getCurrentPathname()).toBe('/')
            setTimeout(() => {
                navigationCallback(false)
                expect(locationSubscription.mock.calls.length).toBe(1)
                expect(getCurrentPathname()).toBe('/')
                done()
            }, 0)
        }, 0)
})