import { Cpu, Unplug, Zap } from 'lucide-react'
export const scenarios = {
  outage: {
    name: 'Region outage',
    subtitle: 'One Node.js API goes offline. Can the other keep up?',
    icon: Unplug,
    short: 'East region offline',
  },
  latency: {
    name: 'Slow dependency',
    subtitle: 'A Node.js API stalls while loading product data.',
    icon: Cpu,
    short: 'East latency at 900 ms',
  },
  surge: {
    name: 'Traffic spike',
    subtitle: 'A popular sale triples product page requests.',
    icon: Zap,
    short: 'Traffic at 3× normal',
  },
}
