import { useEffect, useMemo, useRef, useState } from 'react'
import AcademyAvatar from './AcademyAvatar'
import { getAcademyVisitorId } from './academyIdentity'
import {
  countVisibleCharacters,
  extractLinks,
  getLinkHostname,
  getYouTubeVideoId,
  inspectPostLinks,
  MAX_POST_LINK_LENGTH,
  MAX_POST_LINKS,
  textWithoutLinks,
} from './academyLinks'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { AgoraAdminBadge } from './auth/AgoraLoginDialog'
import { academyProfilePath } from '../../routing/routes'
import './academy-avatar.css'
import './academy-board.css'

const REACTIONS_KEY = 'polaris-academy-reactions'
const MAX_VISIBLE_CHARACTERS = 500
const MAX_BODY_CHARACTERS = 5000

const ACADEMY_INFO = {
  about: { title: 'What Is This?', artwork: '/academy-what-is-this.png' },
  rules: { title: 'Rules', artwork: '/academy-rules.png' },
}

function formatRelativeTime(value) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (elapsedSeconds < 60) return 'now'
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`
  return `${Math.floor(elapsedHours / 24)}d ago`
}

function formatCountdown(value, now) {
  if (!value) return ''
  const remaining = Math.max(0, new Date(value).getTime() - now)
  if (remaining <= 0) return ''
  const seconds = Math.ceil(remaining / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const trailingSeconds = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(trailingSeconds).padStart(2, '0')}`
}

function normalizeComment(row) {
  return {
    id: row.id,
    postNumber: row.post_number,
    profileNumber: row.profile_number,
    name: row.author_name || 'Agora Member',
    createdAt: row.created_at,
    message: row.body,
    avatar: row.avatar_index ?? 0,
    likes: row.likes_count ?? 0,
    dislikes: row.dislikes_count ?? 0,
    isAnonymous: Boolean(row.is_anonymous),
    isAdmin: Boolean(row.author_is_admin),
  }
}

function readStoredReactions() {
  try {
    return JSON.parse(localStorage.getItem(REACTIONS_KEY) || '{}')
  } catch {
    return {}
  }
}

function LinkPreview({ url }) {
  const videoId = getYouTubeVideoId(url)
  const hostname = getLinkHostname(url)

  return (
    <a className={`academy-link-preview${videoId ? ' academy-link-preview--youtube' : ''}`} href={url} target="_blank" rel="noreferrer">
      {videoId ? (
        <span className="academy-link-preview__image-wrap">
          <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="YouTube video preview" />
          <span className="academy-link-preview__play" aria-hidden="true">▶</span>
        </span>
      ) : (
        <span className="academy-link-preview__domain-mark" aria-hidden="true">↗</span>
      )}
      <span className="academy-link-preview__copy">
        <strong>{videoId ? 'YouTube video' : hostname}</strong>
        <span>{url}</span>
      </span>
    </a>
  )
}

function AcademyBoard({ navigate, authSession, userCount = 0, onLogin, onOpenAdmin }) {
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [feedStatus, setFeedStatus] = useState(isSupabaseConfigured ? 'loading' : 'unconfigured')
  const [notice, setNotice] = useState('')
  const [posting, setPosting] = useState(false)
  const [deletingNumber, setDeletingNumber] = useState(null)
  const [reactingId, setReactingId] = useState(null)
  const [reactions, setReactions] = useState(readStoredReactions)
  const [activeInfo, setActiveInfo] = useState(null)
  const [postStatus, setPostStatus] = useState(null)
  const [profile, setProfile] = useState({ avatar_index: 0, display_name: 'NYX', is_admin: false })
  const [now, setNow] = useState(Date.now())
  const modalCloseRef = useRef(null)
  const modalScrollRef = useRef(null)
  const infoTriggerRef = useRef(null)
  const visibleCharacterCount = useMemo(() => countVisibleCharacters(draft), [draft])
  const linkInspection = useMemo(() => inspectPostLinks(draft), [draft])
  const countdown = formatCountdown(postStatus?.next_post_at, now)
  const cooldownActive = Boolean(countdown) && !authSession?.is_admin
  const canPublish = Boolean(
    draft.trim()
    && draft.length <= MAX_BODY_CHARACTERS
    && visibleCharacterCount <= MAX_VISIBLE_CHARACTERS
    && !linkInspection.hasTooMany
    && !linkInspection.hasOversizedLink
    && !linkInspection.hasUnsafeLink
    && supabase
    && authSession
    && !posting
    && postStatus?.can_post
    && !cooldownActive
  )

  useEffect(() => {
    if (!cooldownActive) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [cooldownActive])

  useEffect(() => {
    if (!activeInfo) return undefined
    const previousOverflow = document.body.style.overflow
    const focusFrame = requestAnimationFrame(() => modalCloseRef.current?.focus())
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveInfo(null)
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === modalCloseRef.current) {
          event.preventDefault()
          modalScrollRef.current?.focus()
        } else if (!event.shiftKey && document.activeElement === modalScrollRef.current) {
          event.preventDefault()
          modalCloseRef.current?.focus()
        }
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      requestAnimationFrame(() => infoTriggerRef.current?.focus())
    }
  }, [activeInfo])

  const loadPostStatus = async () => {
    if (!supabase || !authSession?.session_token) {
      setPostStatus(null)
      return
    }
    const [statusResult, profileResult] = await Promise.all([
      supabase.rpc('agora_post_status', { p_session_token: authSession.session_token }),
      supabase.rpc('get_agora_profile', {
        p_profile_number: authSession.profile_number,
        p_session_token: authSession.session_token,
      }),
    ])

    if (statusResult.error) {
      setNotice(statusResult.error.message)
      return
    }

    const nextStatus = Array.isArray(statusResult.data) ? statusResult.data[0] : statusResult.data
    const nextProfile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data
    setPostStatus(nextStatus || null)
    if (nextProfile) setProfile(nextProfile)
    setNow(Date.now())
  }

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false

    async function loadBoard() {
      const accountRequest = authSession?.session_token
        ? Promise.all([
          supabase.rpc('agora_post_status', { p_session_token: authSession.session_token }),
          supabase.rpc('get_agora_profile', {
            p_profile_number: authSession.profile_number,
            p_session_token: authSession.session_token,
          }),
        ])
        : Promise.resolve([null, null])
      const [feedResult, [statusResult, profileResult]] = await Promise.all([
        supabase.rpc('get_agora_comment_feed', {
          p_session_token: authSession?.session_token || null,
        }),
        accountRequest,
      ])

      if (cancelled) return
      const firstError = feedResult.error || statusResult?.error || profileResult?.error
      if (firstError) {
        setFeedStatus('error')
        setNotice(`${firstError.message} Run the August 29 Agora private-read security migration if it has not been applied yet.`)
        return
      }

      setComments((feedResult.data || []).map(normalizeComment))
      setPostStatus(statusResult
        ? (Array.isArray(statusResult.data) ? statusResult.data[0] : statusResult.data) || null
        : null)
      const profileData = profileResult
        ? (Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data)
        : null
      if (profileData) setProfile(profileData)
      setNotice('')
      setFeedStatus('ready')
    }

    loadBoard()
    return () => { cancelled = true }
  }, [authSession?.profile_number, authSession?.session_token])

  const publishComment = async (event) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || !supabase || posting) return
    if (visibleCharacterCount > MAX_VISIBLE_CHARACTERS) {
      setNotice('Written text is limited to 500 characters. Links do not count toward the limit.')
      return
    }
    if (linkInspection.hasTooMany) {
      setNotice(`Global posts are limited to ${MAX_POST_LINKS} links.`)
      return
    }
    if (linkInspection.hasOversizedLink) {
      setNotice(`Each link is limited to ${MAX_POST_LINK_LENGTH} characters.`)
      return
    }
    if (linkInspection.hasUnsafeLink) {
      setNotice('Links must be valid HTTP or HTTPS addresses.')
      return
    }
    if (!authSession?.session_token) {
      setNotice('Log in before posting to Global.')
      return
    }

    setPosting(true)
    setNotice('')
    const { data, error } = await supabase.rpc('create_agora_post', {
      p_body: message,
      p_session_token: authSession.session_token,
    })

    if (error) {
      setNotice(error.message)
      setPosting(false)
      await loadPostStatus()
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    if (row) setComments((current) => [normalizeComment(row), ...current])
    setDraft('')
    setFeedStatus('ready')
    setPosting(false)
    await loadPostStatus()
  }

  const deleteComment = async (postNumber) => {
    if (!supabase || deletingNumber !== null) return
    if (!window.confirm(`Delete Global post #${String(postNumber).padStart(4, '0')}?`)) return

    setDeletingNumber(postNumber)
    setNotice('')
    const { data, error } = await supabase.rpc('delete_agora_post', {
      p_post_number: postNumber,
      p_session_token: authSession.session_token,
    })

    if (error || !data) {
      setNotice(error?.message || 'This post could not be deleted from this browser.')
      setDeletingNumber(null)
      return
    }

    setComments((current) => current.filter((comment) => comment.postNumber !== postNumber))
    setDeletingNumber(null)
    await loadPostStatus()
  }

  const reactToComment = async (commentId, reaction) => {
    if (!supabase || reactingId !== null) return
    setReactingId(commentId)
    setNotice('')
    const { data, error } = await supabase.rpc('react_to_agora_comment', {
      p_comment_id: commentId,
      p_voter_id: getAcademyVisitorId(),
      p_reaction: reaction,
    })

    if (error) {
      setNotice(error.message)
      setReactingId(null)
      return
    }

    const result = Array.isArray(data) ? data[0] : data
    const nextReaction = result?.active_reaction || null
    setComments((current) => current.map((comment) => (
      comment.id === commentId
        ? { ...comment, likes: result?.likes_count ?? comment.likes, dislikes: result?.dislikes_count ?? comment.dislikes }
        : comment
    )))
    setReactions((current) => {
      const next = { ...current }
      if (nextReaction) next[commentId] = nextReaction
      else delete next[commentId]
      localStorage.setItem(REACTIONS_KEY, JSON.stringify(next))
      return next
    })
    setReactingId(null)
  }

  const openProfile = (profileNumber = 1) => navigate(academyProfilePath(profileNumber))

  return (
    <section className="academy-board" aria-label="Agora discussion board">
      <aside className="academy-info-rail" aria-label="Agora information">
        <div className="academy-info-rail__global-space">
          <img className="academy-info-rail__global" src="/academy-global.png" alt="Global" />
        </div>
        <div className="academy-info-rail__buttons">
          <button type="button" aria-haspopup="dialog" aria-expanded={activeInfo === 'about'} onClick={(event) => {
            infoTriggerRef.current = event.currentTarget
            setActiveInfo('about')
          }}><span>What Is This?</span></button>
          <button type="button" aria-haspopup="dialog" aria-expanded={activeInfo === 'rules'} onClick={(event) => {
            infoTriggerRef.current = event.currentTarget
            setActiveInfo('rules')
          }}><span>Rules</span></button>
        </div>
        <p className="academy-info-rail__users">{userCount.toLocaleString()} user{userCount === 1 ? '' : 's'}</p>
      </aside>

      <div className="academy-board__shell">
        <form className="academy-composer" onSubmit={publishComment}>
          <button className="academy-composer__profile" type="button" onClick={() => authSession ? openProfile(authSession.profile_number) : onLogin()} aria-label={authSession ? 'Open your profile' : 'Log in'}>
            <AcademyAvatar index={profile.avatar_index} className="academy-composer__avatar" alt={authSession ? 'Your profile' : 'Member login'} />
          </button>
          <label className="academy-composer__field">
            <span className="visually-hidden">Write a Global post as NYX</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, MAX_BODY_CHARACTERS))}
              placeholder={postStatus?.anonymous_mode ? 'Write an anonymous message…' : 'Write a message…'}
              rows="1"
              maxLength={MAX_BODY_CHARACTERS}
              spellCheck="false"
            />
            <span className={`academy-composer__counter${visibleCharacterCount > MAX_VISIBLE_CHARACTERS ? ' is-over' : ''}`}>
              {visibleCharacterCount}/{MAX_VISIBLE_CHARACTERS}
            </span>
          </label>
          <button className="academy-composer__submit" type="submit" disabled={!canPublish}>{posting ? 'Posting' : 'Post'}</button>
          {(!authSession || postStatus?.anonymous_mode || !authSession.is_admin) && (
            <div className="academy-composer__status">
              {postStatus?.anonymous_mode && <span>Anonymous mode is on. </span>}
              {!authSession
                ? <button type="button" onClick={onLogin}>Log in to post in Global.</button>
                : authSession.is_admin
                  ? null
                  : cooldownActive
                    ? `Next Global post in ${countdown}. Delete your latest post to reset the timer.`
                    : postStatus && !postStatus.is_owner
                      ? 'This session does not own the selected profile.'
                      : 'One Global post is available every 24 hours.'}
            </div>
          )}
        </form>

        {feedStatus === 'unconfigured' && <p className="academy-notice" role="status">Add the Supabase project URL and publishable key to <code>.env.local</code> to use Global.</p>}
        {feedStatus === 'loading' && <p className="academy-notice" role="status">Loading…</p>}
        {notice && <p className="academy-notice academy-notice--error" role="alert">{notice}</p>}

        <div className="academy-comments" aria-live="polite">
          {comments.map((comment) => {
            const links = extractLinks(comment.message)
            const displayText = textWithoutLinks(comment.message)
            const canDelete = postStatus?.is_owner && (comment.profileNumber === authSession?.profile_number || comment.isAnonymous)

            return (
              <article className="academy-comment" key={comment.id}>
                {comment.isAnonymous ? <AcademyAvatar anonymous /> : (
                  <button className="academy-comment__profile-link academy-comment__profile-link--avatar" type="button" onClick={() => openProfile(comment.profileNumber)}>
                    <AcademyAvatar index={comment.avatar} alt={`${comment.name} profile`} />
                  </button>
                )}
                <div className="academy-comment__content">
                  <div className="academy-comment__topline">
                    <p className="academy-comment__meta">
                      {comment.isAnonymous ? <strong>ANON</strong> : (
                        <button className="academy-comment__profile-link" type="button" onClick={() => openProfile(comment.profileNumber)}>{comment.name}</button>
                      )}
                      {!comment.isAnonymous && comment.isAdmin && <AgoraAdminBadge />}
                      <span aria-hidden="true">•</span>
                      <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
                    </p>
                    <span className="academy-comment__number">#{String(comment.postNumber).padStart(4, '0')}</span>
                  </div>
                  {displayText && <p className="academy-comment__message">{displayText}</p>}
                  {links.length > 0 && <div className="academy-comment__previews">{links.map((url) => <LinkPreview key={url} url={url} />)}</div>}
                  <div className="academy-comment__actions">
                    <div className="academy-comment__reactions" aria-label="Post reactions">
                      <button type="button" className={reactions[comment.id] === 'like' ? 'is-active' : ''} onClick={() => reactToComment(comment.id, 'like')} disabled={!supabase || !authSession || reactingId === comment.id} aria-pressed={reactions[comment.id] === 'like'} aria-label={`Like post. ${comment.likes} likes`}>
                        <img src="/academy-thumb-up.png" alt="" /><span>{comment.likes}</span>
                      </button>
                      <button type="button" className={reactions[comment.id] === 'dislike' ? 'is-active' : ''} onClick={() => reactToComment(comment.id, 'dislike')} disabled={!supabase || !authSession || reactingId === comment.id} aria-pressed={reactions[comment.id] === 'dislike'} aria-label={`Dislike post. ${comment.dislikes} dislikes`}>
                        <img src="/academy-thumb-down.png" alt="" /><span>{comment.dislikes}</span>
                      </button>
                    </div>
                    {canDelete && <button className="academy-comment__delete" type="button" onClick={() => deleteComment(comment.postNumber)} disabled={deletingNumber === comment.postNumber}>{deletingNumber === comment.postNumber ? 'Deleting…' : 'Delete post'}</button>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {authSession?.is_admin && <div className="academy-admin-entry">
        <button type="button" onClick={onOpenAdmin} aria-label="Open Agora administration"><span className="academy-admin-entry__key" aria-hidden="true" /><span>Admin</span></button>
      </div>}

      {activeInfo && (
        <div className="academy-info-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveInfo(null) }}>
          <section className="academy-info-modal__paper" role="dialog" aria-modal="true" aria-labelledby="academy-info-modal-title">
            <button className="academy-info-modal__close" ref={modalCloseRef} type="button" onClick={() => setActiveInfo(null)} aria-label={`Close ${ACADEMY_INFO[activeInfo].title}`}><span aria-hidden="true">×</span></button>
            <div className="academy-info-modal__scroll" ref={modalScrollRef} tabIndex="0">
              <h2 className="visually-hidden" id="academy-info-modal-title">{ACADEMY_INFO[activeInfo].title}</h2>
              <img className="academy-info-modal__title-art" src={ACADEMY_INFO[activeInfo].artwork} alt="" />
              {activeInfo === 'rules' ? (
                <ol className="academy-info-modal__list">
                  <li>No rage baiting.</li>
                  <li>Nothing illegal - no specific calls to violence, fed posting, cp and no gore either, chinese live leak videos allowed but not globally.</li>
                  <li>Avoid using slurs, not because it's a "bad word" but because journalists will be crawling through here.</li>
                  <li>Keep content relevant and focused, you can post that garbage on your Facebook or Twitter, quality over quantity here.</li>
                  <li>Global posting is limited to one post per user every 24 hours. Deleting your latest post resets the timer and lets you post again. Administrators are exempt from this cooldown.</li>
                  <li>Each Global post may contain at most three links, each link is limited to 200 characters, and only valid HTTP or HTTPS links become clickable.</li>
                  <li>Password accounts receive five attempts and PIN accounts receive three. The first lockout lasts 24 hours, the next failed attempt after that causes a seven-day lockout, and another failed attempt permanently locks the account.</li>
                </ol>
              ) : (
                <ol className="academy-info-modal__list">
                  <li>This is an invite only social media platform that will have AI linked to it, that AI will be called "Polaris".</li>
                  <li>It's meant to gameify and reward you for posting here, you'll get points - for commenting, for likes and those points will become crypto down the line.</li>
                  <li>
                    <p>This is not just 4chan or 8chan or twitter or other garbage media, our goal is to get rich and have influence here. For example</p>
                    <div className="academy-info-modal__highlight">Our goal is to launch a meme coin once we have a dedicated 250 to 300 people, everyone is to buy $50, no more - else they will be excluded on an address basis in the system. People are not to sell till it hits at least 100 mil mcap, ideally a billion. If supply is squeezed and there'll be utility - and as the best dev ever, I'll ensure that there is, it should be an easy way to get rich.<span>- this is just one idea</span></div>
                  </li>
                  <li>Besides that, we're here to offer cool videos, links and advice you won't find anywhere else on the internet, we'll also have private member only channels.</li>
                  <li>You can rank up, to councilman and other ranks and eventually invite a limited number of others.</li>
                  <li>This is a white board but not a white only board, there can be people of all creeds, backgrounds and nationalities, just it is strictly regulated in a way which no western nation is - sadly.</li>
                  <li>This board will be political, health conscious - no yoga and hippie shit and focus on uplifting with positivity, spirituality and by using our money as a collective.</li>
                  <li>There is not a single - pro-white organization, pro-white nation anywhere and when they are, they're super fed. This aims to be a loose collective as that.</li>
                  <li>Your data is yours, I'll never sell it as a former privacy dev (and the best one there was) - in fact, your account should be yours, and you'll be able to sell it for real money should you choose to - think of this as the Ark of Noah, and the world is falling apart.</li>
                </ol>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default AcademyBoard
