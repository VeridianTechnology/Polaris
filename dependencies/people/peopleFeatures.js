import { ROUTES } from '../../routing/routes.js'

export const peopleFeatures = {
  rightWing: [
    {
      id: '01',
      slug: 'zoomerwoman',
      title: 'New Right Wing Darling',
      analysis: 'Interesting woman with some pretty based takes, new to the scene.',
      image: '/people-zoomerwoman.png',
      url: 'https://x.com/zoomerwoman',
      handle: '@zoomerwoman',
      path: ROUTES.agoraPeopleZoomerwoman,
      commentStorageKey: 'polaris-people-zoomerwoman-comments',
    },
    {
      id: '02',
      slug: 'paul-miller',
      title: 'Paul Miller',
      analysis: 'Paul came of a huge kickboxing win against some nobody, very enetertaining, very big.',
      image: '/people-paul-miller.jpeg',
      url: 'https://x.com/jokerwaffenfren/status/2093897382987469245',
      handle: '@jokerwaffenfren',
      path: ROUTES.agoraPeoplePaulMiller,
      commentStorageKey: 'polaris-people-paul-miller-comments',
    },
  ],
}
