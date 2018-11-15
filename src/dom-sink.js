import { partialRight } from 'ramda'
import { render } from 'react-dom'

export const domSink = partialRight(render, [document.getElementById('root')])
