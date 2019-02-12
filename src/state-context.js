import React, { useContext } from 'react'

const StateContext = React.createContext('cv-state-context')

export function createStateContext(toView) {
  return function contextView(state) {
    return (
      <StateContext.Provider value={state}>
        {toView(state)}
      </StateContext.Provider>
    )
  }
}

export function useStateContext() {
  return useContext(StateContext)
}
