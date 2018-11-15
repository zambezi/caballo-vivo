import { Subject } from '@reactivex/rxjs'
import log from './log'

export const followLink$ = new Subject().do(log('Follow link'))
export const jumpBack$ = new Subject().do(log('Jump back in history'))
export const followAnchor$ = new Subject().do(log('Follow anchor'))
