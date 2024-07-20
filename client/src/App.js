import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import './App.css';

// Improvimania Imports
import titleImage from './image/improvimania/title.png';
import Players from './apps/Players';
import Hosts from './apps/Hosts';
import titleTheme from './sound/improvimania/theme.m4a';
import speakingTheme from './sound/improvimania/speaking.m4a';
import guessingTheme from './sound/improvimania/guessing.m4a';
import finishTheme from './sound/improvimania/finish.m4a';

// Menu Imports
import AudioPlayer from './apps/AudioPlayer';
import Quit from './apps/Quit';
import Game from './apps/Game';
import AnimatedTitle from './apps/AnimatedTitle';

// Import the new ImprovGame module
import ImprovGame from './apps/improvimania/Improv';

function App() {
    const [ipAddress, setIpAddress] = useState(sessionStorage.getItem('ipAddress'));
    const [serverIP, setServerIP] = useState('');
    const [role, setRole] = useState(null);
    const [guessesMade, setGuessesMade] = useState([]);
    const [socket, setSocket] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState(1);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentLine, setCurrentLine] = useState(null);
    const [sentGuess, setSentGuess] = useState(false);
    const [currentRound, setCurrentRound] = useState(1);
    const [playerRole, setPlayerRole] = useState(null);
    const [leaderboard, setLeaderboard] = useState({});
    const [joinedSession, setJoinedSession] = useState(false);
    const [isEndScene, setIsEndScene] = useState(false);
    const [isEndGame, setIsEndGame] = useState(false);
    const [customServer, setCustomServer] = useState(false);
    const [gameMode, setGameMode] = useState('freeforall');
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [connectionError, setConnectionError] = useState(false); 
    const [connectionWaiting, setConnectionWaiting] = useState(false);
    const [kicked, setKicked] = useState(false);
    const [theme, setTheme] = useState('light');
    const [forceRemove, setForceRemove] = useState(false);
    const [confirmQuit, setConfirmQuit] = useState(false);
    const [game, setGame] = useState(sessionStorage.getItem('game'));
    const [clientVersion] = useState('0.8 Super');
    const [serverVersion, setServerV] = useState('Disconnected');
    const [scriptFile, setScriptFile] = useState('scripts');

    let [sessionList, setSessionList] = useState([]);


    const [sessionCreated, setSessionCreated] = useState(() => {
        const storedValue = sessionStorage.getItem('sessionCreated');
        return storedValue === 'true' ? true : false;
      });

    const letterToNumber = (letter) => {
        if (letter === 'X') return '.';
        return (letter.charCodeAt(0) - 65).toString();
    };

    const lettersToIp = (letters) => {
        if (letters === 'localhost') return 'localhost';
        return letters.split('')
                    .map(letter => letterToNumber(letter))
                    .join('');
    };
    
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const customIpAddress = searchParams.get('ipAddress');
        
        if (customIpAddress) {  // Changed from 'ipAddress' to 'customIpAddress'
          sessionStorage.setItem('ipAddress', customIpAddress);
          setIpAddress(customIpAddress);
          console.log('Session storage set: ipAddress =', customIpAddress);
          connectToServer();
          
          // Remove the query parameter from the URL without reloading the page
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({path: newUrl}, '', newUrl);
        } else {
          console.log('No ipAddress found in URL parameters');
        }
      }, [setIpAddress, ipAddress]);

    useEffect(() => {
        if (socket) {
            console.log('Successfully connected to the server');
            if (sessionStorage.getItem('playerId') == null) {
                console.log('socket id: ' + socket.id);
                sessionStorage.setItem('playerId', socket.id);
            }
            if (sessionStorage.getItem('role') === 'host' && sessionStorage.getItem('sessionId')) {
                setRole('host')
                setSessionCreated(true)
                setSessionId(sessionStorage.getItem('sessionId'));
                socket.emit('reconnectHost', { sessionId: sessionId.toUpperCase() });
            }
        } else {
            if (ipAddress) {
                connectToServer();
            }
        }
    }, [socket]);

    useEffect(() => {
        if (socket) {                
            socket.on('connect', () => {
                setConnectionError(false); // Reset connection error state on successful connection
            });
            socket.on('sessionCreated', ({ sessionId }) => {
                // const shortSessionId = sessionId.substr(0, 4).toUpperCase();
                const shortSessionId = sessionId;
                setSessionId(shortSessionId);
                sessionStorage.setItem('sessionId', shortSessionId);
                setSessionCreated(true);
            });
            socket.on('updatePlayers', ({ players }) => {
                setPlayers(players);
            });
            socket.on('playerRemoved', ({ removedPlayer, kickPlayer }) => {
                console.log(`Player ${removedPlayer} was removed. Kicked: ${kickPlayer}`);
                if (socket.id === removedPlayer) {
                    resetEverything();
                    setKicked(kickPlayer);
                }
            });

        socket.on('setGame', ({ game }) => {
            setGame(game);
        });

        socket.on('availableSessions', (sessions) => {
            setSessionList(sessions);
        });
        
        socket.on('reconnect', ({name, sessionId, players}) => {
            setRole('player');
            setPlayerName(name);
            setPlayers(players);
            setSessionId(sessionId);
            setJoinedSession(true);
            sessionStorage.setItem('playerId', socket.id);
        })
    }
    document.body.className = theme;
    }, [socket, players, role, leaderboard, theme]);

    const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
      const titleBar = document.querySelector('.title-bar');
      if (theme === 'light') {
        titleBar.classList.remove('dark');
        titleBar.classList.add('light');
      } else if (theme === 'dark') {
        titleBar.classList.remove('light');
        titleBar.classList.add('dark');
      }
  };

    const resetEverything = () => {
        // Reset everything to default
        setRole(null);
        setIpAddress('');
        setPlayerName('');
        setJoinedSession(false);
        setRounds(0);
        setPlayers([]);
        setSessionId('');
        setSocket(null);
        setSessionList([]);
        
        // Clear out your storage, you're fired!
        sessionStorage.clear();
        
    }

    const convertIP = () => {
        let fullIpAddress;
    
        if (ipAddress === 'localhost') {
            fullIpAddress = 'localhost';
        } else {
            const numericIp = lettersToIp(ipAddress);
            console.log("Attempting to connect over", numericIp)
            const octets = numericIp.split('.');
    
            if (octets.length === 1) {
                fullIpAddress = `192.168.1.${octets[0]}`;
            } else if (octets.length === 2) {
                fullIpAddress = `192.168.${octets[0]}.${octets[1]}`;
            } else {
                fullIpAddress = numericIp;
            }
        }
    }

    // Client-side connection logic
    const connectToServer = () => {
        const url = 'wss://fayaz.fly.dev';
        console.log("Sending WebSocket request to", url)
        
        const newSocket = io(url, {
            transports: ['websocket'],
            query: {
                playerId: sessionStorage.getItem('playerId'),
                role: sessionStorage.getItem('role')
            }
        });

        setConnectionError(false);
        setConnectionWaiting(true);

        // Handle connection error
        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionError(true);
            setConnectionWaiting(false);
            newSocket.close()
        });

        newSocket.on('connect', data => {
            setSocket(newSocket);
            setConnectionWaiting(false);
            if (ipAddress) {
                sessionStorage.setItem('ipAddress', ipAddress);
            }
            else {
                sessionStorage.setItem('ipAddress', 'localhost');
            }
            
        });
        newSocket.on('serverVersion', (version) => {
          setServerV(version);
      });
      newSocket.on('serverIpAddress', (serverIpAddress) => {
        setServerIP(serverIpAddress);
    });
    };

    const createSession = ( game ) => {
        if (socket) {
            socket.emit('createSession', game);
            sessionStorage.setItem('sessionCreated', true);
            sessionStorage.setItem('role', role);
        }
    };
    
    const joinSession = (clickedSessionId) => {
        console.log('Attempting to join session:', clickedSessionId);
        
        if (!socket) {
            console.error('Socket is not initialized');
            return;
        }
        
        if (!playerName) {
            console.error("No player name when trying to join!");
            return;
        }
        
        // Update the sessionId state
        setSessionId(clickedSessionId);
        
        // Emit the join event
        console.log('Emitting joinSession event:', { sessionId: clickedSessionId, playerName });
        socket.emit('joinSession', { sessionId: clickedSessionId, playerName });
        
        // Update other states and storage
        setJoinedSession(true);
        sessionStorage.setItem("playerId", socket.id);
        sessionStorage.setItem('role', role);
        
        console.log('Join session process completed');
    };

    const { nextLine, guessAdlibber } = ImprovGame({
        socket,
        sessionId,
        setGameStarted,
        setRounds,
        setCurrentRound,
        setPlayerRole,
        setLeaderboard,
        setIsEndScene,
        setIsSpeaker,
        setCurrentLine,
        setSentGuess,
        setIsEndGame,
        role,
        players,
        leaderboard,
        setGuessesMade
    });

    const removePlayer = (playerToRemove, forceRemove) => {
        console.log(`Asked the server to remove ${playerToRemove}`)
        socket.emit('removePlayer', { sessionId, playerToRemove, forceRemove });
      };

    const renderGame = () => (
      <Game
        isEndGame={isEndGame}
        joinedSession={joinedSession}
        sessionId={sessionId}
        setSessionId={setSessionId}
        playerName={playerName}
        setPlayerName={setPlayerName}
        joinSession={joinSession}
        gameStarted={gameStarted}
        players={players}
        playerRole={playerRole}
        isEndScene={isEndScene}
        currentLine={currentLine}
        isSpeaker={isSpeaker}
        nextLine={nextLine}
        guessAdlibber={guessAdlibber}
        sessionList={sessionList}
        leaderboard={leaderboard}
        kicked={kicked}
        titleTheme={titleTheme}
        AudioPlayer={AudioPlayer}
        speakingTheme={speakingTheme}
        guessingTheme={guessingTheme}
        sentGuess={sentGuess}
        game={game}
        socket={socket}
        serverIP={serverIP}
        sessionCreated={sessionCreated}
        createSession={createSession}
        rounds={rounds}
        setRounds={setRounds}
        currentRound={currentRound}
        removePlayer={removePlayer}
        gameMode={gameMode}
        setGameMode={setGameMode}
        scriptFile={scriptFile}
        setForceRemove={setForceRemove}
        forceRemove={forceRemove}
        setGame={setGame}
        theme={theme}
        role={role}
        guessesMade={guessesMade}
      />
    );

  return (
    <div>
    {/* Audio components */}
    <AudioPlayer audioSrc={guessingTheme} loopStart={0} loopEnd={16} isPlaying={isEndScene}/>
    <AudioPlayer audioSrc={speakingTheme} loopStart={0} loopEnd={12} isPlaying={gameStarted && !isEndScene}/>
    <AudioPlayer audioSrc={titleTheme} loopStart={24} loopEnd={71.9} isPlaying={!gameStarted} />
    <AudioPlayer audioSrc={finishTheme} loop={false} isPlaying={isEndGame} />
    

    {/* Main content */}
    <div className="main-content">
        {!socket ? (
            <div className="App">
            <AnimatedTitle title="fayaz.One" />
           <div>
                {kicked && <h2 style={{ color: 'red' }}>You have been kicked by the host.</h2>}
                {customServer && !connectionWaiting && !kicked && <input type="text" 
                value={ipAddress} 
                placeholder="Enter the room code"
                onChange={(e) => setIpAddress(e.target.value)} />}
                {customServer && !connectionWaiting && !kicked && <button onClick={connectToServer}>Connect</button>}
                {connectionWaiting && <h2>Attempting connection, please wait.</h2>}
                {connectionError && <p style={{ color: 'red' }}>Connection failed. Please check the IP address and try again.</p>}
            </div>
            <div>
            {!customServer && !connectionWaiting && <button onClick={() => {setRole('host'); connectToServer(); sessionStorage.setItem('role', 'host')}}>Host a Game</button>}
            {!customServer && !connectionWaiting && <button onClick={() => {setRole('player'); connectToServer(); sessionStorage.setItem('role', 'player')}}>Join as Player</button>}
            </div>
            </div>
        ) : !role ? (
            <div className='App'>
                <h1>Choose a Role</h1>
                <button onClick={() => {setRole('host'); sessionStorage.setItem('role', 'host')}}>Host</button>
                <button onClick={() => {setRole('player'); sessionStorage.setItem('role', 'player')}}>Player</button>
            </div>
        ) : (
            renderGame()
        )}
            <button 
                className="theme-toggle" 
                onClick={toggleTheme}
            >
                {theme === 'light' ? '☀️' : '🌙'}
            </button>
            {role && sessionId && (
            <button 
                className="exit" 
                onClick={() => setConfirmQuit(true)}
            >
                {theme === 'light' ? '🏃‍♂️' : '🏃🏿'}
            </button>
            )}

            {confirmQuit && (
                <Quit 
                    playerName={playerName} 
                    forceRemove={forceRemove} 
                    removePlayer={removePlayer} 
                    resetEverything={resetEverything}
                    setConfirmQuit={setConfirmQuit}
                />
            )}
          <div className="version-text smalltext">
            Client Version: {clientVersion}
            <br />
            Server Version: {serverVersion}
        </div>
        </div>
        </div>
    );
}

export default App;