import React, { useState, useEffect } from 'react';
import styled, { withTheme } from 'styled-components';

const placeholderArticles = [
  {
    id: 1,
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=500&auto=format&fit=crop&q=60',
    title: 'The Future of AI in Software Development',
    description: 'AI is revolutionizing the way we build software, from automated coding to intelligent testing.',
    source: 'techanalyst.io',
    size: 'featured',
    content: `Artificial Intelligence is fundamentally transforming the landscape of software development, ushering in an era where machines can write, test, and optimize code with unprecedented efficiency. From GitHub Copilot to advanced debugging tools, AI-powered solutions are becoming indispensable companions for developers worldwide, offering suggestions, catching errors, and even generating entire code blocks based on natural language descriptions.

The impact extends far beyond simple code completion. Machine learning algorithms are now capable of analyzing vast codebases to identify patterns, predict potential bugs, and suggest architectural improvements. Companies like OpenAI, Microsoft, and Google are investing billions in developing AI systems that can understand context, maintain coding standards, and even refactor legacy systems automatically. This shift is not just about efficiency—it's about reimagining how software is conceived, developed, and maintained.

Testing and quality assurance represent another frontier where AI is making significant strides. Automated test generation, intelligent test case prioritization, and AI-driven code reviews are reducing the time between development and deployment. These systems can simulate thousands of user interactions, identify edge cases that human testers might miss, and provide comprehensive coverage reports that help teams make informed decisions about release readiness.

However, this technological revolution also raises important questions about the future role of human developers. While AI can handle routine tasks and boilerplate code, the creative problem-solving, system design, and ethical considerations that define great software still require human insight. The most successful development teams are learning to leverage AI as a powerful tool while maintaining their critical thinking and domain expertise.

As we look toward the future, the integration of AI in software development will likely become even more seamless and sophisticated. We can expect to see AI systems that understand business requirements, generate entire application architectures, and even handle deployment and monitoring. The developers who embrace these tools and learn to work alongside AI will find themselves more productive and capable of tackling increasingly complex challenges in our digital world.`
  },
  {
    id: 2,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1485313260896-6e6edf486858?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YW1lcmljYW4lMjBmb290YmFsbHxlbnwwfHwwfHx8MA%3D%3D',
    title: 'Titans Clinch Victory in a Nail-Biting Finish',
    description: 'A last-minute touchdown secures the championship for the Titans in a dramatic showdown.',
    source: 'sportsdaily.com',
    size: 'standard',
    content: `In what will be remembered as one of the most thrilling championship games in recent memory, the Tennessee Titans pulled off a stunning 28-24 victory over the Indianapolis Colts in a game that had everything: momentum swings, controversial calls, and a finish that left 70,000 fans on their feet. The victory marks the Titans' first championship in over two decades and caps off what many are calling a Cinderella season for the Nashville-based franchise.

The game started as a defensive battle, with both teams struggling to find rhythm on offense. The Colts drew first blood with a 43-yard field goal in the first quarter, but the Titans answered back with a methodical 12-play drive that culminated in a 2-yard touchdown run by running back Derrick Henry. The first half ended with the Titans holding a slim 7-3 lead, setting the stage for an explosive second half that would test both teams' championship mettle.

The third quarter belonged entirely to Indianapolis, as quarterback Anthony Richardson threw for two touchdowns and 186 yards, including a spectacular 52-yard bomb to receiver Michael Pittman Jr. that had the visiting Colts fans erupting in celebration. By the end of the third quarter, Indianapolis had built what seemed like a commanding 21-7 lead, and many analysts were already preparing to discuss the Colts' championship coronation.

However, the Titans had other plans. Led by veteran quarterback Ryan Tannehill, who had been struggling with consistency all season, Tennessee mounted one of the most impressive fourth-quarter comebacks in championship history. A 15-yard touchdown pass to A.J. Brown with 8:47 remaining cut the deficit to seven, and when the Titans defense forced a crucial three-and-out, the momentum had completely shifted. The stadium, which had been eerily quiet just minutes earlier, was now deafening as the home crowd sensed something special happening.

The defining moment came with just 47 seconds left on the clock. Facing a fourth-and-goal from the Colts' 3-yard line, Tannehill took the snap, rolled right, and found tight end Chig Okonkwo in the corner of the end zone for the game-winning touchdown. The extra point gave the Titans their 28-24 victory and sparked a celebration that could be heard throughout downtown Nashville. As confetti fell and players embraced on the field, it was clear that this wasn't just a victory—it was the culmination of years of hard work, dedication, and belief in each other.`
  },
  {
    id: 3,
    category: 'finance',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60',
    title: 'Market Trends: What to Expect in the Next Quarter',
    description: 'Experts weigh in on the latest market fluctuations and predict upcoming financial trends.',
    source: 'financeinsights.net',
    size: 'compact',
    content: `Financial markets are entering a period of unprecedented complexity as the global economy grapples with shifting monetary policies, technological disruption, and evolving consumer behaviors. Leading economists and market analysts are closely monitoring several key indicators that could significantly impact investment strategies and portfolio performance over the next three months. The convergence of artificial intelligence adoption, sustainable investing, and changing demographic patterns is creating both opportunities and challenges for investors across all sectors.

The Federal Reserve's recent policy adjustments have created ripple effects throughout both domestic and international markets. With inflation showing signs of stabilization but remaining above target levels, many analysts expect continued volatility in interest-sensitive sectors such as real estate and utilities. Technology stocks, which have dominated market performance for the past decade, are facing increased scrutiny as investors question valuations and growth sustainability in a higher interest rate environment. However, companies with strong balance sheets and proven revenue models are likely to weather the storm better than their more speculative counterparts.

Emerging markets present a particularly interesting dynamic for the coming quarter, with several developing economies showing signs of robust growth despite global headwinds. Countries in Southeast Asia and Latin America are benefiting from supply chain diversification trends, as companies seek alternatives to traditional manufacturing hubs. This shift is creating opportunities in infrastructure, logistics, and technology sectors within these regions, though investors must carefully weigh potential returns against currency and political risks.

The energy sector continues to evolve rapidly, with traditional oil and gas companies increasingly investing in renewable energy technologies while maintaining their core operations. This transition is creating a complex investment landscape where timing and company selection become crucial factors. Solar and wind energy stocks have experienced significant volatility, but underlying demand fundamentals remain strong as governments worldwide commit to carbon reduction targets. Energy storage and grid modernization companies are emerging as particularly attractive investment opportunities.

Looking ahead to the next quarter, successful investors will likely be those who maintain diversified portfolios while staying alert to sector-specific developments. The key will be balancing growth opportunities in emerging technologies and markets with the stability offered by established companies and traditional asset classes. Market timing remains challenging, but those who focus on long-term value creation and maintain appropriate risk management strategies should be well-positioned to navigate the evolving financial landscape.`
  },
  {
    id: 4,
    category: 'art',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop&q=60',
    title: 'A Renaissance of Digital Art and NFTs',
    description: 'Exploring the vibrant and often controversial world of digital art and non-fungible tokens.',
    source: 'culturehub.org',
    size: 'wide',
    content: `The digital art revolution has fundamentally transformed how we create, consume, and value artistic expression in the 21st century. What began as experimental computer graphics in university labs has evolved into a multi-billion dollar ecosystem where artists can reach global audiences, bypass traditional gatekeepers, and establish new forms of ownership and authenticity through blockchain technology. Non-fungible tokens (NFTs) have become the most visible manifestation of this transformation, sparking heated debates about art, technology, and value while creating unprecedented opportunities for digital creators.

Traditional art institutions initially dismissed digital art as a fleeting technological novelty, but major museums and galleries are now scrambling to understand and integrate digital works into their collections. The Museum of Modern Art in New York recently acquired its first NFT collection, while the Louvre has begun experimenting with virtual exhibitions that showcase digital art alongside classical masterpieces. This institutional acceptance has legitimized digital art in ways that seemed impossible just a few years ago, opening doors for artists who previously struggled to find recognition in traditional art circles.

The NFT market, despite its volatility and criticism, has created new economic models for artists that were previously impossible. Digital artists can now embed royalties directly into their works, ensuring they receive compensation every time their art is resold—a benefit that traditional artists have long desired but rarely achieved. This has led to success stories of artists earning life-changing amounts from their digital creations, while also raising questions about sustainability, speculation, and the environmental impact of blockchain technologies.

Perhaps most significantly, digital art is democratizing creativity by lowering barriers to entry and providing new tools for artistic expression. Artists no longer need expensive materials, studio spaces, or gallery connections to share their work with the world. Social media platforms, digital marketplaces, and virtual reality environments have become the new galleries, allowing artists to build audiences and communities around their work. This has led to an explosion of diverse voices and artistic styles that might never have found platforms in the traditional art world.

As we move forward, the intersection of artificial intelligence, virtual reality, and blockchain technology promises to push digital art into even more uncharted territories. AI-generated art is challenging our fundamental assumptions about creativity and authorship, while VR and AR technologies are creating immersive experiences that blur the lines between art and reality. The future of art may be digital, but it will be shaped by the same human desires for beauty, meaning, and connection that have always driven artistic expression.`
  },
  {
    id: 5,
    category: 'tv',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop&q=60',
    title: 'The Most Anticipated TV Shows of the Year',
    description: 'A look at the new and returning series that have everyone talking.',
    source: 'screenrant.com',
    size: 'compact',
    content: `The television landscape has never been more competitive or diverse, with streaming platforms and traditional networks investing billions in original content to capture audience attention in an increasingly fragmented market. This year's slate of new and returning shows promises to deliver everything from epic fantasy adventures to intimate character dramas, reflecting the medium's continued evolution and the growing sophistication of television storytelling. Industry experts are predicting that several of these productions could redefine their respective genres and set new standards for television excellence.

Leading the charge is the highly anticipated return of "House of the Dragon," HBO's follow-up to "Game of Thrones," which promises to restore faith in the fantasy genre after the divisive conclusion of its predecessor. With a reported budget exceeding $200 million for the first season alone, the show features stunning production values, complex political intrigue, and the dragon-filled spectacle that made the original series a cultural phenomenon. Early reviews suggest that the show has learned from past mistakes, focusing on character development and narrative coherence while delivering the epic scope that fans expect.

Netflix continues its aggressive expansion into prestige television with "The Crown" returning for its final seasons, chronicling the later years of Queen Elizabeth II's reign. The series has become synonymous with Netflix's commitment to high-quality historical drama, and this final chapter is expected to tackle some of the most controversial and emotionally charged periods in recent royal history. Additionally, Netflix's investment in international content continues to pay dividends, with Korean dramas and European thrillers gaining massive global audiences and influencing television production worldwide.

Apple TV+ is making a significant push into science fiction with several highly anticipated series that showcase the platform's commitment to innovative storytelling and cutting-edge production values. "Foundation," based on Isaac Asimov's classic novels, promises to bring one of science fiction's most beloved properties to life with a scope and ambition rarely seen on television. The series represents Apple's strategy of investing in prestige content that can compete with HBO and Netflix while establishing its streaming service as a destination for quality entertainment.

The year also marks the return of several beloved series that are entering their final seasons, creating a bittersweet viewing experience for fans who have followed these characters for years. Shows like "Stranger Things" and "Better Call Saul" are concluding storylines that have defined the streaming era, while new series are being developed to fill the void left by these departing favorites. The television industry's ability to consistently produce compelling content across multiple platforms demonstrates the medium's continued vitality and its central role in contemporary entertainment culture.`
  },
  {
    id: 6,
    category: 'politics',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500&auto=format&fit=crop&q=60',
    title: 'Global Leaders Summit Addresses Climate Change',
    description: 'Nations come together to discuss new policies and commitments to combat the climate crisis.',
    source: 'worldnews.gov',
    size: 'standard',
    content: `World leaders gathered in Geneva this week for the most significant climate summit since the Paris Agreement, with representatives from 195 countries convening to address the accelerating climate crisis and establish more aggressive targets for carbon reduction. The three-day summit, hosted by the United Nations, brought together heads of state, environmental ministers, and climate scientists to discuss new strategies for limiting global temperature rise and adapting to the environmental changes already underway. The urgency of the discussions was underscored by recent reports showing that current global efforts fall short of preventing catastrophic climate change.

The summit's opening day featured stark presentations from climate scientists who outlined the current state of global warming and its projected impacts. Dr. Maria Santos, lead researcher at the International Climate Research Institute, presented data showing that global temperatures have risen faster than previously predicted, with Arctic ice loss and sea level rise accelerating beyond worst-case scenarios from just five years ago. These findings prompted immediate calls for more aggressive action from both developed and developing nations, with many leaders acknowledging that their current commitments are insufficient to meet the challenge.

One of the most significant developments was the announcement of a new international climate finance mechanism designed to help developing countries transition to clean energy and adapt to climate impacts. The fund, which has secured initial commitments of $150 billion from developed nations, represents a significant increase in climate finance and addresses long-standing concerns from developing countries about the costs of climate action. Brazil's President emphasized that this funding is essential for protecting the Amazon rainforest, while island nations stressed the urgent need for adaptation funding to address rising sea levels.

The summit also saw the formation of several new international partnerships focused on specific aspects of climate action. The Global Green Hydrogen Alliance, announced by leaders from Germany, Japan, and Australia, aims to accelerate the development and deployment of hydrogen fuel technology. Similarly, a new partnership between the United States, European Union, and Canada focuses on carbon capture and storage technology, with commitments to share research and coordinate deployment efforts. These partnerships represent a shift toward more focused, technology-specific cooperation rather than broad, general agreements.

As the summit concluded, participants agreed to reconvene in six months to review progress on the commitments made this week. The Geneva Declaration on Climate Action, signed by all participating nations, includes specific targets for carbon reduction, renewable energy deployment, and climate adaptation funding. While environmental groups have praised the increased ambition shown at the summit, many emphasize that the real test will come in the implementation of these commitments. The next six months will be crucial in determining whether the political momentum generated in Geneva can translate into concrete action on the ground.`
  },
  {
    id: 7,
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1734597949889-f8e2ec87c8ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHF1YW50dW1uJTIwY29tcHV0ZXJ8ZW58MHx8MHx8fDA%3D',
    title: 'Breakthrough in Quantum Computing Announced',
    description: 'Scientists achieve a new milestone in quantum supremacy, promising to reshape technology.',
    source: 'innovatech.com',
    size: 'standard',
    content: `Researchers at the Quantum Research Institute have achieved a groundbreaking milestone in quantum computing, successfully demonstrating a 1000-qubit quantum processor that maintains coherence for unprecedented durations. This achievement represents a quantum leap forward in the field, bringing practical quantum computing applications significantly closer to reality. The breakthrough addresses one of the most persistent challenges in quantum computing: maintaining quantum coherence long enough to perform complex calculations while minimizing errors that have plagued previous systems.

The new quantum processor, dubbed "QuantumCore-1000," utilizes a revolutionary error correction system that combines hardware and software innovations to achieve fault-tolerant quantum computation. Unlike previous quantum computers that required near-absolute zero temperatures and isolation from external interference, this system operates at relatively higher temperatures while maintaining quantum coherence through sophisticated error mitigation protocols. The research team, led by Dr. Sarah Chen, has demonstrated that their system can perform calculations that would take classical computers millions of years to complete, achieving true quantum advantage in practical applications.

The implications for cryptography and cybersecurity are particularly significant, as quantum computers have long been theorized to break current encryption methods that protect everything from online banking to government communications. However, the research team has also developed quantum-resistant encryption algorithms that can run on their system, providing both the problem and the solution. Major technology companies and government agencies are already expressing interest in implementing these quantum-safe security measures, recognizing that the quantum computing revolution will require a complete overhaul of current cybersecurity infrastructure.

Beyond cryptography, the quantum computing breakthrough promises to accelerate progress in drug discovery, materials science, and artificial intelligence. Pharmaceutical companies are particularly excited about the potential to model complex molecular interactions that are impossible to simulate on classical computers, potentially reducing drug development timelines from decades to years. Similarly, the ability to model quantum mechanical systems directly could lead to breakthroughs in developing new materials for energy storage, solar panels, and other clean energy technologies.

The commercialization timeline for this quantum computing technology is expected to be shorter than previous estimates, with the research team announcing partnerships with major technology companies to develop practical applications within the next five years. While the current system requires specialized facilities and expert operators, work is already underway to develop more accessible quantum computing platforms that could eventually be integrated into existing data centers and research facilities. This breakthrough marks the beginning of the quantum computing era, promising to transform industries and solve problems that have been beyond the reach of classical computation.`
  },
  {
    id: 8,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=60',
    title: 'The Underdog Story: A Season to Remember',
    description: 'Follow the journey of a team that defied all odds to become champions.',
    source: 'espn.com',
    size: 'compact',
    content: `The Leicester City Football Club's remarkable journey from relegation candidates to Premier League champions stands as one of the greatest underdog stories in sports history, a testament to the power of belief, teamwork, and tactical brilliance that captured the imagination of fans worldwide. When the season began, bookmakers gave Leicester 5000-to-1 odds of winning the Premier League—odds so long that it seemed more likely for aliens to land on Earth. Yet, through a combination of shrewd management, inspired signings, and an unshakeable team spirit, the Foxes proved that in sports, anything truly is possible.

The transformation began under the guidance of manager Claudio Ranieri, an Italian tactician who had never won a major league title despite decades of experience at the highest levels of European football. Ranieri inherited a squad that had narrowly avoided relegation the previous season, but he saw potential where others saw mediocrity. His tactical approach emphasized defensive solidity, lightning-fast counterattacks, and a work ethic that turned every player into a warrior for the team. The Italian's calm demeanor and fatherly approach to management created a family atmosphere that allowed players to exceed their perceived limitations.

Key to Leicester's success was the emergence of players who had been overlooked or undervalued by bigger clubs. Jamie Vardy, a former factory worker who had played non-league football just five years earlier, became the league's most feared striker, breaking records with his goal-scoring consistency. N'Golo Kanté, signed from French club Caen for just £5.6 million, dominated midfields and broke up attacks with seemingly superhuman energy. Riyad Mahrez, a relatively unknown winger from Algeria, displayed world-class skill that would later earn him a move to Manchester City and international recognition.

The turning point of the season came during a crucial stretch in February and March when Leicester faced several top-six teams. Rather than buckle under pressure, the team showed remarkable resilience, grinding out results through determination and tactical discipline. Their 2-1 victory over Liverpool at Anfield and a commanding 4-0 win against Swansea demonstrated that this was no fluke—Leicester had developed into a genuine title contender. The belief that had been building throughout the season reached fever pitch as fans began to dream of the impossible.

When Leicester clinched the Premier League title with two games to spare, the celebrations extended far beyond the city of Leicester. Neutral fans around the world had adopted the Foxes as their second team, inspired by a story that reminded everyone why they fell in love with sports in the first place. The achievement resonated because it represented hope—proof that with the right combination of hard work, belief, and a little bit of magic, David can still defeat Goliath. Leicester's triumph remains a beacon of inspiration, reminding us that the greatest victories often come from the most unexpected places.`
  },
];

const NewsContainer = styled.div`
  flex: 1;
  padding: 40px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  overflow-x: auto;
  padding-bottom: 10px;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.$active ? 'rgba(0,0,0,0.1)' : 'transparent'};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: rgba(0,0,0,0.05);
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: 0.8;
  }
`;

const ArticlesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(280px, auto);
  gap: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(250px, auto);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(220px, auto);
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 15px;
  }
`;

const ArticleCard = styled.div`
  background-color: ${props => props.theme.sidebar};
  border-radius: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
  min-height: 250px;

  &:hover {
    transform: translateY(-5px);
  }

  /* Size variants */
  ${props => props.$size === 'featured' && `
    grid-column: span 2;
    grid-row: span 2;
    min-height: 400px;
    
    @media (max-width: 768px) {
      grid-column: span 2;
      grid-row: span 1;
      min-height: 320px;
    }
    
    @media (max-width: 480px) {
      grid-column: span 1;
      grid-row: auto;
      min-height: 280px;
    }
  `}

  ${props => props.$size === 'wide' && `
    grid-column: span 2;
    grid-row: span 1;
    min-height: 280px;
    
    @media (max-width: 768px) {
      grid-column: span 2;
      min-height: 250px;
    }
    
    @media (max-width: 480px) {
      grid-column: span 1;
      min-height: 280px;
    }
  `}

  ${props => props.$size === 'tall' && `
    grid-column: span 1;
    grid-row: span 2;
    min-height: 400px;
    
    @media (max-width: 768px) {
      grid-row: span 1;
      min-height: 280px;
    }
    
    @media (max-width: 480px) {
      grid-row: auto;
      min-height: 280px;
    }
  `}

  ${props => props.$size === 'compact' && `
    grid-column: span 1;
    grid-row: span 1;
    min-height: 250px;
  `}

  ${props => props.$size === 'standard' && `
    grid-column: span 1;
    grid-row: span 1;
    min-height: 280px;
  `}
`;

const ArticleImage = styled.img`
  width: 100%;
  height: ${props => {
    switch(props.$size) {
      case 'featured': return '220px';
      case 'wide': return '160px';
      case 'tall': return '200px';
      case 'compact': return '140px';
      default: return '180px';
    }
  }};
  object-fit: cover;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    height: ${props => {
      switch(props.$size) {
        case 'featured': return '180px';
        case 'wide': return '140px';
        case 'tall': return '160px';
        case 'compact': return '120px';
        default: return '150px';
      }
    }};
  }
  
  @media (max-width: 480px) {
    height: 140px;
  }
`;

const ArticleContent = styled.div`
  padding: ${props => {
    switch(props.$size) {
      case 'featured': return '20px';
      case 'compact': return '16px';
      default: return '18px';
    }
  }};
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  
  @media (max-width: 768px) {
    padding: ${props => {
      switch(props.$size) {
        case 'featured': return '18px';
        case 'compact': return '14px';
        default: return '16px';
      }
    }};
  }
  
  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const ArticleTag = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;

  svg {
    width: 12px;
    height: 12px;
    opacity: 0.7;
  }
`;

const ArticleTitle = styled.h3`
  font-size: ${props => {
    switch(props.$size) {
      case 'featured': return '1.4rem';
      case 'wide': return '1.3rem';
      case 'tall': return '1.2rem';
      case 'compact': return '1.05rem';
      default: return '1.2rem';
    }
  }};
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: ${props => {
    switch(props.$size) {
      case 'featured': return '3';
      case 'wide': return '2';
      case 'compact': return '2';
      default: return '2';
    }
  }};
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: ${props => {
      switch(props.$size) {
        case 'featured': return '1.25rem';
        case 'wide': return '1.2rem';
        default: return '1.1rem';
      }
    }};
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
    -webkit-line-clamp: 2;
  }
`;

const ArticleDescription = styled.p`
  font-size: ${props => {
    switch(props.$size) {
      case 'featured': return '1rem';
      case 'wide': return '0.95rem';
      case 'tall': return '0.9rem';
      case 'compact': return '0.85rem';
      default: return '0.9rem';
    }
  }};
  color: ${props => props.theme.textSecondary};
  line-height: 1.4;
  margin: 0 0 12px 0;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: ${props => {
    switch(props.$size) {
      case 'featured': return '4';
      case 'wide': return '3';
      case 'tall': return '3';
      case 'compact': return '2';
      default: return '3';
    }
  }};
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    -webkit-line-clamp: ${props => {
      switch(props.$size) {
        case 'featured': return '3';
        case 'wide': return '2';
        default: return '2';
      }
    }};
  }
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    -webkit-line-clamp: 2;
    margin-bottom: 10px;
  }
`;

const ArticleFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
`;

const ArticleSource = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
`;

const BookmarkIcon = styled.div`
  cursor: pointer;
`;

const ArticleDetailOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ArticleDetailContainer = styled.div`
  background-color: ${props => props.theme.name === 'light' ? '#f8f9fa' : '#2c2c2e'};
  color: ${props => props.theme.text};
  width: 90%;
  max-width: 1000px;
  height: 90vh;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s ease-out;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ArticleDetailContent = styled.div`
  padding: 50px 60px;
  overflow-y: auto;
  flex-grow: 1;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.2);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  color: white;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(0,0,0,0.4);
  }
`;

const DetailTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 20px;
  color: ${props => props.theme.text};
`;

const DetailBody = styled.div`
  font-size: 1.05rem;
  line-height: 1.7;
  color: ${props => props.theme.name === 'light' ? '#343a40' : '#e0e0e0'};
  
  p {
    margin-bottom: 18px;
    text-align: justify;
  }
  
  p:last-child {
    margin-bottom: 0;
  }
`;

const DetailImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  margin: 30px 0;
`;

const DetailIntro = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  color: ${props => props.theme.name === 'light' ? '#495057' : '#d1d1d1'};
  margin-bottom: 25px;
  font-weight: 400;
`;

const ArticleMetadata = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.name === 'light' ? '#e9ecef' : '#404040'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.textSecondary};
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AuthorName = styled.span`
  font-weight: 500;
  color: ${props => props.theme.text};
  font-size: 0.95rem;
`;

const ReadTime = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary};
`;

const MetadataRight = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary};
`;

const PublishTime = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:before {
    content: "🕒";
  }
`;

const SourceTags = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const SourceTag = styled.span`
  background-color: ${props => props.theme.name === 'light' ? '#007bff' : '#0056b3'};
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:first-child {
    background-color: ${props => props.theme.name === 'light' ? '#dc3545' : '#c82333'};
  }
  
  &:nth-child(2) {
    background-color: ${props => props.theme.name === 'light' ? '#28a745' : '#1e7e34'};
  }
  
  &:nth-child(3) {
    background-color: ${props => props.theme.name === 'light' ? '#ffc107' : '#e0a800'};
    color: #000;
  }
`;

const ArticleDetailView = ({ article, onClose }) => {
  const contentParagraphs = article.content.split('\n\n');
  const firstParagraph = contentParagraphs[0];
  const remainingParagraphs = contentParagraphs.slice(1);

  return (
    <ArticleDetailOverlay onClick={onClose}>
      <ArticleDetailContainer onClick={(e) => e.stopPropagation()}>
        <ArticleDetailContent>
            <DetailTitle>{article.title}</DetailTitle>
            
            <DetailIntro>{firstParagraph.trim()}</DetailIntro>
            
            <ArticleMetadata>
              <AuthorSection>
                <AuthorAvatar>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="8" r="3"/>
                    <path d="M6.168 18.849a4 4 0 0 1 3.832-2.849h4a4 4 0 0 1 3.834 2.855"/>
                  </svg>
                </AuthorAvatar>
                <AuthorInfo>
                  <AuthorName>Curated by newsportal</AuthorName>
                  <ReadTime>{Math.ceil(article.content.length / 1000)} min read</ReadTime>
                </AuthorInfo>
              </AuthorSection>
              
              <MetadataRight>
                <PublishTime>Published 3 hours ago</PublishTime>
              </MetadataRight>
            </ArticleMetadata>

            <SourceTags>
              <SourceTag>{article.source}</SourceTag>
              <SourceTag>Associated Press</SourceTag>
              <SourceTag>Reuters</SourceTag>
            </SourceTags>
            
            <DetailImage src={article.image} alt={article.title} />
            
            <DetailBody>
              {remainingParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
            </DetailBody>
        </ArticleDetailContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
      </ArticleDetailContainer>
    </ArticleDetailOverlay>
  );
};

const filters = [
    {
      name: 'Top',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    },
    {
      name: 'Saved',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
    },
    {
      name: 'Tech',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="22" y2="7"></line><line x1="2" y1="17" x2="22" y2="17"></line></svg>
    },
    {
      name: 'Sports',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>
    },
    {
      name: 'Finance',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
    },
    {
      name: 'Art',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
    },
    {
      name: 'TV',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
    },
    {
      name: 'Politics',
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
    }
  ];

const NewsPage = () => {
  const [activeFilter, setActiveFilter] = useState('Top');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [savedArticles, setSavedArticles] = useState(() => {
    try {
      const saved = window.localStorage.getItem('savedNewsArticles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse saved articles from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('savedNewsArticles', JSON.stringify(savedArticles));
    } catch (e) {
      console.error('Failed to save articles to localStorage', e);
    }
  }, [savedArticles]);

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const handleSaveArticle = (e, articleId) => {
    e.stopPropagation();
    setSavedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  return (
    <NewsContainer>
      <Header>
        <Title>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          News
        </Title>
      </Header>

      <FilterBar>
        {filters.map(filter => (
          <FilterButton
            key={filter.name}
            $active={activeFilter === filter.name}
            onClick={() => setActiveFilter(filter.name)}
          >
            {filter.icon}
            {filter.name}
          </FilterButton>
        ))}
      </FilterBar>

      <ArticlesGrid>
        {placeholderArticles
          .filter(article => {
            if (activeFilter === 'Top') return true;
            if (activeFilter === 'Saved') return savedArticles.includes(article.id);
            return article.category === activeFilter.toLowerCase();
          })
          .map(article => {
            const filter = filters.find(f => f.name.toLowerCase() === article.category);
            const isSaved = savedArticles.includes(article.id);
            return (
              <ArticleCard key={article.id} $size={article.size} onClick={() => handleArticleClick(article)}>
                <ArticleImage src={article.image} alt={article.title} $size={article.size} />
                <ArticleContent $size={article.size}>
                  <ArticleTitle $size={article.size}>{article.title}</ArticleTitle>
                  {filter && (
                    <ArticleTag>
                      {filter.icon}
                      <span>{filter.name}</span>
                    </ArticleTag>
                  )}
                  <ArticleDescription $size={article.size}>{article.description}</ArticleDescription>
                  <ArticleFooter>
                    <ArticleSource>{article.source}</ArticleSource>
                    <BookmarkIcon onClick={(e) => handleSaveArticle(e, article.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                      </svg>
                    </BookmarkIcon>
                  </ArticleFooter>
                </ArticleContent>
              </ArticleCard>
            )
          })}
      </ArticlesGrid>

      {selectedArticle && (
        <ArticleDetailView article={selectedArticle} onClose={handleCloseArticle} />
      )}
    </NewsContainer>
  );
};

export default NewsPage; 