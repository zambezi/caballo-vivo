import createHistory from 'history/createBrowserHistory'
import { Observable, Scheduler } from 'rxjs'
import { fromJS, Set } from 'immutable'
import { matchPath } from 'react-router'
import { unary, toPairs, find, type, path } from 'ramda'
import { parse, stringify } from 'query-string'
import { followLink$, jumpBack$, followAnchor$ } from './intents'
import log from './log'

export const history = createHistory({
  getUserConfirmation: () => false,
  basename:
    process.env.REACT_APP_ROUTER_BASE_URL || process.env.PUBLIC_URL || '',
})

let programmaticNavigationTokens = Set()

let currentAction

followLink$.subscribe(location => history.push(location))
jumpBack$.subscribe(() => history.goBack())

const historyLocation$ = Observable.create(observer => {
  history.listen(location => {
    observer.next(location)
    currentAction = null
  })
}).do(log('Location from history.listen'))

const startLocation$ = Observable.of(history.location)
  .observeOn(Scheduler.async)
  .do(log('Location at start'))
  .publishReplay(1)
  .refCount()

export const createLocation$ = pathToIntent =>
  Observable.merge(
    createLocationHandler$(pathToIntent),
    Observable.concat(
      startLocation$.filter(hasNoHandlers(pathToIntent)),
      historyLocation$
    )
  )
    .map(completeState)
    .map(completeQuery)
    .map(unary(fromJS))
    .do(log('Location broadcasted'))
    .publishReplay(1)
    .refCount()

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

  return Observable.of({
    pathname,
    state: { ...state, navToken },
    query,
    search: stringify(query),
    hash,
  })
    .do(log(`Programmatic nav ${pathname} ${action || ''}`))
    .do(location => {
      if (action === undefined) action = currentAction
      if (!action || action === 'PUSH') {
        history.push(location)
      } else {
        history.replace(location)
      }
    })
    .map(unary(fromJS))
    .map(location => state => state.set('location', location))
    .do(() => {
      programmaticNavigationTokens = programmaticNavigationTokens.delete(
        navToken
      )
    })
}

export const createRedirectTo$ = (pathname, state = {}, query = {}) =>
  createNavigateTo$(pathname, state, query, 'REPLACE')

export const anchorLocation$ = followAnchor$.switchMap(hash => {
  const navToken = generateNavToken()
  programmaticNavigationTokens = programmaticNavigationTokens.add(navToken)
  return Observable.of(
    fromJS(history.location)
      .set('hash', `#${hash.replace(/^#/, '')}`)
      .updateIn(['state', 'navToken'], () => navToken)
  )
    .do(log('New location from anchor navigation'))
    .do(location => history.push(location.toJS()))
    .map(location => state => state.set('location', location))
    .do(() => programmaticNavigationTokens.delete(navToken))
})

function runHandler({ handler, params, search, action, hash }) {
  handler(params, search, action, hash)
}

function completeState(location) {
  if (!location.state) location.state = {}
  return location
}

function completeQuery(location) {
  if (!location.query) location.query = parse(location.search || '')
  return location
}

function isProgrammaticNavigation(newLocation) {
  const navToken = path(['state', 'navToken'], newLocation)
  const isProgrammatic = programmaticNavigationTokens.has(navToken)
  return isProgrammatic
}

function generateNavToken() {
  return (Date.now() + Math.random() * 0xfffff).toString(36).toUpperCase()
}

function hasNoHandlers(pathToIntent) {
  return function filter(location) {
    const isManaged = !!locationToHandlerAndParams(location, pathToIntent)
    return !isManaged
  }
}

function createLocationHandler$(pathToIntent) {
  return Observable.concat(
    startLocation$.switchMap(location => {
      const handlerAndParams = locationToHandlerAndParams(
        location,
        pathToIntent
      )
      return handlerAndParams
        ? Observable.of(handlerAndParams).do(log('Initial location handler'))
        : Observable.empty()
    }),
    Observable.create(observer => {
      history.block(blockManagedPaths(observer, pathToIntent))
    }).do(log('Handling location from history.block'))
  )
    .do(runHandler)
    .skip()
}

function blockManagedPaths(observer, pathToIntent) {
  return function testBlock(location, action) {
    if (isProgrammaticNavigation(location)) return undefined
    const handlerAndParams = locationToHandlerAndParams(location, pathToIntent)
    if (!handlerAndParams) return undefined
    currentAction = action
    handlerAndParams.action = action
    observer.next(handlerAndParams)
    return 'blocked'
  }
}

function locationToHandlerAndParams(location, pathToIntent) {
  const { search, hash } = location
  let route
  const match = find(([path]) => {
    route = matchPath(location.pathname, { path, exact: true })
    return !!route
  }, toPairs(pathToIntent))

  if (!match) return null
  return { params: route.params, handler: match[1], search, hash }
}
