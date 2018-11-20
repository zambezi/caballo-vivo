import { Subject } from 'rxjs'
import log from './log'

export const followLink$ = new Subject().do(log('Follow link'))
export const jumpBack$ = new Subject().do(log('Jump back in history'))
export const followAnchor$ = new Subject().do(log('Follow anchor'))
