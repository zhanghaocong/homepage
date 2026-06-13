import React, { useEffect, useSyncExternalStore } from 'react'
import type { HomeController, HomeUiState } from '~/features/home/home.controller'

export const HomeControllerContext = React.createContext<HomeController | null>(null)

export function useHomeController() {
  const ret = React.useContext(HomeControllerContext)
  if (!ret) {
    throw new Error('HomeController is missing — wrap the tree in HomeControllerContext')
  }
  return ret
}

export function useHomeUi(): HomeUiState {
  const controller = useHomeController()
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
}

/** Bind controller lifecycle once the shell DOM refs are mounted. */
export function useHomeMount() {
  const controller = useHomeController()
  useEffect(() => {
    controller.attach()
    return () => controller.detach()
  }, [controller])
}
