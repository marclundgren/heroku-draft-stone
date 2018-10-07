const cors = require('cors')
const fetch = require('node-fetch')
const { encode/*, decode */ } = require('deckstrings') // https://hearthsim.info/docs/deckstrings/
const { LocalStorage } = require('node-localstorage')
const express = require('express')
const graphqlHTTP = require('express-graphql')
const { buildSchema } = require('graphql')

const localStorage = new LocalStorage('./scratch')

const API_PROTOCOL = 'https'
const API_DOMAIN = 'api.hearthstonejson.com'
const API_NAMESPACE = 'v1'
const API_VERSION = 'latest'
const url = `${API_PROTOCOL}://${API_DOMAIN}/${API_NAMESPACE}/${API_VERSION}/enUS`
const cards_url = `${url}/cards.collectible.json`

const extractHearthstoneJSONVersionID = (url = '') => {
  const prefix = `${API_PROTOCOL}://${API_DOMAIN}/${API_NAMESPACE}/`
  const idIndex = url.indexOf(prefix) + prefix.length // the id's position proceeeds this prefix

  return url.substr(idIndex).split('/enUS')[0]
}

const schema = buildSchema(`
  type Hero {
    id: String!
    dbfId: Int!
    name: String!
    cards: [Card]
  }

  type Card {
    id: String!
    dbfId: Int!
    cardClass: String!
    name: String!
    set: String!
    cost: Int!
    rarity: String!
  }

  type Query {
    heros: [Hero]
    hero(id: String!): Hero
    deckcode(format: Int!, heroId: String!, cards: [[Int!]]): String
    set(id: String!): [Card]
    cardByName(name: String!): Card
    cardByDbfId(dbfId: Int!): Card
    neutralcards: [Card]
  }
`)

fetch(url).then((response) => {
  const id = extractHearthstoneJSONVersionID(response.url)

  const storedCards = localStorage.getItem(`DraftStone--Cards--${id}`)

  if (!storedCards) {
    return fetch(cards_url).then((response) => response.json()).then((response) => {
      localStorage.setItem(`DraftStone--Cards--${id}`, JSON.stringify(response))
      return response
    })
  } else {
    return JSON.parse(storedCards)
  }
}).then((cards) => {
  const heros = cards.filter(({ type, set }) => {
    const typeIsHero = type === 'HERO'
    const setIsCore = set === 'CORE'
    return typeIsHero && setIsCore
  })

  /*
  SET: cards.collectible.json

  [ 'TB',
     'TGT',
     'HERO_SKINS',
     'CORE',
     'BRM',
     'GANGS',
     'CREDITS',
     'EXPERT1',
     'HOF',
     'NAXX',
     'GILNEAS',
     'GVG',
     'ICECROWN',
     'UNGORO',
     'LOOTAPALOOZA',
     'KARA',
     'LOE',
     'OG',
     undefined,
     'TAVERNS_OF_TIME',
     'MISSIONS' ]


  SET: cards.json

  sets:
   [ 'TGT',
     'BRM',
     'GANGS',
     'CORE',
     'EXPERT1',
     'HOF',
     'NAXX',
     'GILNEAS',
     'GVG',
     'HERO_SKINS',
     'ICECROWN',
     'KARA',
     'LOE',
     'LOOTAPALOOZA',
     'OG',
     'UNGORO' ] }
  */

  // const heroId = (id) => `HERO_0${id}`
  //
  // let garrosh   = heros.find(({ id }) => id === heroId(1)) // dbfId: 7
  // let thrall    = heros.find(({ id }) => id === heroId(2)) // dbfId: 1066
  // let valeera   = heros.find(({ id }) => id === heroId(3)) // dbfId: 930
  // let uther     = heros.find(({ id }) => id === heroId(4)) // dbfId: 671
  // let rexxar    = heros.find(({ id }) => id === heroId(5)) // dbfId: 31
  // let malfurion = heros.find(({ id }) => id === heroId(6)) // dbfId: 274
  // let guldan    = heros.find(({ id }) => id === heroId(7)) // dbfId: 893
  // let jaina     = heros.find(({ id }) => id === heroId(8)) // dbfId: 637
  // let anduin    = heros.find(({ id }) => id === heroId(9)) // dbfId: 813

  // console.log({
  //   garrosh,
  //   // garrosh: garrosh.name,
  //   thrall: thrall.name,
  //   valeera: valeera.name,
  //   uther: uther.name,
  //   rexxar: rexxar.name,
  //   malfurion: malfurion.name,
  //   guldan: guldan.name,
  //   jaina: jaina.name,
  //   anduin: anduin.name
  // })

  const sets = cards.map(({ set }) => set).reduce((list, item) => {
    if (list.indexOf(item) === -1) {
      return list.concat(item)
    } else {
      return list
    }
  }, [])

  /* eslint-disable-next-line no-console */
  console.log({sets})

  const STANDARD_SETS = [
    'CORE',
    'EXPERT1',
    'ICECROWN',
    'LOOTAPALOOZA',
    'UNGORO',
    'GILNEAS',
    'BOOMSDAY',
  ]

  const standardCards = cards.filter(({ set, cost }) => {
    const isInStandardSet = STANDARD_SETS.indexOf(set) > -1
    return isInStandardSet && cost > -1
  })

  const compareCost = (a, b) => {
    if (a.cost < b.cost) {
      return -1
    } else  if ( a.cost > b.cost) {
      return 1
    } else {
      return 0
    }
  }

  const root = {
    neutralcards: () => {
      return standardCards.filter(({ cardClass }) => cardClass === 'NEUTRAL').map(({ id, dbfId, cost, cardClass, set, type, name, rarity }) => {
        return { id, dbfId, cost, cardClass, set, type, name, rarity }
      }).sort(compareCost)
    },
    cardByName: ({ name }) => {
      const { dbfId, cost, cardClass, set, type, id, rarity } = cards.find((card) => {
        const cost = card.cost
        const nameMatch = card.name === name

        return nameMatch && cost
      })

      return { id, dbfId, cost, cardClass, set, type, name, rarity }
    },
    cardByDbfId: ({ dbfId }) => {
      const { name, cost, cardClass, set, type, id, rarity } = cards.find((card) => {
        const cost = card.cost
        const dbfIdMatch = card.dbfId === dbfId

        return dbfIdMatch && cost
      })

      return { id, dbfId, cost, cardClass, set, type, name, rarity }
    },
    heros: () => {
      return heros.map(({ name, cardClass, id, dbfId }) => {
        const classCards = standardCards.filter((card) => card.cardClass === cardClass).map(({ dbfId, cardClass, name, set, cost, rarity }) => {
          return { id, dbfId, cardClass, name, set, cost, rarity }
        })

        const sortedClassCards = classCards.sort(compareCost)

        return { name, id, dbfId, cards: sortedClassCards }
      })
    },
    hero: ({ id }) => {
      const { name, cardClass } = heros.find((hero) => hero.id === id)

      const classCards = standardCards.filter((card) => card.cardClass === cardClass).map(({ id, dbfId, cardClass, name, set, cost, rarity }) => {
        return { id, dbfId, cardClass, name, set, cost, rarity }
      })

      const sortedClassCards = classCards.sort(compareCost)

      return { name, id, cards: sortedClassCards }
    },
    deckcode: ({
      cards = [[1, 2], [2, 2], [3, 2], [4, 1]], // [dbfid, count] pairs
      heroId = 1, // Warrior
      format = 2, // 1: Wild, 2: Standard
    }) => {
      const { dbfId } = heros.find(({ id }) => id === `HERO_0${heroId}`)

      let deckCards = cards
      if (cards.length === 1) {
        // HACK
        // the draftstone project sends cards like [[546, 1], [596,1] ...] but
        // somehow they are sent over the wire as a flat array. like [[546,1,596,1, ...]]
        // if the length is 1, we don't have this problem (assuming they didnt)
        // choose a deck of size 1...

        // this hack will un-flatten the array on the fly. FML
        // this is some mother-fucking next level bullshit

        deckCards = cards[0].reduce((pairs, dbfIdOrQuantity, index) => {
          if (index % 2 == 0) { // even indicies...
            // dbfId
            let dbfId = dbfIdOrQuantity
            let quantity = cards[0][index + 1]

            return pairs.concat([[dbfId, quantity]])
          } else {
            // quantity
            return pairs
          }
        }, [])
      }

      const deck = {
        cards: deckCards,
        format,
        heroes: [dbfId],
      }

      return encode(deck)
    },
    set: ({ id }) => {
      return cards.filter(({ set }) => set == id).map(({ id, cardClass, name }) => {
        return { id, cardClass, name }
      })
    },
  }

  const app = express()

  // CORS bullshit
  //   const whitelist = [
  //       // Allow domains here
  //       'http://localhost:3000',
  //   ];
  //   const corsOptions = {
  //     origin(origin, callback){
  //         const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
  //         callback(null, originIsWhitelisted);
  //     },
  //     credentials: true
  // };

  app.use('/graphql', cors(), graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  }))

  const DEFAULT_PORT = 5000
  /* eslint-disable-next-line no-console */
  console.log({
    // port: process.env.PORT || 4000
    port: process.env.PORT || DEFAULT_PORT
  })

  // app.listen(process.env.PORT || 4000)
  app.listen(process.env.PORT || DEFAULT_PORT)
})
