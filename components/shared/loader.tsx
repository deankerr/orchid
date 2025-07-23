import 'ldrs/react/Square.css'

import { Square } from 'ldrs/react'

export function LoaderSquare() {
  return (
    <div className={'-translate-x-0.5 -translate-y-4'}>
      <Square
        size="35"
        stroke="5"
        strokeLength="0.25"
        bgOpacity="0.1"
        speed="1.2"
        color="#525252"
      />
    </div>
  )
}
