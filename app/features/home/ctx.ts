import React, { useEffect, useSyncExternalStore } from 'react'
import type { HomeController } from '~/features/home/home.controller'
import type { HomeState } from '~/features/home/state/homeState'

export const HomeControllerContext = React.createContext<HomeController | null>(null)

export function useHomeController() {
  const ret = React.useContext(HomeControllerContext)
  if (!ret) {
    throw new Error('HomeController is missing — wrap the tree in HomeControllerContext')
  }
  return ret
}

export function useHomeState(): HomeState {
  const controller = useHomeController()
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
}

/** @deprecated Prefer useHomeState */
export function useHomeUi(): HomeState {
  return useHomeState()
}

/** Bind controller lifecycle once the shell DOM refs are mounted. */
export function useHomeMount() {
  const controller = useHomeController()
  useEffect(() => {
    controller.attach()
    return () => controller.detach()
  }, [controller])
}
