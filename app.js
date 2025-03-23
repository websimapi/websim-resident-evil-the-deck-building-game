import { config } from './config.js';

// Initialize WebsimSocket for multiplayer functionality
const room = new WebsimSocket();

// React components
const App = () => {
  const [activeTab, setActiveTab] = React.useState('collection');
  const [cards, setCards] = React.useState([]);
  const [selectedCardType, setSelectedCardType] = React.useState('');
  const [selectedExpansion, setSelectedExpansion] = React.useState('');
  const [isCreatingCard, setIsCreatingCard] = React.useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  
  // Get all cards from the database
  const allCards = React.useSyncExternalStore(
    room.collection('card').subscribe,
    room.collection('card').getList
  );
  
  // Filter cards based on selected type and expansion
  React.useEffect(() => {
    let filteredCards = [...allCards];
    
    if (selectedCardType) {
      filteredCards = filteredCards.filter(card => card.cardType === selectedCardType);
    }
    
    if (selectedExpansion) {
      filteredCards = filteredCards.filter(card => card.expansion === selectedExpansion);
    }
    
    setCards(filteredCards);
  }, [allCards, selectedCardType, selectedExpansion]);
  
  // Handle card creation form submission
  const handleCreateCard = async (event) => {
    event.preventDefault();
    
    setIsCreatingCard(true);
    
    try {
      const formData = new FormData(event.target);
      const cardData = Object.fromEntries(formData.entries());
      
      // Generate card description using LLM
      const description = await generateCardDescription(cardData);
      cardData.description = description;
      
      if (!cardData.imageUrl) {
        setIsGeneratingImage(true);
        // Generate card image using LLM
        const imagePrompt = generateImagePrompt(cardData);
        const imageResult = await websim.imageGen({
          prompt: imagePrompt,
          aspect_ratio: "3:4"
        });
        cardData.imageUrl = imageResult.url;
        setIsGeneratingImage(false);
      }
      
      // Create the card in the database
      await room.collection('card').create(cardData);
      
      // Reset form
      event.target.reset();
      setIsCreatingCard(false);
    } catch (error) {
      console.error('Error creating card:', error);
      setIsCreatingCard(false);
      setIsGeneratingImage(false);
    }
  };
  
  // Generate card description using LLM
  const generateCardDescription = async (cardData) => {
    const prompt = `Create a short description (max 50 words) for a ${cardData.cardType} card named "${cardData.name}" in a Resident Evil deck-building game. ${cardData.cardType === 'Character' ? 'Include a brief backstory.' : cardData.cardType === 'Weapon' ? 'Include damage potential and any special abilities.' : cardData.cardType === 'Infected' ? 'Describe its appearance and threat level.' : 'Describe its function in the game.'}`;
    
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a creative writer for a Resident Evil deck-building card game. Keep descriptions concise, thematic, and evocative of the survival horror genre."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    return completion.content;
  };
  
  // Generate image prompt based on card data
  const generateImagePrompt = (cardData) => {
    let basePrompt = '';
    
    switch (cardData.cardType) {
      case 'Character':
        basePrompt = `Resident Evil style portrait of ${cardData.name}, a human survivor or character from the Resident Evil universe`;
        break;
      case 'Weapon':
        basePrompt = `Detailed illustration of a ${cardData.name} weapon from Resident Evil, dark background, survival horror style`;
        break;
      case 'Infected':
        basePrompt = `Frightening zombie or monster called ${cardData.name} from Resident Evil, dark atmosphere, horror game style`;
        break;
      case 'Item':
        basePrompt = `Survival item ${cardData.name} from Resident Evil game, detailed, isolated on dark background`;
        break;
      case 'Action':
        basePrompt = `Action scene depicting ${cardData.name} from Resident Evil, dramatic lighting, horror atmosphere`;
        break;
      case 'Ammo':
        basePrompt = `Ammunition or resources called ${cardData.name} from Resident Evil, realistic rendering, dark background`;
        break;
      default:
        basePrompt = `Resident Evil themed card image for ${cardData.name}, dark horror atmosphere`;
    }
    
    return `${basePrompt}, card art style, high quality, detailed`;
  };
  
  return (
    <div className="container">
      <header className="header">
        <div className="logo">RE:DBG</div>
        <h1 className="game-title">Resident Evil: The Deck Building Game</h1>
      </header>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          Card Collection
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Cards
        </button>
        <button 
          className={`tab ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
        >
          Game Rules
        </button>
      </div>
      
      <div className={`tab-content ${activeTab === 'collection' ? 'active' : ''}`}>
        <div className="filter-controls">
          <div className="filter-control">
            <label htmlFor="card-type-filter">Filter by Type:</label>
            <select 
              id="card-type-filter" 
              value={selectedCardType}
              onChange={(e) => setSelectedCardType(e.target.value)}
            >
              <option value="">All Types</option>
              {config.cardTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-control">
            <label htmlFor="expansion-filter">Filter by Expansion:</label>
            <select 
              id="expansion-filter" 
              value={selectedExpansion}
              onChange={(e) => setSelectedExpansion(e.target.value)}
            >
              <option value="">All Expansions</option>
              {config.expansions.map(expansion => (
                <option key={expansion} value={expansion}>{expansion}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="card-container">
          {cards.length > 0 ? (
            cards.map(card => (
              <Card key={card.id} card={card} />
            ))
          ) : (
            <p>No cards found. Create some cards to get started!</p>
          )}
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'create' ? 'active' : ''}`}>
        <h2>Create a New Card</h2>
        <form className="create-card-form" onSubmit={handleCreateCard}>
          <div className="form-group">
            <label htmlFor="name">Card Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          
          <div className="form-group">
            <label htmlFor="cardType">Card Type:</label>
            <select id="cardType" name="cardType" required>
              <option value="">Select Type</option>
              {config.cardTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="expansion">Expansion:</label>
            <select id="expansion" name="expansion" required>
              {config.expansions.map(expansion => (
                <option key={expansion} value={expansion}>{expansion}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (optional):</label>
            <input type="text" id="imageUrl" name="imageUrl" placeholder="Leave blank to auto-generate" />
          </div>
          
          <div className="form-group">
            <label htmlFor="statValue">Stat Value (optional):</label>
            <input type="number" id="statValue" name="statValue" placeholder="Power, Health, or Ammo value" />
          </div>
          
          <button type="submit" className="button" disabled={isCreatingCard}>
            {isCreatingCard ? (isGeneratingImage ? 'Generating Image...' : 'Creating Card...') : 'Create Card'}
          </button>
        </form>
      </div>
      
      <div className={`tab-content ${activeTab === 'game' ? 'active' : ''}`}>
        <h2>Game Rules</h2>
        <GameRules />
      </div>
    </div>
  );
};

// Card component
const Card = ({ card }) => {
  return (
    <div className="card">
      {card.imageUrl && (
        <img src={card.imageUrl} alt={card.name} className="card-image" />
      )}
      <div className="card-content">
        <h3 className="card-title">{card.name}</h3>
        <div className="card-type">{card.cardType} - {card.expansion}</div>
        <div className="card-description">{card.description}</div>
        {card.statValue && (
          <div className="card-stats">
            {card.cardType === 'Character' && <span>Health: {card.statValue}</span>}
            {card.cardType === 'Weapon' && <span>Damage: {card.statValue}</span>}
            {card.cardType === 'Infected' && <span>Power: {card.statValue}</span>}
            {card.cardType === 'Ammo' && <span>Value: {card.statValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Game Rules component
const GameRules = () => {
  return (
    <div className="game-rules">
      <h3>Basic Play</h3>
      <p>The game is a deck-building game where players build their decks over the course of a game. Players start with ten basic cards and draw five cards each turn.</p>
      
      <h4>On Your Turn, You Can:</h4>
      <ul>
        <li><strong>Buy:</strong> Add more cards to your inventory using Ammo as currency.</li>
        <li><strong>Action:</strong> Play blue Action cards with special effects.</li>
        <li><strong>Explore:</strong> Equip weapons to fight Infected from the Mansion Area.</li>
      </ul>
      
      <h3>Game Modes</h3>
      <ul>
        {config.gameModes.map(mode => (
          <li key={mode}><strong>{mode}</strong></li>
        ))}
      </ul>
      
      <h3>Card Types</h3>
      <ul>
        <li><strong>Characters:</strong> Each with unique skills unlocked by earning decorations.</li>
        <li><strong>Infected:</strong> Enemies from the series encountered when Exploring.</li>
        <li><strong>Weapons:</strong> Used to defeat Infected, requiring appropriate ammo.</li>
        <li><strong>Items:</strong> Healing items and other beneficial effects.</li>
        <li><strong>Actions:</strong> Special cards with effects that help your turn.</li>
        <li><strong>Ammo:</strong> Functions as both ammunition and currency.</li>
      </ul>
    </div>
  );
};

// Render the app
ReactDOM.render(
  <App />,
  document.getElementById('app')
);

