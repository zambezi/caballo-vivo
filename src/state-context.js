import React, { useContext } from 'react'

const StateContext = React.createContext('cv-state-context')

export function createStateContext(toView) {
  return function contextView(state) {
    return React.createElement(StateContext.Provider, { value: state }, toView(state))
  }
}

export function useStateContext() {
  return useContext(StateContext)
}
