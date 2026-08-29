function RouteLink({ to, navigate, active = false, onClick, children, ...props }) {
  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} aria-current={active ? 'page' : undefined} {...props}>
      {children}
    </a>
  )
}

export default RouteLink
