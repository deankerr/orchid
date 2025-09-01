import { Button } from '@/components/ui/button'
import { ComponentFrame } from '../component-frame'

export function ButtonComponents() {
  return (
    <>
      <ComponentFrame title="Default Button">
        <Button>Click me</Button>
      </ComponentFrame>

      <ComponentFrame title="Secondary Button">
        <Button variant="secondary">Secondary</Button>
      </ComponentFrame>

      <ComponentFrame title="Outline Button">
        <Button variant="outline">Outline</Button>
      </ComponentFrame>

      <ComponentFrame title="Ghost Button">
        <Button variant="ghost">Ghost</Button>
      </ComponentFrame>

      <ComponentFrame title="Small Button">
        <Button size="sm">Small</Button>
      </ComponentFrame>

      <ComponentFrame title="Large Button">
        <Button size="lg">Large Button</Button>
      </ComponentFrame>
    </>
  )
}