import { memoizeWith, identity } from 'ramda'
import shareLast from './share-last'

export default function cached$(create$, key = identity) {
  return memoizeWith(key, withReplay$)
  function withReplay$(key) {
    return create$(key).pipe(shareLast)
  }
}
