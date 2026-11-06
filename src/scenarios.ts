import { Cpu, Unplug, Zap } from 'lucide-react'
export const scenarios = {
  outage: {
    name: 'Region outage',
    subtitle: 'One region goes dark. Can the other keep up?',
    icon: Unplug,
    short: 'East region offline',
  },
  latency: {
    name: 'Slow dependency',
    subtitle: 'A slow service can be worse than a dead one.',
    icon: Cpu,
    short: 'East latency at 900 ms',
  },
  surge: {
    name: 'Traffic spike',
    subtitle: 'Triple the traffic. Find your breaking point.',
    icon: Zap,
    short: 'Traffic at 3× normal',
  },
}
