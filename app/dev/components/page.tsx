import { Suspense } from "react"
import { ComponentLibrary } from "./component-library"

export default function ComponentLibraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentLibrary />
    </Suspense>
  )
}