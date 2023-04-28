import log from './log'
import { createBrowserHistory } from 'history'
import { empty, merge, concat, of, asyncScheduler, Observable } from 'rxjs'
import { followLink$, jumpBack$, followAnchor$ } from './intents'
import { fromJS, Set, List, OrderedMap } from 'immutable'
import { matchPath } from 'react-router'
import { parse, stringify } from 'query-string'
import { unary, find, type, path } from 'ramda'
import {
  filter,
  map,
  observeOn,
  publishReplay,
  refCount,
  skip,
  switchMap,
  tap,
} from 'rxjs/operators'

let preventNavigationCallback = null
let continueNavigationCallback = null

export const preventNavigation = (callback) => {
  preventNavigationCallback = callback
  return () => {
    preventNavigationCallback = null
    continueNavigationCallback = null
  }
}

export const history = createBrowserHistory({
  getUserConfirmation: (_, historyCallback) => {
    if (preventNavigationCallback) {
      preventNavigationCallback(shouldContinue => {
        if (shouldContinue) {
          continueNavigationCallback ? continueNavigationCallback() : historyCallback(shouldContinue)
        }
      })
    } else {
      return false
    }
  },
  basename:
    process.env.REACT_APP_ROUTER_BASE_URL || process.env.PUBLIC_URL || '',
})

let programmaticNavigationTokens = Set()
let currentAction

followLink$.subscribe(location => history.push(location))
jumpBack$.subscribe(() => history.goBack())

const startLocation$ = of(history.location).pipe(
  observeOn(asyncScheduler),
  tap(log('Location at start')),
  publishReplay(1),
  refCount()
)

const historyLocation$ = Observable.create(observer => {
  history.listen(location => {
    observer.next(location)
    currentAction = null
  })
}).pipe(tap(log('Location from history.listen')))

export function createLocation$(pathToIntent) {
  return merge(
    createLocationHandler$(pathToIntent),
    startLocation$.pipe(filter(hasNoHandlers(pathToIntent))),
    historyLocation$
  ).pipe(
    map(completeState),
    map(completeQuery),
    map(unary(fromJS)),
    tap(log('Location broadcasted')),
    publishReplay(1),
    refCount()
  )
}

export function createNavigateTo$(
  pathname,
  state = {},
  query = {},
  action,
  hash
) {
  if (type(query) === 'String') query = parse(query)
  const navToken = generateNavToken()
  programmaticNavigationTokens = programmaticNavigationTokens.add(navToken)

  return of({
    pathname,
    state: { ...state, navToken },
    query,
    search: stringify(query),
    hash,
  }).pipe(
    tap(log(`Programmatic nav ${pathname} ${action || ''}`)),
    tap(location => {
      if (action === undefined) action = currentAction
      if (!action || action === 'PUSH') {
        history.push(location)
      } else {
        history.replace(location)
      }
    }),
    tap(() => {
      programmaticNavigationTokens = programmaticNavigationTokens.delete(
        navToken
      )
    }),
    skip()
  )
}

export const createRedirectTo$ = (pathname, state = {}, query = {}) =>
  createNavigateTo$(pathname, state, query, 'REPLACE')

export const anchorLocation$ = followAnchor$.pipe(
  switchMap(hash => {
    const navToken = generateNavToken()
    programmaticNavigationTokens = programmaticNavigationTokens.add(navToken)
    return of(
      fromJS(history.location)
        .set('hash', `#${hash.replace(/^#/, '')}`)
        .updateIn(['state', 'navToken'], () => navToken)
    ).pipe(
      tap(log('New location from anchor navigation')),
      tap(location => history.push(location.toJS())),
      tap(() => programmaticNavigationTokens.delete(navToken)),
      skip()
    )
  })
)

function createLocationHandler$(pathToIntent) {
  return concat(
    startLocation$.pipe(switchMap(toMaybeHandlerAndParams$)),
    Observable.create(handlerForManagedPaths)
  ).pipe(
    tap(log('Handling location from history block')),
    tap(runHandler),
    skip()
  )

  function toMaybeHandlerAndParams$(location) {
    const handlerAndParams = locationToHandlerAndParams(location, pathToIntent)
    return handlerAndParams
      ? of(handlerAndParams).pipe(tap(log('Initial location handler')))
      : empty()
  }

  function handlerForManagedPaths(observer) {
    return history.block(blockManagedPaths(observer, pathToIntent))
  }
}

function locationToHandlerAndParams(location, pathToIntent) {
  const { search, hash } = location
  let route
  const match = find(([path]) => {
    route = matchPath(location.pathname, { path, exact: true })
    return !!route
  }, List(OrderedMap(pathToIntent)))

  if (!match) return null
  return { params: route.params, handler: match[1], search, hash }
}

function blockManagedPaths(observer, pathToIntent) {
  return function testBlock(location, action) {
    if (isProgrammaticNavigation(location)) return undefined
    const handlerAndParams = locationToHandlerAndParams(location, pathToIntent)
    if (preventNavigationCallback) {
      continueNavigationCallback = handlerAndParams ? () => {
        currentAction = action
        handlerAndParams.action = action
        observer.next(handlerAndParams)
      } : null
      return 'blocked'
    }
    if (!handlerAndParams) return undefined
    currentAction = action
    handlerAndParams.action = action
    observer.next(handlerAndParams)
    return 'blocked'
  }
}

function isProgrammaticNavigation(newLocation) {
  const navToken = path(['state', 'navToken'], newLocation)
  const isProgrammatic = programmaticNavigationTokens.has(navToken)
  return isProgrammatic
}

function runHandler({ handler, params, search, action, hash }) {
  handler(params, search, action, hash)
}

function hasNoHandlers(pathToIntent) {
  return function filter(location) {
    const isManaged = !!locationToHandlerAndParams(location, pathToIntent)
    return !isManaged
  }
}

function completeState(location) {
  if (!location.state) location.state = {}
  return location
}

function completeQuery(location) {
  if (!location.query) location.query = parse(location.search || '')
  return location
}

function generateNavToken() {
  return (Date.now() + Math.random() * 0xfffff).toString(36).toUpperCase()
}
