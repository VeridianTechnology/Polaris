// Descriptions based on visible media, source context and the existing collection notes.
const entries = [
  [
    "DceM1pLNZkp",
    "The first hand wrap",
    "A boxing joke from Riverside Combat Club: one very questionable wrap before sparring."
  ],
  [
    "DcfNCvHu75L",
    "Your order has been delayed",
    "A shipping conversation takes a turn when the seller explains a police raid."
  ],
  [
    "DaqCOScxp31",
    "Lamattpusha in Saint Louis",
    "TJ Filmz follows Lamattpusha in a street vlog featuring a masked figure displaying a firearm."
  ],
  [
    "DaBUQq_sZf3",
    "Cyberpunk mouse",
    "A tattooed cartoon mouse against a neon city backdrop, shared by xehug."
  ],
  [
    "DaIQqqux42o",
    "On the street in Saint Louis",
    "Another scene from TJ Filmz’s Saint Louis street footage."
  ],
  [
    "DcsznNTSi-4",
    "Custom work by Frozen Assets",
    "A close look at a diamond-covered custom piece and its accessories."
  ],
  [
    "DbeFq8Vy1rF",
    "Funnyleek’s street clip",
    "A short clip from funnyleek_."
  ],
  [
    "DSS62jAkhpC",
    "At the railroad crossing",
    "A driver’s-eye view turns into a quick visual joke."
  ],
  [
    "DZMfvnCg4AK",
    "Chaos at the auto shop",
    "A scene from Tires, where running the shop rarely goes to plan."
  ],
  [
    "DYp_KLdJpcz",
    "Bigfoot, straight from the freezer",
    "Peter Caine delivers his deadpan take on alleged Bigfoot specimens."
  ],
  [
    "DcQJjYIJoQg",
    "Street interviews in Busan",
    "Ash Busan asks passersby an unexpectedly personal question."
  ],
  [
    "DcnnswKsXf2",
    "Lost in translation",
    "Travel humor from Elyas and Claire."
  ],
  [
    "DbRMDtFxmpo",
    "A little too much confidence",
    "A short flirtation-themed skit from fractus.vamp."
  ],
  [
    "DXKzXBwERBh",
    "For legal reasons, a joke",
    "A satirical clip from justice.imy."
  ],
  [
    "Dbs9pJoRCHQ",
    "When a friend edits your night routine",
    "Daniela Mora hands over the edit, with predictably mischievous results."
  ],
  [
    "DcMpJ71RS_r",
    "Cashgrabcampaign’s clip",
    "A short comedy selection from cashgrabcampaign."
  ],
  [
    "DcPgrpfuWjd",
    "Lilcasper’s meme",
    "A visual post from lilcasper.exe."
  ],
  [
    "Dct181wJb30",
    "A post from sexmaxxing",
    "A visual comedy selection."
  ],
  [
    "DbltmCzviKb",
    "Bryan Snacks reacts",
    "An incredulous reaction from bryansnacks."
  ],
  [
    "DbleqfbMqtr",
    "Faceless asks the question",
    "A commentary clip shared by faceless."
  ],
  [
    "DcZEWVAjRa-",
    "Comedy archive · 10",
    ""
  ],
  [
    "DcWgfFwJOo7",
    "Comedy archive · 14",
    ""
  ],
  [
    "DchtgijtJrB",
    "5nightattrump’s clip",
    ""
  ],
  [
    "DcQ8ZH5RR0l",
    "Trolling archive · 1",
    ""
  ],
  [
    "DcSXELpxRe-",
    "Trolling archive · 2",
    ""
  ],
  [
    "DbWdFhYvGGH",
    "Trolling archive · 3",
    ""
  ],
  [
    "DctXtQIoDvd",
    "Supermoto style",
    "A riding edit from anna_mxg."
  ],
  [
    "DblkvF_phb-",
    "Back at the track",
    "Nick Tomasunas revisits a motocross run at Adams Acres."
  ],
  [
    "Da_G7iyJZbW",
    "Bike archive · 3",
    ""
  ],
  [
    "Db6Uz8VgmFH",
    "Weight reduction",
    "A motorcycle edit built around the idea of a lighter ride."
  ],
  [
    "DWwKh0Uubi4",
    "Bike archive · 5",
    ""
  ],
  [
    "DbBEss_OAf5",
    "Waldorf bikelife",
    "A Yamaha YZ125 clip from waldorfbikelife."
  ],
  [
    "DceoTa5SCg-",
    "Bike archive · 7",
    ""
  ],
  [
    "Db6Vdg0RPEr",
    "No panic",
    "A Surron riding clip from dropback.d."
  ],
  [
    "Da6tp1nNE4L",
    "Gustavo’s riding edit",
    "A bike-culture selection from gustavoluizz46."
  ],
  [
    "DcWdscNO7Fp",
    "The 110 commute",
    "A riding clip from jazzzpilot."
  ],
  [
    "DcaLAUXtFOx",
    "Two-wheel obsession",
    "A motorcycle edit from fadonyv4s."
  ],
  [
    "DaUQ8Erhdff",
    "Downhill with Cole Trotta",
    "A skateboarding clip from coletrotta."
  ],
  [
    "DXnEqZiAZq1",
    "Living in an abandoned hotel",
    "An urban-exploration clip about making a home in an empty building."
  ],
  [
    "DcgyffbJvCh",
    "Self-defense archive",
    ""
  ],
  [
    "DZvOStui1jb",
    "The red ninja",
    "A martial-arts-themed clip from uptownnayrob."
  ],
  [
    "Dcmfo4vvNQp",
    "For Dolph",
    "A street-culture clip shared by jawhathappened."
  ],
  [
    "DWMoMkeAVLV",
    "A story from jail",
    "Grindon.wytay recounts a jail experience with humor."
  ],
  [
    "Dbl7REKy_gS",
    "1louddemon’s riding clip",
    "A selection from the racing collection."
  ],
  [
    "DaYyRtgypOe",
    "A pursuit across Michigan",
    "Metro Detroit News reports on a motorcycle pursuit that ended in Davison Township."
  ],
  [
    "DcPwYjPibl-",
    "Dirt-bike pursuit in Los Angeles",
    "ABC7 follows a pursuit through parks, including an unusual refueling stop."
  ],
  [
    "DasTZg2zwsJ",
    "TJ’s chase clip",
    "A riding clip shared by tj.onna.x3."
  ],
  [
    "Da5WdDzOSN1",
    "After-dark riding",
    "Night riding and wheelies from nature.prince7."
  ],
  [
    "DctHzV1zRCX",
    "Day 135 of the project",
    "Jpshuru checks in on a 200-day project and its move to longer videos."
  ],
  [
    "Da8fm2SOtLG",
    "Waiting for the Spider-Man invitation",
    "An urban climber jokes about auditioning through increasingly ambitious climbs."
  ],
  [
    "Db6GcxTTN1V",
    "Quin Stott’s grip strength",
    "A demonstration from an athlete focused on grip training."
  ],
  [
    "DcUqAfmhYfc",
    "Julian Decina’s grip work",
    "A grip-strength selection from juliandecina."
  ],
  [
    "Dcd2UceA3Sy",
    "NYX on facial proportions",
    "The Polaris founder looks at Daniel Craig’s philtrum in a facial-aesthetics series."
  ],
  [
    "DZLwgMRMgmJ",
    "Feet, force and speed",
    "Swholeanimal presents his ideas about foot mechanics and sprinting."
  ],
  [
    "DWHn8UuEZxd",
    "Breaking down athletic footwork",
    "Nick Ball compares movement patterns across elite athletes."
  ],
  [
    "DZ1ep8egbJN",
    "A wheat field beside Wall Street",
    "Agnes Denes’s Manhattan installation puts agriculture and finance in the same frame."
  ],
  [
    "Db03EO5CJi-",
    "Maxvoao’s visual experiment",
    "A collection of images from maxvoao."
  ],
  [
    "DaGlreySLHG",
    "Movement by Ian Rocks",
    "A dance selection from ianrocks_0."
  ],
  [
    "DZ75125kZ2T",
    "The scale of old-growth logging",
    "Archival images show enormous trees and the industry that cut them down."
  ],
  [
    "DZsnBp8iGTI",
    "From the history archive",
    "A historical image post from historycoolkids."
  ],
  [
    "DcgxEsITHYE",
    "History in pictures",
    "A visual history selection from historyfeelsthepodcast."
  ],
  [
    "DapPIr_OsPG",
    "Amanjaat’s fight clip",
    "A selection from amanjaat_no1."
  ],
  [
    "Daovn_YsncU",
    "Selling the feint",
    "Dan Ferraz demonstrates a karate feint."
  ],
  [
    "DZKYSqYSwnb",
    "The knee strike",
    "A striking clip shared by ragoz_18."
  ],
  [
    "DcRAMa4Tf5_",
    "Valosparks’ fight edit",
    "A short selection from the fighting collection."
  ],
  [
    "DcnPWdLhlR4",
    "Sibling sparring",
    "Mila and Ava trade shots in a boxing-training clip."
  ],
  [
    "DZybyY7tZvv",
    "Two fighters, one exchange",
    "A combat-sports clip shared by simsmolanoff."
  ],
  [
    "DcPiHyXhInd",
    "Sound made visible",
    "Pseudohuasca combines music, digital animation and experimental visuals."
  ],
  [
    "DcmTM4mTz9j",
    "Fallen angels",
    "A digital-art interpretation from booterart."
  ],
  [
    "Dclt6JHsf3m",
    "Amnasaras’ visual edit",
    "An atmospheric reel shared by amnasaras."
  ],
  [
    "DcTv6aeu0Jk",
    "Robert Monroe and “loosh”",
    "A creator discusses Monroe’s speculative account of emotional energy."
  ],
  [
    "DYd7RJ8OYFv",
    "Mind, belief and the body",
    "The Esoteric Nomad presents a spiritual interpretation of mind and health."
  ],
  [
    "DcWRjpYRqkh",
    "The chosen-ones narrative",
    "A spiritual commentary clip from bdell1014."
  ],
  [
    "DVchagfjba7",
    "Searching for original truth",
    "Joe Felz discusses books, history and religious interpretation."
  ],
  [
    "DcXagl7y_Ce",
    "Father Spyridon on faith",
    "An Orthodox priest reflects on faith, humility and the inner life."
  ],
  [
    "DbLdtygoqG3",
    "Beauty and proportion in ancient Greece",
    "A discussion of classical ideals, sculpture and the search for bodily harmony."
  ],
  [
    "Dbyznf2xiMM",
    "Ancient Rome, imagined on film",
    "An AI reconstruction imagines a camera moving through the ancient city."
  ],
  [
    "DbMBzJ1JyTN",
    "A day in prehistory",
    "An imagined glimpse of early human life, created with AI."
  ],
  [
    "DYL5FOKzq7Q",
    "S0UL3SS · pr0crastn8",
    "An underground drum-and-bass selection from pr0crastn8."
  ],
  [
    "DWkLVRzx_sm",
    "New music from iam24th",
    "A performance clip from iam24th."
  ],
  [
    "DZWPUnTAN86",
    "Corpo’s music video",
    "A music-video excerpt from corpo.corpo.corpo."
  ],
  [
    "DYIetfiyx4f",
    "Another cut from Corpo",
    "Music and editing by corpo.corpo.corpo."
  ],
  [
    "DYkj1BHJkkr",
    "What engine noise?",
    "A driver is far too absorbed in the music to notice the car’s problems."
  ],
  [
    "DTNor-fkgxO",
    "The average Instagram user",
    "A visual meme about online habits."
  ],
  [
    "DT90Nv0Etb_",
    "Trying to remember that word",
    "A movie scene repurposed as a joke about memory."
  ],
  [
    "DYmuayTK0rh",
    "Learn car electrics in a simulator",
    "Setupspawn explores wiring diagrams, multimeters and virtual automotive diagnostics."
  ],
  [
    "DY1wNcXhfhG",
    "Build a car in 3D",
    "Setupsai demonstrates a website for customizing cars in three dimensions."
  ],
  [
    "DXraleCjMa9",
    "Hidden features of a Gold Wing",
    "A rider shows off details of a classic Honda touring motorcycle."
  ],
  [
    "DZcwlipz1d6",
    "Tiny tin droplets, advanced chips",
    "Branch Education explains the laser-driven light source used in EUV lithography."
  ],
  [
    "DZtRtCSgwoz",
    "A small following, a paid offer",
    "Alex Eubank describes turning a focused audience into a coaching business."
  ],
  [
    "Dcjo0LHuTON",
    "Inside an editorial shoot",
    "A fashion-photography selection from eddieshafo."
  ],
  [
    "DbXHECIg5Ci",
    "Four shots for model digitals",
    "Alex Acampora walks through simple agency photos with natural light and minimal styling."
  ],
  [
    "DWm5QRLkRLh",
    "Between the shoulder blades",
    "James Moore demonstrates an upper-back stretch."
  ],
  [
    "DZFYq8PRuB4",
    "Working on hip mobility",
    "A floor-based mobility demonstration from James Moore."
  ],
  [
    "DZPzwfsxjlZ",
    "A doorway stretch",
    "James Moore demonstrates a back stretch using a doorframe."
  ],
  [
    "DY7gZemPj1r",
    "Why feet turn outward",
    "Conor Harris discusses walking mechanics and outward-pointing feet."
  ],
  [
    "DZ29EbySiHr",
    "A post from Physics Uncovered",
    "A visual selection from physicsuncovered."
  ],
  [
    "DaiZMffN0iJ",
    "Movement and breathing",
    "James Moore demonstrates an exercise he discusses in relation to clearing mucus."
  ],
  [
    "DbbfDb-Rgdv",
    "A creator’s take on breathing",
    "Frederick Perry discusses breathing rate, carbon dioxide and health."
  ],
  [
    "Dcg0s3qBW9R",
    "Food, metabolism and thyroid claims",
    "Robunedited presents his views on energy intake and thyroid function."
  ],
  [
    "Db_XlsggFcD",
    "The body as an electrical system",
    "Soulscienceconnect connects bioelectricity research with broader wellness claims."
  ],
  [
    "DcXnGm0ueXh",
    "What shapes the eye area?",
    "A facial-aesthetics post about brows, eyelids and facial structure."
  ],
  [
    "DaordoytyuR",
    "Appearance starts with routine",
    "Justic3j connects personal appearance with everyday habits."
  ],
  [
    "DbeUU8KRdJj",
    "Four weeks of neck training",
    "A creator documents progress across a month of neck curls."
  ],
  [
    "DZ93eCetQKa",
    "A health-focused transformation",
    "A personal-transformation clip from livelikelucass."
  ],
  [
    "DchGIrEyv3m",
    "Building a chest routine",
    "Kian Deehan lays out how he would approach chest training from the beginning."
  ],
  [
    "DbioI_Wum6R",
    "The marmot on lookout",
    "A post follows a marmot that appears more interested in watching its surroundings than eating."
  ],
  [
    "DcjIGVXRH5l",
    "A demanding harbor seal",
    "Captain Danny Frank encounters a seal with very clear expectations."
  ],
  [
    "DcbEVC1sry_",
    "Inside an ant colony · Part 2",
    "Gigafourmis tours a Pheidole pallidula colony and its enclosures."
  ],
  [
    "DceSjjPs3dt",
    "Inside an ant colony · Part 3",
    "The tour continues through the colony’s nests and foraging areas."
  ],
  [
    "Dcp2NqmlFEt",
    "The cosmic web",
    "A visualization of the universe’s large-scale structure."
  ],
  [
    "DctNz-AADQF",
    "Orbits in a moving solar system",
    "An animation explores planetary paths from a changing frame of reference."
  ],
  [
    "Dcq0_JOpjXJ",
    "Why the stars seem still",
    "A space explainer considers how distance changes our perception of motion."
  ],
  [
    "Db8pYpjgJur",
    "Solar storms and health claims",
    "A post discusses a proposed link between geomagnetic activity and hospital admissions."
  ],
  [
    "DcSBTB7kcNw",
    "Galaxies in detail",
    "A selection of astronomical images highlighting galactic structure."
  ],
  [
    "DazFXk2tYhV",
    "Generations and money",
    "Catherine offers a pointed take on generational financial expectations."
  ],
  [
    "DcFg_9nN8Ue",
    "Back to the gym",
    "A fitness update from marilynamberr."
  ],
  [
    "DcTvUm4KxmA",
    "A fitness edit from Joy",
    "A gym-focused reel shared by joyymeek."
  ],
  [
    "Db1Vtq0yFuR",
    "Alycatt and company",
    "A creator-and-cat clip from alycatt1."
  ],
  [
    "DcMZN9jMDyD",
    "Dante’s Inferno on silent film",
    "A scene from the 1911 film L’Inferno, with imagery inspired by Gustave Doré."
  ],
  [
    "Dcdz4p_TNSH",
    "Stories from old Hollywood",
    "A commentary clip about the film-studio era."
  ],
  [
    "DaimOeDuDfO",
    "Beauty is pain",
    "A deer-and-unicorn illustration from kanni.png."
  ],
  [
    "Db5egH6Rr0n",
    "A word that escaped Azeroth",
    "A gaming-history clip about World of Warcraft’s influence on internet language."
  ],
  [
    "DcQu5B-t10B",
    "Stability before romance",
    "A post frames financial independence through a Machiavellian perspective."
  ],
  [
    "DcMy2MShDzJ",
    "An edit from freq_ae",
    "A short selection from the Manliness collection."
  ],
  [
    "DZlmkB4uO40",
    "The young Napoleon",
    "A character sketch of Napoleon’s early social life and ambition."
  ],
  [
    "DccRyvbDUGY",
    "A football-owner arrest claim",
    "Dose of Sports Daily shares allegations about a football executive."
  ],
  [
    "DchGrVeFLhC",
    "A story from WTOC",
    "A news post from wtoc11."
  ],
  [
    "DcTsBidIZqj",
    "Historical crime archive",
    ""
  ],
  [
    "DcTBMqXT1AU",
    "Commentary on Joe Felz",
    "A clip shared by tinfoilgoy."
  ],
  [
    "DcMELp4zOE8",
    "Conspiracy archive",
    ""
  ],
  [
    "DchwUFiDpZD",
    "Loneliness in Japan",
    ""
  ],
  [
    "DZNMN3czGhO",
    "Questioning the 9/11 account",
    "A conspiracy-focused post challenges the official account of the attacks."
  ],
  [
    "DanJDw2hzAE",
    "Vietnam’s property boom",
    "CNA examines housing prices, development and affordability in Vietnam."
  ],
  [
    "DcGQabut-rD",
    "Police at the apartment",
    "Brisha Sharlett recounts a police visit in Vietnam."
  ],
  [
    "DciJWtmH98N",
    "A report from Khaosod English",
    "A news post from khaosodenglish."
  ],
  [
    "Dcv6oRYxi8T",
    "Dollar dominance under pressure",
    "A political commentary post discusses bond markets and the dollar."
  ],
  [
    "DceNoLgMNit",
    "A Roth IRA clip",
    "A short post shared by cashgrabber9000."
  ]
]

const additionalEntries = [
  [
    "DOwJHc5AIIh",
    "Breaking the daily loop",
    "A reflection on changing routines that have started to feel automatic."
  ],
  [
    "DUgLWjCCRjA",
    "A Chicago street exchange",
    ""
  ],
  [
    "DUyguugD2V4",
    "Remembering the internet in 2016",
    ""
  ],
  [
    "DVbNovYAoNY",
    "Zero-summing in Elder Scrolls lore",
    "A gaming-lore explanation of a character disappearing from existence."
  ],
  [
    "DWKnjrME-Aq",
    "Responsibility across generations",
    ""
  ],
  [
    "DWeZrlYjigw",
    "Damien Echols on ritual",
    "An interview excerpt from The Midnight Gospel about ceremonial magic."
  ],
  [
    "DX5MP5kqcPJ",
    "Meeting Seneca",
    "An introduction to the Roman philosopher and his Stoic outlook."
  ],
  [
    "DXp1U4kiYo2",
    "Molecular motors and sacred geometry",
    "A creator draws a speculative connection between biological structures and religious imagery."
  ],
  [
    "DY-WG0qzAhJ",
    "Anime-inspired grip work",
    "Quin Stott adds an anime theme to his grip-training routine."
  ],
  [
    "DYCmPlatYcV",
    "Cheststand practice",
    ""
  ],
  [
    "DYSd0lkyae8",
    "A personal corner of the web",
    "A Neocities site takes shape with a nostalgic digital aesthetic."
  ],
  [
    "DYYgHmphqba",
    "The gainer backflip",
    "A strength athlete takes on an acrobatic jump."
  ],
  [
    "DYZvCm9E8E4",
    "The psychic-spy story",
    "An interview explores claims about intelligence agencies and psychic experiments."
  ],
  [
    "DYgCHotNVVv",
    "Glasses marketed against facial recognition",
    "Vaydr presents its eyewear and claims about disrupting recognition systems."
  ],
  [
    "DYjHM4LhnFc",
    "A forward-fold demonstration",
    "A flexibility sequence from Zina Trang."
  ],
  [
    "DYnSBwosWP4",
    "An Astero in EVE Online",
    "A spacecraft clip from the EVE universe."
  ],
  [
    "DYnvziuO4ya",
    "Inside In Sorcery’s Shadow",
    "A book recommendation at the intersection of anthropology and paranormal experience."
  ],
  [
    "DYuVa5hgi__",
    "Nietzsche and mysticism",
    "An interview considers the spiritual side of a philosopher known for challenging religion."
  ],
  [
    "DYzw3QrDD4_",
    "Building a creator-ad system",
    "Chase Chappell describes his approach to producing and testing short-form ads."
  ],
  [
    "DZ-lj1vjQT4",
    "The generational rant",
    "A gamer takes aim at generational entitlement."
  ],
  [
    "DZ9yvVCuzQI",
    "A back-therapy demonstration",
    "A treatment demonstration shared by drrelaxc."
  ],
  [
    "DZBOEOQjF1v",
    "Physics archive · outtstanding",
    ""
  ],
  [
    "DZV7Nd-NHmX",
    "Bardon’s elemental framework",
    "A creator introduces a shadow-work practice drawn from Franz Bardon."
  ],
  [
    "DZaDY44pVy8",
    "Daffy Duck refuses to quit",
    "A familiar cartoon character becomes an example of stubborn persistence."
  ],
  [
    "DZf7g2tzIYb",
    "Inside a BoxPhone",
    "A look at hardware that combines multiple phone boards in one setup."
  ],
  [
    "DZps61HsUx7",
    "Scaling short-form creative",
    "A second look at Chase Chappell’s creator-led advertising approach."
  ],
  [
    "DZv619Sp8Qp",
    "Michael Talbot’s holographic universe",
    "An interview excerpt about Talbot’s speculative model of reality."
  ],
  [
    "DZwpXaIMhy0",
    "A perspective on Kabbalah",
    "A creator discusses religious tradition, learning and common misconceptions."
  ],
  [
    "Da0ogNYgPbG",
    "Batman has questions",
    "A comic reinterpretation of Batman interrogating the Joker."
  ],
  [
    "Da38WIPyn2F",
    "The Lesser Key of Solomon",
    "A paranormal creator connects an occult symbol with a recorded investigation."
  ],
  [
    "Da3l6lwP2kp",
    "Voices in the woods",
    "A ghost-hunting account describes a visit to supposedly haunted woodland."
  ],
  [
    "Da5Ko1vMiPH",
    "Berlin at the turn of the century",
    ""
  ],
  [
    "Da8ImNtRnAV",
    "An image passing through stone",
    "A Ulexite cube and a phone screen create a striking optical illusion."
  ],
  [
    "Da8RUT-FlXS",
    "Alex Sanders and Alexandrian Wicca",
    ""
  ],
  [
    "DaDVQ6Qu0eN",
    "The Kool-Aid bit",
    "A satirical sketch from tlohhhh."
  ],
  [
    "DaGAfiRIVi4",
    "Motel Mario",
    "A surreal Mario-inspired animation from Pancreations."
  ],
  [
    "DaKXnZtKJeu",
    "The systems behind Rome",
    "A historical overview of the roads and infrastructure supporting the Roman Empire."
  ],
  [
    "DaQ6vndK7tQ",
    "Wrestling witchcraft",
    "A wrestling clip becomes a supernatural joke."
  ],
  [
    "DaQdAivKQ2V",
    "A directory for public-source research",
    "Ariacodez introduces a collection of open-source intelligence tools."
  ],
  [
    "DaW6EH9M6gD",
    "Dolores Cannon’s future timelines",
    "A clip explores speculative stories associated with Cannon’s hypnosis sessions."
  ],
  [
    "DaY5hGZDU9x",
    "The alchemist’s journey",
    "A reflection drawn from esoteric philosophy."
  ],
  [
    "DaYTxxdRdmB",
    "Split squats for speed",
    "A football-training clip focused on explosive lower-body work."
  ],
  [
    "DaZ4eroDCYJ",
    "Growing into responsibility",
    "Charles Myssy reflects on maturity and facing reality."
  ],
  [
    "Da_lQpXvezw",
    "Jung’s language of symbols",
    "An introduction to archetypes and symbolic interpretation."
  ],
  [
    "DabxLC1I69S",
    "Claims about directed sound",
    "A commentary post describes alleged uses of acoustic and directed-energy technology."
  ],
  [
    "DadY6RKIejq",
    "Hoffman’s interface theory",
    "A thought experiment about whether perception shows reality or a useful representation of it."
  ],
  [
    "DadhUAmsnFm",
    "Remembering who you are",
    "A spiritual reflection using Krishna imagery."
  ],
  [
    "DadoXOymiWM",
    "A parking check becomes an arrest",
    "A Naples news account reports on an arrest following a Seagate Beach parking check."
  ],
  [
    "DaeROPNOG68",
    "From sand to stone",
    "Tommy Ashman experiments with a harder material in his hand-training practice."
  ],
  [
    "DagaNyYTSM_",
    "Looney Tunes meets a dating show",
    "An AI cartoon parody borrows the pop-the-balloon format."
  ],
  [
    "Dailf_XsGhs",
    "A proposed cosmic giant",
    "A space explainer introduces the Hercules–Corona Borealis Great Wall."
  ],
  [
    "DajLD1BMNjs",
    "Biglino’s reading of ancient texts",
    "An introduction to Mauro Biglino’s controversial religious interpretations."
  ],
  [
    "Dal4mbEschC",
    "America Souls",
    ""
  ],
  [
    "DamDqkrH0xb",
    "Making a way in the world",
    "A philosophical reflection on wisdom and social life."
  ],
  [
    "DamTQIzs-Ks",
    "Alex Collier’s extraterrestrial story",
    "A speculative account of an alleged alien hierarchy."
  ],
  [
    "Dan5IkuhsNP",
    "Casper is not a pet",
    "An alligator handler shows why familiarity is no substitute for caution."
  ],
  [
    "DankeIHlOzw",
    "Reading medieval beauty standards",
    "Portrait details reveal changing conventions of beauty."
  ],
  [
    "DanrbjZyqpu",
    "Higher on a rainy night",
    "Boy2000’s music accompanies a rainy city scene."
  ],
  [
    "DansDT1qXHR",
    "Imagining a map of the mind",
    "A short reflection on what brain mapping might reveal."
  ],
  [
    "Dao7Iv4PxPd",
    "Spider meets bombardier beetle",
    "A close-up encounter between two very different arthropods."
  ],
  [
    "Daog7SVmN5r",
    "Hesiod on putting things off",
    "A quotation about work, delay and the cost of procrastination."
  ],
  [
    "Dapy8D4jTAb",
    "When play generates location data",
    "A creator raises privacy questions about Pokémon Go."
  ],
  [
    "Daq5mgWkllJ",
    "What happened to Akon City?",
    "A look back at the ambitious Senegal megacity proposal."
  ],
  [
    "DaqOPe5OKZX",
    "Life with a dachshund",
    "A dog clip from benslink2."
  ],
  [
    "DatRUAXzdxF",
    "Skyrim, remixed",
    "A stylized gaming parody from Geeked Cartoon."
  ],
  [
    "DavuH1mkdyq",
    "Anakin and the fall of Lucifer",
    "An interpretation connecting Star Wars with religious symbolism."
  ],
  [
    "Dawk_jgHEFC",
    "Manly P. Hall’s occult encyclopedia",
    "A post introduces The Secret Teachings of All Ages and its esoteric themes."
  ],
  [
    "DayD7_3PwOb",
    "Cartoons after dark",
    "An AI cartoon edit from Geeked Cartoon."
  ],
  [
    "DayOpsAvDjs",
    "Kunichika’s supernatural stage",
    "A kabuki print depicts Onoe Kikugorō in the role of Tenjiku Tokubē."
  ],
  [
    "Db0bu1GgALJ",
    "The Alliance, then and now",
    "A comparison of World of Warcraft character designs across eras."
  ],
  [
    "Db3l5RqK9rh",
    "A Khajiit comedy edit",
    "A Skyrim-inspired parody from mndbd."
  ],
  [
    "Db5-q3XiB7F",
    "Opening Virgil for an answer",
    "A rare-book post explores the practice of divination through Virgil."
  ],
  [
    "Db53IClBkhM",
    "Reading The History of Magic",
    "An audiobook excerpt exploring effort and spiritual discipline."
  ],
  [
    "Db7FuUHiQqi",
    "Aristotle and learning by doing",
    "A philosophical quotation about practice and understanding."
  ],
  [
    "Db7tJrIQsT9",
    "Why read Zero to One?",
    "A reader makes the case for Peter Thiel’s book on building companies."
  ],
  [
    "Db8n2OdOIWm",
    "Robert Anton Wilson on perception",
    "An excerpt about experience, belief and the way we interpret reality."
  ],
  [
    "Db9myCmRszu",
    "A childhood mishap, exaggerated",
    "YPK Raye acts out an over-the-top reaction."
  ],
  [
    "DbBT2gvObIb",
    "Alchemy as inner change",
    "An interpretation of metals and transformation as symbols for personal development."
  ],
  [
    "DbCp8_nNoA0",
    "Appearances can mislead",
    "A meme contrasts online personas with private behavior."
  ],
  [
    "DbFVzDHm3Cx",
    "Leadbeater’s astral world",
    "An excerpt from an esoteric account of the astral plane."
  ],
  [
    "DbGWyNGuZSM",
    "Businesses customers need again",
    "A collection of service-business ideas built around repeat demand."
  ],
  [
    "DbL8q6gAHKI",
    "Pravir Malik’s fourfold pattern",
    "A researcher presents a speculative connection between structures at different scales."
  ],
  [
    "DbLEjUoGKV_",
    "Archons in esoteric belief",
    "A post interprets consciousness and control through the idea of archons."
  ],
  [
    "DbLMz1yDClg",
    "Thomas Campbell on spiritual choices",
    "A post presents Campbell’s metaphysical perspective on personal decisions."
  ],
  [
    "DbM-aLyvaLf",
    "Trying to picture a fourth dimension",
    "A visual explanation of higher-dimensional space."
  ],
  [
    "DbNdSlmS700",
    "Future reacts to California Girls",
    ""
  ],
  [
    "DbOyLSIAmf8",
    "Remembering Robert Ritner",
    "An Egyptologist’s student reflects on his work and influence."
  ],
  [
    "DbRaYbXkSfr",
    "Saturn, time and responsibility",
    "An astrological interpretation of Saturn’s symbolism."
  ],
  [
    "DbRgavnvayh",
    "Surveillance everywhere",
    ""
  ],
  [
    "DbS7ty6pn4z",
    "What your presentation communicates",
    "A speaker considers how clothing shapes a first impression."
  ],
  [
    "DbWeNwrz0NS",
    "The “banned glasses” claim",
    "A viral eyewear story shared by tinfoilgoy."
  ],
  [
    "DbXYccCK5li",
    "You are not your past self",
    "A reflection on identity, attention and change."
  ],
  [
    "DbY0-Vszong",
    "Posture and appearance",
    ""
  ],
  [
    "Db_HibiAU8t",
    "The Legend of Trump",
    "An AI parody with the look of a nostalgic video game."
  ],
  [
    "Db_gyy6HOUB",
    "A practitioner’s take on fillers",
    "A cosmetic practitioner presents examples and opinions about facial aesthetics."
  ],
  [
    "Db_zMbgGXcI",
    "Another layer of the matrix",
    "A visual joke about escaping one reality only to find another."
  ],
  [
    "Dbbw_6kS5Hd",
    "Anakin’s alternate family",
    "An AI reimagining of a Star Wars timeline in which Anakin becomes emperor."
  ],
  [
    "DbdiErUNJzE",
    "Strength, combat and endurance",
    "A hybrid athlete combines lifting, martial arts and running."
  ],
  [
    "DbfSjiYDiFG",
    "Nietzsche on self-mastery",
    "A philosophical quotation about directing one’s own life."
  ],
  [
    "Dbl9yTtJE1H",
    "Gary Cooper in silent cinema",
    "A scene from Children of Divorce, released in 1927."
  ],
  [
    "DbmMdRQjDUp",
    "Fascia and facial aesthetics",
    "A creator promotes a connection between tissue tension and facial appearance."
  ],
  [
    "DbnesgHRSAx",
    "At home on a shantyboat",
    "A river dweller shares life aboard a floating home."
  ],
  [
    "DbnqoiqgkXJ",
    "Blood money and spiritual belief",
    "Francis Myles introduces themes from his book on witchcraft and money."
  ],
  [
    "DbpHMpdS5ma",
    "Tobi Lütke tackles stage fright",
    "David Senra shares Lütke’s account of preparing himself for public speaking."
  ],
  [
    "Dbt89BggZd9",
    "Jim Carrey, the painter",
    "A look beyond the screen at Carrey’s paintings."
  ],
  [
    "DbvKpRHxwrw",
    "Gymnastics hip work",
    "A training sequence focused on strength and mobility around the hips."
  ],
  [
    "DbybKu0vnDX",
    "Could consciousness predate life?",
    "A science-themed post explores a speculative question about consciousness."
  ],
  [
    "DbydVjzByKz",
    "How the Bronze Age unraveled",
    "A short introduction to the collapse of interconnected ancient societies."
  ],
  [
    "Dc1jPRAJ6OV",
    "Politics as stand-up material",
    "Ben Bankas turns women in politics into a stand-up bit."
  ],
  [
    "Dc6UUkvAchy",
    "Elder Scrolls meets Vietnam",
    ""
  ],
  [
    "DcB9aeuo16-",
    "The Sons of God",
    ""
  ],
  [
    "DcG3myHkSaB",
    "One fish, thousands of hours",
    "A World of Warcraft player’s fishing pursuit becomes a story of persistence."
  ],
  [
    "DcaEg9ulmvI",
    "Animal archetypes in facial aesthetics",
    "A visual post sorts facial features into animal-inspired beauty categories."
  ]
]

export const instagramEditorial = Object.fromEntries([...entries, ...additionalEntries].map(([post, title, caption]) => [post, { title, caption }]))
