import createHistory from 'history/createBrowserHistory'
import log from './log'
import { empty, merge, concat, of, asyncScheduler, Observable } from 'rxjs'
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
  tap
} from 'rxjs/operators'

export const history = createHistory({
  getUserConfirmation: () => false,
  basename:
    process.env.REACT_APP_ROUTER_BASE_URL || process.env.PUBLIC_URL || '',
})

let programmaticNavigationTokens = Set()
let currentAction

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
  console.log('%c pathToIntent', 'background: pink', pathToIntent)

  return merge(
    createLocationHandler$(pathToIntent),
    concat(
      startLocation$.pipe(filter(hasNoHandlers(pathToIntent))),
      historyLocation$
    )
  ).pipe(
    map(completeState),
    map(completeQuery),
    map(unary(fromJS)),
    tap(log('Location broadcasted')),
    publishReplay(1),
    refCount()
  )
}

function createLocationHandler$(pathToIntent) {
  return concat(
    startLocation$.pipe(
      switchMap(toMaybeHandlerAndParams$),
    ),
    Observable.create(handlerForManagedPaths)
  )
  .pipe(
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
    history.block(blockManagedPaths(observer, pathToIntent))
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
    const handlerAndParams = locationToHandlerAndParams(
      location,
      pathToIntent
    )
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
