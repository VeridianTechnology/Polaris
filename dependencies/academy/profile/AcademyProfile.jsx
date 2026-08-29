import { useEffect, useMemo, useState } from 'react'
import AcademyAvatar, { academyProfileAvatarPath } from '../AcademyAvatar'
import { isSupabaseConfigured, supabase } from '../supabaseClient'
import { AgoraAdminBadge } from '../auth/AgoraLoginDialog'
import '../academy-avatar.css'
import './academy-profile.css'

const MAX_BIO_CHARACTERS = 400

const EMPTY_PROFILE = {
  profile_number: 1,
  username: 'nyx',
  display_name: 'NYX',
  avatar_index: 0,
  bio: '',
  twitter_url: '',
  instagram_url: '',
  facebook_url: '',
  snapchat_url: '',
  email: '',
  email_is_public: false,
  anonymous_mode: false,
  is_owner: false,
  is_admin: false,
}

const SOCIAL_FIELDS = [
  { key: 'twitter_url', label: 'Twitter / X', mark: 'X', placeholder: 'https://x.com/nyx' },
  { key: 'instagram_url', label: 'Instagram', mark: '◎', placeholder: 'https://instagram.com/nyx' },
  { key: 'facebook_url', label: 'Facebook', mark: 'f', placeholder: 'https://facebook.com/nyx' },
  { key: 'snapchat_url', label: 'Snapchat', mark: '◉', placeholder: 'https://snapchat.com/add/nyx' },
]

function normalizeProfile(row, fallbackNumber) {
  return {
    ...EMPTY_PROFILE,
    ...row,
    profile_number: row?.profile_number ?? fallbackNumber,
    twitter_url: row?.twitter_url || '',
    instagram_url: row?.instagram_url || '',
    facebook_url: row?.facebook_url || '',
    snapchat_url: row?.snapchat_url || '',
    email: row?.email || '',
    bio: row?.bio || '',
  }
}

function normalizeOptionalUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function AcademyProfile({ profileNumber, authSession, onLogin, onReturn, onOpenAdmin }) {
  const [profile, setProfile] = useState(() => ({ ...EMPTY_PROFILE, profile_number: profileNumber }))
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'unconfigured')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const formattedNumber = useMemo(
    () => String(profile.profile_number || profileNumber).padStart(4, '0'),
    [profile.profile_number, profileNumber],
  )
  const isEditable = Boolean(profile.is_owner && authSession?.profile_number === profileNumber)
  const canOpenAdmin = Boolean(
    authSession?.is_admin
    && authSession?.username?.toLowerCase() === 'nyx'
    && authSession?.profile_number === profileNumber
  )

  useEffect(() => {
    if (!supabase) return undefined
    if (!authSession?.session_token) {
      setStatus('login-required')
      setNotice('Log in to view Agora profiles.')
      return undefined
    }
    let cancelled = false

    async function loadProfile() {
      const { data, error } = await supabase.rpc('get_agora_profile', {
        p_profile_number: profileNumber,
        p_session_token: authSession?.session_token || null,
      })

      if (cancelled) return
      if (error) {
        setStatus('error')
        setNotice(`${error.message} Run the August 29 Agora private-read security migration if it has not been applied yet.`)
        return
      }
      const row = Array.isArray(data) ? data[0] : data
      if (!row) {
        setStatus('not-found')
        setNotice(`Profile #${String(profileNumber).padStart(4, '0')} does not exist.`)
        return
      }

      setProfile(normalizeProfile(row, profileNumber))
      setStatus('ready')
    }

    loadProfile()
    return () => { cancelled = true }
  }, [authSession?.session_token, profileNumber])

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!supabase || !isEditable || saving) return
    if (!profile.display_name.trim()) {
      setNotice('A display name is required.')
      return
    }
    if (profile.bio.length > MAX_BIO_CHARACTERS) {
      setNotice('The bio is limited to 400 characters.')
      return
    }

    setSaving(true)
    setNotice('')
    const normalizedSocials = Object.fromEntries(
      SOCIAL_FIELDS.map(({ key }) => [key, normalizeOptionalUrl(profile[key])]),
    )
    const { error } = await supabase.rpc('update_agora_profile', {
      p_session_token: authSession.session_token,
      p_display_name: profile.display_name.trim(),
      p_avatar_index: profile.avatar_index,
      p_bio: profile.bio,
      p_twitter_url: normalizedSocials.twitter_url,
      p_instagram_url: normalizedSocials.instagram_url,
      p_facebook_url: normalizedSocials.facebook_url,
      p_snapchat_url: normalizedSocials.snapchat_url,
      p_email: profile.email.trim(),
      p_email_is_public: profile.email_is_public,
      p_anonymous_mode: profile.anonymous_mode,
    })

    if (error) {
      setNotice(error.message)
      setSaving(false)
      return
    }

    setProfile((current) => ({ ...current, ...normalizedSocials }))
    setNotice('Profile saved.')
    setSaving(false)
  }

  return (
    <section className="academy-profile-page" aria-label={`Agora profile ${formattedNumber}`}>
      <aside className="academy-profile-sidebar" aria-label="Profile navigation">
        <p className="academy-profile-sidebar__section">Global</p>
        <p className="academy-profile-sidebar__label">Overview</p>
        <button type="button" onClick={onReturn}>Global</button>
        <span className="is-active">Profile</span>
        <p className="academy-profile-sidebar__label">Settings</p>
        <span>Account</span>
      </aside>

      <div className="academy-profile-shell">
        <div className="academy-profile-actions">
          <button className="academy-profile-return" type="button" onClick={onReturn}>← Return to Global</button>
          {canOpenAdmin && (
            <button className="academy-profile-admin" type="button" onClick={onOpenAdmin}>
              <AgoraAdminBadge large />
              <span>Open administration</span>
            </button>
          )}
        </div>

        {status === 'loading' && <p className="academy-profile-message">Loading profile…</p>}
        {status === 'unconfigured' && <p className="academy-profile-message">Add the Supabase project URL and publishable key to load profiles.</p>}
        {status === 'login-required' && <p className="academy-profile-message">Log in to view Agora profiles. <button type="button" onClick={onLogin}>Log in</button></p>}

        {(status === 'ready' || status === 'not-found' || status === 'error') && (
          <form className="academy-profile-form" onSubmit={saveProfile}>
            <header className="academy-profile-identity">
              <div className="academy-profile-portrait">
                <AcademyAvatar index={profile.avatar_index} alt={`${profile.display_name} profile`} />
                <span>{isEditable ? 'Change icon' : 'Profile icon'}</span>
              </div>
              <div className="academy-profile-heading">
                <label>
                  <span className="visually-hidden">Display name</span>
                  <input value={profile.display_name} onChange={(event) => updateField('display_name', event.target.value.slice(0, 80))} maxLength="80" readOnly={!isEditable} />
                </label>
                <p>@{profile.username}{profile.is_admin && <AgoraAdminBadge large />}</p>
                <div><span aria-hidden="true" /> Profile No. {formattedNumber}</div>
              </div>
              <AcademyAvatar index={profile.avatar_index} className="academy-profile-identity__seal" alt="" />
            </header>

            {isEditable && (
              <fieldset className="academy-profile-icons">
                <legend>Select profile icon</legend>
                <div>
                  {Array.from({ length: 8 }, (_, index) => (
                    <button className={profile.avatar_index === index ? 'is-selected' : ''} type="button" key={index} onClick={() => updateField('avatar_index', index)} aria-label={`Select profile icon ${index + 1}`} aria-pressed={profile.avatar_index === index}>
                      <img src={academyProfileAvatarPath(index)} alt="" />
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="academy-profile-columns">
              <section className="academy-profile-panel academy-profile-panel--bio">
                <div className="academy-profile-panel__title"><span>Bio</span><span>{profile.bio.length}/{MAX_BIO_CHARACTERS}</span></div>
                <textarea value={profile.bio} onChange={(event) => updateField('bio', event.target.value.slice(0, MAX_BIO_CHARACTERS))} maxLength={MAX_BIO_CHARACTERS} placeholder={isEditable ? 'Write a short bio…' : 'No bio yet.'} readOnly={!isEditable} rows="7" />
              </section>

              <section className="academy-profile-panel academy-profile-panel--settings">
                <label className="academy-profile-toggle">
                  <span><strong>Anonymous mode</strong><small>New Global posts appear as ANON and cannot open this profile.</small></span>
                  <input type="checkbox" checked={profile.anonymous_mode} onChange={(event) => updateField('anonymous_mode', event.target.checked)} disabled={!isEditable} />
                  <span className="academy-profile-toggle__track" aria-hidden="true" />
                </label>

                <div className="academy-profile-connections">
                  <h2>Connections</h2>
                  {SOCIAL_FIELDS.map((field) => (
                    <label key={field.key}>
                      <span className="academy-profile-social-mark" aria-hidden="true">{field.mark}</span>
                      <span>{field.label}</span>
                      <input type="url" value={profile[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} readOnly={!isEditable} />
                    </label>
                  ))}
                </div>

                <div className="academy-profile-email">
                  <label><span>Email</span><input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@example.com" readOnly={!isEditable} /></label>
                  <label className="academy-profile-email__public"><input type="checkbox" checked={profile.email_is_public} onChange={(event) => updateField('email_is_public', event.target.checked)} disabled={!isEditable} /> Public</label>
                </div>
              </section>
            </div>

            {notice && <p className={`academy-profile-message${status === 'error' ? ' is-error' : ''}`} role="status">{notice}</p>}
            {isEditable ? <button className="academy-profile-save" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button> : status === 'ready' && <p className="academy-profile-readonly">Public profile view</p>}
          </form>
        )}
      </div>
    </section>
  )
}

export default AcademyProfile
