export function StackContext() {
  return (
    <div className="stack-context">
      <span className="stack-label">EXAMPLE STACK / SHOPPING APP</span>
      <strong>Picture a product page loading.</strong>
      <p>
        The <b>React frontend</b> asks for product data. An <b>NGINX load balancer</b> sends the
        request to one of two <b>Node.js API servers</b>. Those are two copies of the same backend,
        running in different regions.
      </p>
    </div>
  )
}

export function DependencyContext() {
  return (
    <div className="dependency-context">
      <span className="stack-label">BEHIND THE API / NOT SIMULATED HERE</span>
      <p>
        A <b>Redis cache</b> can keep frequently requested product data ready. A{' '}
        <b>PostgreSQL database</b> can store the product catalog. This lab focuses on routing and
        API failures, so it does not model cache hits or database queries.
      </p>
    </div>
  )
}
