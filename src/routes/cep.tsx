import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cep')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/cep"!</div>
}
