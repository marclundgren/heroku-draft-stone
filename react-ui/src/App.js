import PropTypes from 'prop-types'
import ApolloClient from "apollo-boost"
import gql from "graphql-tag"
import React, { Component } from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
// import Icon from '@material-ui/core/Icon'

// import QRCode from 'react-qr'
// npm install qrcode-react
import QRCode from 'qrcode-react'

// var component = React.createClass({
//   render () {
//
//   }
// })

import './App.css';

const DECK_SIZE = 30;
// const FORMAT = 2; // 1: Wild, 2: Standard
// until i come up with a smarter way to do this...
const PLAYER_ONE_TURNS = [0, 3,4, 7,8, 11,12, 15,16, 19,20, 23,24, 27,28, 31,32, 35,36, 39,40, 43,44, 47,48, 51,52, 55,56, 59]
const PLAYER_TWO_TURNS = [1,2, 5,76, 9,10, 13,14, 17,18, 21,22, 25,26, 29,30, 33,34, 37,38, 41,42, 45,46, 49,50, 53,54, 57,58]

// https://draftstone.herokuapp.com/
const client = new ApolloClient({ uri: '/graphql' });
// const client = new ApolloClient({ uri: ':4000/graphql' });
// const client = new ApolloClient({ uri: "https://draftstone.herokuapp.com/graphql" });

const Herolist = ({ ids, onClick }) => (
  <div className="hero-list">
    {ids.map((id) =>
      <HeroPortrait key={id} id={id} onClick={onClick} />
    )}
  </div>
)

const Cardlist = ({ cards = [], onClick = () => {}, unavailableCards = [] }) =>
  <div className="card-list">
    {
      cards.map(({ id, cost, name, rarity, dbfId, quantity }) => {

        const disabled = unavailableCards.find((card) => card.id === id)

        return <Card
          key={id}
          id={id}
          cost={cost}
          name={name}
          rarity={rarity}
          dbfId={dbfId}
          quantity={quantity}
          onClick={disabled ? () => {} : onClick }
          disabled={disabled}
        />
      }
    )}
  </div>


const HeroPortrait = ({ id, onClick }) => {
  return <div className='hero-crop clickable' onClick={() => onClick(id)}>
    <img alt="hero" src={`https://art.hearthstonejson.com/v1/render/latest/enUS/256x/${id}.png`} />
  </div>
}
const Card = ({ id, cost = 0, name = 'Enrage', rarity = 'FREE', onClick, disabled = false, quantity = 0, dbfId }) => {
  const className = `card clickable ${rarity.trim().toLowerCase()} ${disabled ? 'disabled' : ''}`

  return (
    <div className={className} onClick={() => onClick({ id, name, cost, rarity, dbfId })}>
      <div className="name">{name}</div>
      <div className="mana-bg-container">
        <span className="mana-cost">{cost}</span>
        <span className="bg">
          <img width="256" height="382" alt="card" src={`https://art.hearthstonejson.com/v1/render/latest/enUS/256x/${id}.png`} />
        </span>
        {quantity > 0 ? <span className='quantity'>x{quantity}</span> : ''}
      </div>
    </div>
  )
}

const CardPreview = ({ id, width = '256', height = '382' }) => <img className='card-preview' width={width} height={height} alt="card" src={`https://art.hearthstonejson.com/v1/render/latest/enUS/256x/${id}.png`} />

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activePlayerIndex: 0,
      heroId: '',
      format: 2, // 1: Wild, 2: Standard
      heroCards: [],
      neutralCards: [],
      playerOneName: '',
      playerTwoName: '',
      playerOneDraftedCards: [],
      playerTwoDraftedCards: [],
      draftSize: 10,
      draftMode: 'snake',
      selectedCard: null,
      showingDraftResults: false,
      showingPlayerOneDeckCompletion: false,
      showingPlayerOneDraft: false,
      showingPlayerTwoDraft: false,
      playerOneDeck: [],
      playerTwoDeck: [],
      showingDeckCodes: false,
    }
  }

  selectHero(heroId) {
    return client.query({
      query: gql`
        {
          hero(id: "${heroId}") {
            cards {
             	id
            	cost
             	name
             	set
              rarity
              dbfId
           }
          }
        }
      `
    }).then(({ data }) => {
      const { hero } = data
      const { cards } = hero
      this.setState({ heroId, heroCards: cards })
    })
  }

  renderDraftConfiguration() {
    let playerOneName = 'PwnDonkey'
    let playerTwoName = 'BooBooJeffries'
    let draftSize = 10
    let draftMode = 'snake'

    const onChangePlayerOneName = ({target}) => playerOneName = target.value
    const onChangePlayerTwoName = ({target}) => playerTwoName = target.value
    const onChangeDraftSize = ({target}) => draftSize = target.value

    const onStart = () => this.setState({ playerOneName, playerTwoName, draftSize , draftMode })

    const inputProps = { inputProps: { className: 'foo', min: 1, max: 30 } }

    return (
      <div>
        <div>
          <TextField
            required
            autoFocus={true}
            id="playerOne"
            label="Player One"
            placeholder="PwnDonkey"
            defaultValue=""
            margin="normal"
            onChange={onChangePlayerOneName}
          />
        </div>
        <div>
          <TextField
            required
            id="playerTwo"
            label="Player Two"
            placeholder="BooBooJeffries"
            defaultValue=""
            margin="normal"
            onChange={onChangePlayerTwoName}
          />
        </div>

        <div>
          <TextField
            required
            InputProps={inputProps}
            keyboardtype='numeric'
            id="draftSize"
            label="Draft Size"
            placeholder="10"
            defaultValue="10"
            margin="normal"
            onChange={onChangeDraftSize}
          />
        </div>

        <br/>

        <Button variant="contained" color="primary" onClick={onStart} >
          Start
        </Button>
      </div>
    )
  }

  renderHeroSelection() {
    const HERO_IDs = [
      'HERO_01',
      'HERO_02',
      'HERO_03',
      'HERO_04',
      'HERO_05',
      'HERO_06',
      'HERO_07',
      'HERO_08',
      'HERO_09',
    ]

    return <Herolist ids={HERO_IDs} onClick={this.selectHero.bind(this)} />
  }

  playerOneTurn() {
    const { playerOneDraftedCards, playerTwoDraftedCards } = this.state
    const draftedCards = playerOneDraftedCards.concat(playerTwoDraftedCards)

    return PLAYER_ONE_TURNS.indexOf(draftedCards.length + 1) > -1
  }

  playerTwoTurn() {
    const { playerOneDraftedCards, playerTwoDraftedCards } = this.state
    const draftedCards = playerOneDraftedCards.concat(playerTwoDraftedCards)

    return PLAYER_TWO_TURNS.indexOf(draftedCards.length) > -1
  }

  draftCard() {
    const { activePlayerIndex, playerOneDraftedCards, playerTwoDraftedCards, selectedCard } = this.state

    if (selectedCard) {
      const { id, name, cost, rarity, dbfId } = selectedCard

      if (activePlayerIndex === 0)  { // first player's turn
        const newPlayerOneDraftedCards = playerOneDraftedCards.concat({ id, name, cost, rarity, dbfId })

        this.setState({
          playerOneDraftedCards: newPlayerOneDraftedCards,
        })
      } else { // second player's turn
        this.setState({
          playerTwoDraftedCards: playerTwoDraftedCards.concat({ id, name, cost, rarity, dbfId })
        })
      }

      let newActiveIndex

      if (this.playerOneTurn()) {
        newActiveIndex = 0
      } else {
        newActiveIndex = 1
      }

      this.setState({
        activePlayerIndex: newActiveIndex,
        selectedCard: null,
      })
    }
  }

  playerOneDeckSize() {
    const { playerOneDeck } = this.state
    return playerOneDeck.reduce((totalSize, { quantity }) =>
      totalSize + quantity
    , 0)
  }
  playerTwoDeckSize() {
    const { playerTwoDeck } = this.state
    return playerTwoDeck.reduce((totalSize, { quantity }) =>
      totalSize + quantity
    , 0)
  }

  addCardToDeck() {
    const { activePlayerIndex, playerOneDeck, playerTwoDeck, selectedCard, heroId, format } = this.state
    const { id, name, cost, rarity, dbfId } = selectedCard

    let deck = activePlayerIndex === 0 ? playerOneDeck : playerTwoDeck

    const card = deck.find((card) => card.id === id) || { quantity: 0 }
    const { quantity } = card

    if (quantity === 0) {
      // add a new entity with {quantity: 1}
      deck = deck.concat({ id, name, cost, rarity, dbfId, quantity: 1 })
      this.setState({
        [(activePlayerIndex === 0) ? 'playerOneDeck' : 'playerTwoDeck']: deck
      })
    } else if (quantity === 1) {
      // updating the existing entity's quantity: to {quantity: 2}
      deck = deck.map((card) => {
        if (card.id === id) {
          return { id: card.id, name: card.name, cost: card.cost, dbfId: card.dbfId, quantity: card.quantity + 1 }
        } else {
          return card
        }
      })
      this.setState({
        [(activePlayerIndex === 0) ? 'playerOneDeck' : 'playerTwoDeck']: deck
      })
    }

    if ((activePlayerIndex === 0) && this.playerOneDeckSize() + 1 >= DECK_SIZE) {
      this.setState({ activePlayerIndex: 1, showingPlayerTwoDeckCompletion: true, showingPlayerOneDeckCompletion: false })
    }

    if ((activePlayerIndex === 1) && this.playerTwoDeckSize() + 1 >= DECK_SIZE) {
      const playerOneCards = playerOneDeck.reduce((dbfIdPairs, { dbfId, quantity, /*name*/ }) => {
        return  dbfIdPairs.concat([[dbfId, quantity]])
      }
      , [])

      const playerTwoCards = deck.reduce((dbfIdPairs, { dbfId, quantity, /*name*/ }) => {
        return dbfIdPairs.concat([[dbfId, quantity]])
      }
      , [])

      const playerOneDeckCodePromise = client.query({
        query: gql`
          {
            deckcode(format: ${format}
              heroId: "${heroId.slice(heroId.length - 1)}"
              cards: [[${playerOneCards}]])
          }
        `
      })

      const playerTwoDeckCodePromise = client.query({
        query: gql`
          {
            deckcode(format: ${format}
              heroId: "${heroId.slice(heroId.length - 1)}"
              cards: [[${playerTwoCards}]])
          }
        `
      })

      return Promise.all([playerOneDeckCodePromise, playerTwoDeckCodePromise])
      .then(([playerOneDeckCodeResponse, playerTwoDeckCodeResponse]) => {

        this.setState({
          showingDeckCodes: true,
          showingPlayerTwoDeckCompletion: false,
          activePlayerIndex: -1,
          playerOneDeckCode: playerOneDeckCodeResponse.data.deckcode,
          playerTwoDeckCode: playerTwoDeckCodeResponse.data.deckcode,
        })
      })
    }

    this.setState({ selectedCard: null })
  }

  renderHeroCards() {
    const { heroCards = [], selectedCard, playerOneDraftedCards, playerTwoDraftedCards, showingPlayerOneDraft, showingPlayerTwoDraft, playerOneName, playerTwoName } = this.state

    const draftedCards = playerOneDraftedCards.concat(playerTwoDraftedCards)

    const listActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        primary={true}
        onClick={() => {this.setState({ selectedCard: null })}}
      />,
      <FlatButton
        key="draft"
        label="Draft"
        primary={true}
        keyboardFocused={true}
        onClick={this.draftCard.bind(this)}
      />,
    ];

    const playerDraftPreviewActions = [
      <FlatButton
        key="okay"
        label="Okay"
        primary={true}
        onClick={() => {this.setState({ showingPlayerOneDraft: false, showingPlayerTwoDraft: false })}}
      />
    ];

    const onSelectHeroCard = (selectedCard) => this.setState({ selectedCard })

    return (
      <div className='main-scroll-container'>
        <Dialog
          className='list'
          actions={listActions}
          modal={false}
          open={selectedCard}
          onRequestClose={() => {this.setState({ selectedCard: null })}}
        >
          <div className="list margined-left margined-right">
            <CardPreview id={selectedCard && selectedCard.id} />
          </div>
        </Dialog>
        <Dialog
          className='list'
          actions={playerDraftPreviewActions}
          modal={false}
          open={showingPlayerOneDraft}
          onRequestClose={() => {this.setState({ showingPlayerOneDraft: false })}}
        >
          <strong className="list">{`Draft in progress (${playerOneName})`}</strong>
          <div className="list draft-preview">
            {playerOneDraftedCards.map(({ id }) => <div key={id} className="_crop"><CardPreview id={id} height={191/2} width={128/2} /></div>)}
          </div>
        </Dialog>
        <Dialog
          className='list'
          actions={playerDraftPreviewActions}
          modal={false}
          open={showingPlayerTwoDraft}
          onRequestClose={() => {this.setState({ showingPlayerTwoDraft: false })}}
        >
          <strong className="list">{`Draft in progress (${playerTwoName})`}</strong>
          <div className="list draft-preview">
            {
              playerTwoDraftedCards.map(({ id }) => {
                return <div key={id} className="_crop">
                  <CardPreview id={id} height={191/2} width={128/2}/>
                </div>
              })
            }
          </div>
        </Dialog>

        <div className="list column">
          <div className="list player-drafted-cards">
            <Cardlist className="player-one" cards={playerOneDraftedCards} onClick={() => {}} />
            <Cardlist className="player-two" cards={playerTwoDraftedCards} onClick={() => {}} />
          </div>
          <Cardlist cards={heroCards} onClick={onSelectHeroCard} unavailableCards={draftedCards} />
        </div>
      </div>
    )
  }

  playerTurn() {
    const { activePlayerIndex, playerOneName, playerTwoName } = this.state

    return {
      activePlayerIndex,
      name: activePlayerIndex === 0 ? playerOneName : playerTwoName,
    }
  }

  playerOneCardSelectionSet() {
    return <div className='selection-set'>
      {
        this.state.playerOneDraftedCards.map(({ id, name, rarity, cost }) => <Card key={id} id={id} name={name} rarity={rarity} cost={cost} />)
    }
    </div>
  }
  playerTwoCardSelectionSet() {

  }

  playerOneHeader() {
    const { activePlayerIndex, playerOneName, playerOneDraftedCards, showingDraftResults } = this.state
    const inactive = showingDraftResults ? false : (activePlayerIndex !== 0)
    // const deckLength = playerOneDeck.length
    const deckLength = this.playerOneDeckSize()
    const draftLength = playerOneDraftedCards.length
    const length = deckLength || draftLength

    const className = `${inactive ? 'muted-bg' : ''} player list column clickable`
    const name = `${playerOneName}${length ? ' (' + length + ')' : ''}`
    const onClick = length ? () => this.setState({ showingPlayerOneDraft: true }) : () => {}

    return <div className={className} onClick={onClick}>
      <span>{name}</span>
    </div>
  }
  playerTwoHeader() {
    const { activePlayerIndex, playerTwoName, playerTwoDraftedCards, showingDraftResults } = this.state
    const inactive = showingDraftResults ? false : (activePlayerIndex !== 1)
    // const deckLength = playerTwoDeck.length
    const deckLength = this.playerTwoDeckSize()
    const draftLength = playerTwoDraftedCards.length
    const length = deckLength || draftLength

    const className = `${inactive ? 'muted-bg' : ''} player list column clickable`
    const name = `${playerTwoName}${length ? ' (' + length + ')' : ''}`
    const onClick = length ? () => this.setState({ showingPlayerTwoDraft: true }) : () => {}

    return <div className={className} onClick={onClick}>
      <span>{name}</span>
    </div>
  }

  renderHeader() {
    const { heroCards } = this.state

    if (heroCards.length) {
      return <header className="App-header list">
        {this.playerOneHeader()}
        {this.playerTwoHeader()}
      </header>
    } else {
      return <header className="App-header list">
        <h1 className="App-title">Draft&ndash;stone</h1>
      </header>
    }
  }

  renderShowDeckCompletionMessage() {
    const actions = [
      <FlatButton
        key="okay"
        label="Okay"
        primary={true}
        onClick={() => {this.setState({ showingDraftResults: true })}}
      />
    ]

    return <Dialog
      className='list'
      actions={actions}
      modal={false}
      open={true}
      onRequestClose={() => this.setState({ showingDraftResults: false })}
    >
      <p>The draft is complete!</p>

      <p>
        After reviewing the Draft results, each player will then
        proceed to finish their respective decks.
      </p>

      <p>
        Drafted Cards are exclusive to the player that drafted them.
      </p>

      <p>
        A completed deck will contain at least one copy of each drafted card.
      </p>
    </Dialog>
  }

  renderDraftResults() {
    const { playerOneDraftedCards, playerTwoDraftedCards, previewingDraftCard } = this.state

    const onPreviewDraftedCard = (card) => this.setState({ previewingDraftCard: card})

    const actions = [
      <FlatButton
        key="okay"
        label="Okay"
        primary={true}
        onClick={() => {this.setState({ previewingDraftCard: null })}}
      />
    ];

    const label = 'Complete your decks'

    const onClick = () => {
      client.query({
        query: gql`
          {
            neutralcards {
              id
              cost
              rarity
              name
              dbfId
            }
          }
        `
      }).then(({ data }) => {
        const { neutralcards } = data
        this.setState({
          neutralCards: neutralcards,
          showingDraftResults: false,
          showingPlayerOneDeckCompletion: true,
          activePlayerIndex: 0,
          playerOneDeck: playerOneDraftedCards.map(({ id, name, rarity, cost, dbfId }) => {
            return {
              id,
              quantity: 1,
              name,
              rarity,
              cost,
              dbfId,
            }
          }),
          playerTwoDeck: playerTwoDraftedCards.map(({ id, name, rarity, cost, dbfId }) => {
            return {
              id,
              quantity: 1,
              name,
              rarity,
              cost,
              dbfId,
            }
          }),
        })
      })
    }

    return <div>
      <Dialog
        className='list'
        actions={actions}
        modal={false}
        open={previewingDraftCard}
        onRequestClose={() => {this.setState({ previewingDraftCard: null })}}
      >
        <div className="list margined-left margined-right">
          <CardPreview id={previewingDraftCard && previewingDraftCard.id} />
        </div>
      </Dialog>

      <div className="list">
        <Cardlist cards={playerOneDraftedCards} onClick={onPreviewDraftedCard} />
        <Cardlist cards={playerTwoDraftedCards} onClick={onPreviewDraftedCard} />
      </div>

      <RaisedButton
        key="showingPlayerOneDeckCompletion"
        label={label}
        primary={true}
        keyboardFocused={true}
        onClick={onClick}
      />,
    </div>
  }

  renderPlayerOneDeckCompletion() {
    const { heroCards = [], selectedCard, playerTwoDraftedCards, showingPlayerOneDeck, playerOneName, neutralCards, playerOneDeck = [] } = this.state

    const cards = heroCards.filter((card) =>
      playerTwoDraftedCards.map(({ id }) => id).indexOf(card.id) === - 1
    ).concat(neutralCards)

    const unavailableCards = playerOneDeck.filter(({ rarity, quantity }) =>
      rarity === 'LEGENDARY' ? quantity >= 1 : quantity >= 2
    )

    const disabled = unavailableCards.find(({ id }) => id === selectedCard && selectedCard.id)

    const listActions = [
      <FlatButton
        key="cancel"
        label="Back"
        primary={true}
        onClick={() => {this.setState({ selectedCard: null })}}
      />,
      <FlatButton
        key="add-to-deck"
        label="Add to Deck"
        primary={true}
        keyboardFocused={true}
        disabled={!!disabled}
        onClick={this.addCardToDeck.bind(this)}
      />,
    ];

    const playerDeckPreviewActions = [
      <FlatButton
        key="okay"
        label="Okay"
        primary={true}
        onClick={() => {this.setState({ showingPlayerOneDeck: false, showingPlayerTwoDeck: false })}}
      />
    ];

    const onSelectCard = (selectedCard) => this.setState({ selectedCard })

    const cardsWithQuantity = cards.map(({ id, name, rarity, cost, dbfId }) => {
      const { quantity = 0 } = playerOneDeck.find((card) => card.id === id) || { }
      return { id, name, rarity, cost, quantity, dbfId }
    })

    return (
      <div className='main-scroll-container'>
        <Dialog
          className='list'
          actions={listActions}
          modal={false}
          open={selectedCard}
          onRequestClose={() => {this.setState({ selectedCard: null })}}
        >
          <div className="list margined-left margined-right">
            <CardPreview id={selectedCard && selectedCard.id} />
          </div>
        </Dialog>
        <Dialog
          className='list'
          actions={playerDeckPreviewActions}
          modal={false}
          open={showingPlayerOneDeck}
          onRequestClose={() => {this.setState({ showingPlayerOneDeck: false })}}
        >
          <strong className="list">{`Deck in progress (${playerOneName})`}</strong>
          <div className="list deck-preview">
            {playerOneDeck.map(({ id }) => <div key={id} className="_crop"><CardPreview id={id} height={191/2} width={128/2} /></div>)}
          </div>
        </Dialog>

        <Cardlist cards={cardsWithQuantity} onClick={onSelectCard} unavailableCards={unavailableCards} />
      </div>
    )
  }

  renderPlayerTwoDeckCompletion() {
    const { heroCards = [], selectedCard, playerOneDraftedCards, showingPlayerTwoDeck, playerTwoName, neutralCards, playerTwoDeck = [] } = this.state

    const cards = heroCards.filter((card) =>
      playerOneDraftedCards.map(({ id }) => id).indexOf(card.id) === - 1
    ).concat(neutralCards)

    const unavailableCards = playerTwoDeck.filter(({ rarity, quantity }) =>
      rarity === 'LEGENDARY' ? quantity >= 1 : quantity >= 2
    )

    const disabled = unavailableCards.find(({ id }) => id === selectedCard && selectedCard.id)

    const listActions = [
      <FlatButton
        key="cancel"
        label="Back"
        primary={true}
        onClick={() => {this.setState({ selectedCard: null })}}
      />,
      <FlatButton
        key="add-to-deck"
        label="Add to Deck"
        primary={true}
        keyboardFocused={true}
        disabled={!!disabled}
        onClick={this.addCardToDeck.bind(this)}
      />,
    ];

    const playerDeckPreviewActions = [
      <FlatButton
        key="okay"
        label="Okay"
        primary={true}
        onClick={() => {this.setState({ showingPlayerTwoDeck: false, showingDeckCodes: true })}}
      />
    ];

    const onSelectCard = (selectedCard) => this.setState({ selectedCard })

    const cardsWithQuantity = cards.map(({ id, name, rarity, cost, dbfId }) => {
      const { quantity = 0 } = playerTwoDeck.find((card) => card.id === id) || { }
      return { id, name, rarity, cost, dbfId, quantity }
    })

    return (
      <div className='main-scroll-container'>
        <Dialog
          className='list'
          actions={listActions}
          modal={false}
          open={selectedCard}
          onRequestClose={() => {this.setState({ selectedCard: null })}}
        >
          <div className="list margined-left margined-right">
            <CardPreview id={selectedCard && selectedCard.id} />
          </div>
        </Dialog>
        <Dialog
          className='list'
          actions={playerDeckPreviewActions}
          modal={false}
          open={showingPlayerTwoDeck}
          onRequestClose={() => {this.setState({ showingPlayerTwoDeck: false })}}
        >
          <strong className="list">{`Deck in progress (${playerTwoName})`}</strong>
          <div className="list deck-preview">
            {playerTwoDeck.map(({ id }) => <div key={id} className="_crop"><CardPreview id={id} height={191/2} width={128/2} /></div>)}
          </div>
        </Dialog>

        <Cardlist cards={cardsWithQuantity} onClick={onSelectCard} unavailableCards={unavailableCards} />
      </div>
    )
  }

  renderDeckCodes() {
    const { playerOneDeckCode, playerTwoDeckCode, showingPlayerOneDeck, showingPlayerTwoDeck, playerOneDeck, playerTwoDeck, playerOneName, playerTwoName } = this.state
    return <div>
      <div className="list space-evenly deck-codes">
        <pre className='deck-code'>{playerOneDeckCode}</pre>
        <pre className='deck-code'>{playerTwoDeckCode}</pre>
      </div>
      <div className="list space-evenly qr-codes">
        <QRCode value={playerOneDeckCode} />
        <QRCode value={playerTwoDeckCode} />
      </div>

      <div className="list space-evenly">
        <FlatButton
          key="preview-deck-player-one"
          label="Preview Deck"
          primary={true}
          onClick={() => {this.setState({ showingPlayerOneDeck: true, showingPlayerTwoDeck: false })}}
        />
        <FlatButton
          key="preview-deck-player-one"
          label="Preview Deck"
          primary={true}
          onClick={() => {this.setState({ showingPlayerTwoDeck: true, showingPlayerOneDeck: false })}}
        />
      </div>
      <Dialog
        className='list'
        actions={[
          <FlatButton
            key="dismiss-player-one-deck"
            label="Okay"
            primary={true}
            onClick={() => {this.setState({ showingPlayerOneDeck: false })}}
          />
        ]}
        modal={false}
        open={showingPlayerOneDeck}
        onRequestClose={() => {this.setState({ showingPlayerOneDeck: false })}}
      >
        <strong className="list">{`Deck (${playerOneName})`}</strong>
        <div className="list deck-preview">
          {playerOneDeck.map(({ id, name, rarity, cost, quantity }) => <div key={id} className="_crop"><Card id={id} name={name} rarity={rarity} cost={cost} quantity={quantity} /></div>)}
        </div>
      </Dialog>
      <Dialog
        className='list'
        actions={[
          <FlatButton
            key="dismiss-player-two-deck"
            label="Okay"
            primary={true}
            onClick={() => {this.setState({ showingPlayerTwoDeck: false })}}
          />
        ]}
        modal={false}
        open={showingPlayerTwoDeck}
        onRequestClose={() => {this.setState({ showingPlayerTwoDeck: false })}}
      >
        <strong className="list">{`Deck (${playerTwoName})`}</strong>
        <div className="list deck-preview">
          {playerTwoDeck.map(({ id, name, rarity, cost, quantity }) => <div key={id} className="_crop"><Card id={id} name={name} rarity={rarity} cost={cost} quantity={quantity} /></div>)}
        </div>
      </Dialog>
    </div>
  }

  render() {
    const { heroId, heroCards, playerOneName, playerTwoName, draftSize, draftMode, playerOneDraftedCards, playerTwoDraftedCards, showingDraftResults, showingPlayerOneDeckCompletion, showingPlayerTwoDeckCompletion, showingDeckCodes } = this.state

    const draftedCards = playerOneDraftedCards.concat(playerTwoDraftedCards)

    let outlet
    const hasConfiguration = !!(playerOneName && playerTwoName && (draftSize > 0) && draftMode)

    if (!hasConfiguration) {
      outlet = this.renderDraftConfiguration()
    } else if (!heroId) {
      outlet = this.renderHeroSelection()
    }
    else if (heroCards && draftedCards.length < (draftSize * 2)) {
      outlet = this.renderHeroCards()
    } else if (draftedCards.length >= (draftSize * 2) && !showingDraftResults && !showingPlayerOneDeckCompletion && !showingPlayerTwoDeckCompletion && !showingDeckCodes) {
      outlet = this.renderShowDeckCompletionMessage()
    } else if (showingDraftResults && !showingDeckCodes) {
      outlet = this.renderDraftResults()
    } else if (showingPlayerOneDeckCompletion) {
      outlet = this.renderPlayerOneDeckCompletion()
    } else if (showingPlayerTwoDeckCompletion) {
      outlet = this.renderPlayerTwoDeckCompletion()
    } else if (showingDeckCodes) {
      outlet = this.renderDeckCodes()
    }

    return (
      <MuiThemeProvider>
        <div className="App">
          {this.renderHeader()}

          {outlet}
        </div>
      </MuiThemeProvider>
    )
  }
}

export default App;

Herolist.propTypes = {
  ids: PropTypes.array,
  onClick: PropTypes.func,
};
Cardlist.propTypes = {
  ids: PropTypes.array,
  onClick: PropTypes.func,
  cards: PropTypes.array,
  unavailableCards: PropTypes.array,
};
Card.propTypes = {
  id: PropTypes.string,
  onClick: PropTypes.func,
  cost: PropTypes.number,
  name: PropTypes.string,
  rarity: PropTypes.string,
  disabled: PropTypes.boolean,
  quantity: PropTypes.number,
  dbfId: PropTypes.number,
};
CardPreview.propTypes = {
  id: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
}
HeroPortrait.propTypes = {
  id: PropTypes.string,
  onClick: PropTypes.func,
};
