"use client"

import { useState, useEffect } from "react"
import SplashScreen from "@/components/splash-screen"
import HomeScreen from "@/components/home-screen"

export default function Page() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return <HomeScreen />
}
