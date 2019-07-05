import { Subject, Observable, race, empty } from 'rxjs'
import { map, scan, filter, tap, switchMap, delay } from 'rxjs/operators'
import log from './log'

const scrollToAnchor$ = new Subject()

scrollToAnchor$
  .pipe(
    map(state => ({
      hash: state.getIn(['location', 'hash'], null),
      navToken: state.getIn(['location', 'state', 'navToken'], null),
    })),
    scan(persistPreviousNavToken, {}),
    filter(shouldScroll),
    tap(log('Scroll to anchor')),
    map(({hash}) => {
      // selectors over ID are invalid if the ID starts with a number,
      // so use an ID-based attribute selector

      const id = hash.substring(1) // strip the # symbol to leave just the ID
      return `[id="${id}"]`
    }),
    switchMap(selector =>
      race(
        createImmediateElement$(selector),
        createEventualElement$(selector),
        empty().pipe(
          delay(10000),
          tap(log('Scroll to hash timed out'))
        )
      )
    )
  )
  .subscribe(scrollToElement)

export default scrollToAnchor$

function persistPreviousNavToken(
  { navToken: oldNavToken },
  { hash, navToken }
) {
  return { hash, navToken, oldNavToken }
}

function scrollToElement(element) {
  window.scrollBy(0, element.getBoundingClientRect().top - 25)
}

function createImmediateElement$(selector) {
  return Observable.create(o => {
    const element = document.querySelector(selector)
    if (!element) return

    o.next(element)
    o.complete()
  })
}

function createEventualElement$(selector) {
  return Observable.create(o => {
    const mutationObserver = new MutationObserver(onMutation)
    mutationObserver.observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
    })
    return () => mutationObserver.disconnect()
    function onMutation() {
      const element = document.querySelector(selector)
      if (!element) return
      o.next(element)
      o.complete()
    }
  })
}

function shouldScroll({ hash, navToken, oldNavToken }) {
  return hash && oldNavToken !== navToken
}
