export function academyProfileAvatarPath(index = 0) {
  const safeIndex = Math.min(7, Math.max(0, Number(index) || 0)) + 1
  return `/academy-profile-${String(safeIndex).padStart(2, '0')}.jpg`
}

function AcademyAvatar({ index = 0, anonymous = false, className = '', alt = '' }) {
  const classes = `academy-avatar${anonymous ? ' academy-avatar--anonymous' : ''}${className ? ` ${className}` : ''}`

  if (anonymous) {
    return <span className={classes} aria-label={alt || 'Anonymous user'}>A</span>
  }

  return <img className={classes} src={academyProfileAvatarPath(index)} alt={alt} />
}

export default AcademyAvatar
