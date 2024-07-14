import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import './App.css';

// Improvimania Imports
import titleImage from './image/improvimania/title.png';
import PlayerScreen from './apps/improvimania/PlayerScreen';
import PickGame from './apps/PickGame';
import titleTheme from './sound/improvimania/theme.m4a';
import speakingTheme from './sound/improvimania/speaking.m4a';
import guessingTheme from './sound/improvimania/guessing.m4a';
import finishTheme from './sound/improvimania/finish.m4a';

// Menu Imports
import AudioPlayer from './apps/AudioPlayer';
import Quit from './apps/Quit';
import AnimatedTitle from './apps/AnimatedTitle';

function App() {
    const [ipAddress, setIpAddress] = useState(sessionStorage.getItem('ipAddress'));
    const [serverIP, setServerIP] = useState('');
    const [role, setRole] = useState(null);
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
    const [gameMode, setGameMode] = useState('classic');
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [connectionError, setConnectionError] = useState(false); 
    const [connectionWaiting, setConnectionWaiting] = useState(false);
    const [kicked, setKicked] = useState(false);
    const [theme, setTheme] = useState('light');
    const [forceRemove, setForceRemove] = useState(false);
    const [confirmQuit, setConfirmQuit] = useState(false);
    const [game, setGame] = useState(sessionStorage.getItem('game'));
    const [clientVersion] = useState('0.6 Sonic Alpha');
    const [serverVersion, setServerV] = useState('Disconnected');
    let [sessionList, setSessionList] = useState([]);
    const [scriptFile, setScriptFile] = useState('scripts');
    const [sessionCreated, setSessionCreated] = useState(() => {
        const storedValue = sessionStorage.getItem('sessionCreated');
        return storedValue === 'true' ? true : false;
      });


    // useEffect(() => {
    //     if (socket) {
    //         if (role === 'host' && sessionCreated === false) {
    //     createSession()
    //         }
    //     }
    // }, [role]);

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
                console.log(`I heard that ${removedPlayer} was removed. He must've been a bad boy.`)
                // if playerName equals removedPlayer, then reset all variables and storage
                if (playerName===removedPlayer) {
                    resetEverything()
                    setKicked(kickPlayer);
                }
            });
            socket.on('gameStarted', ({ rounds, roles, currentround }) => {
              setRounds(rounds);
              setGameStarted(true);
              setCurrentRound(currentround);
              setIsSpeaker(false);
              
              if (Object.keys(leaderboard).length === 0) {
                  console.log("Creating new leaderboard");
                  const newLeaderboard = {};
                  players.forEach(player => {
                      newLeaderboard[player.name] = 0;
                  });
                  setLeaderboard(newLeaderboard);
              }
              
              if (role === 'player') {
                  const playerRole = roles[socket.id];
                  setPlayerRole(playerRole);
              }
          });

          socket.on('roundStarted', ({ currentRound, roles }) => {
            setCurrentRound(currentRound);
            
            // Set player role
            if (socket && socket.id && roles[socket.id]) {
                const playerRole = roles[socket.id];
                setPlayerRole(playerRole);
            } else {
                console.error('Unable to set player role:', { socketId: socket?.id, roles });
            }

            // Reset any necessary state for the new round here
            setIsEndScene(false);
            setIsSpeaker(false);
            setCurrentLine(null);
            setSentGuess(false)
        });

        socket.on('updateLine', ({ line, isAdlib, isSpeaker }) => {
            setCurrentLine({ text: line, isAdlib });
            setIsSpeaker(isSpeaker);
            setIsEndScene(false);
        });
        socket.on('updatePoints', ({ points }) => {
            setLeaderboard(prevLeaderboard => ({
                ...prevLeaderboard,
                ...points
            }));
            console.log("Updating leaderboard");
        });
        socket.on('endScene', () => {
            setIsEndScene(true);
            setIsSpeaker(false);
        });

        socket.on('availableSessions', (sessions) => {
            setSessionList(sessions);
         // Check if sessionList contains at least one session
            if (sessions.length > 0) {
                // Check if role in sessionStorage is not 'host'
                const storedRole = sessionStorage.getItem('role');
                if (storedRole !== 'host') {
                setRole('player');
                }
            }
            else {
                setRole('host'); // might be a stupid change
            }
        });
        

        socket.on('endGame', () => {
            setGameStarted(false);
            setIsEndGame(true);
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

    const connectToServer = () => {
        let octets = ('localhost');
        if (ipAddress) {
            octets = ipAddress.split('.');
        }

        let fullIpAddress;
      
        if (octets.length === 1) {
            fullIpAddress = `192.168.1.${octets[0]}`;
        } else if (octets.length === 2) {
            fullIpAddress = `192.168.${octets[0]}.${octets[1]}`;
        } else if (ipAddress) {
            fullIpAddress = ipAddress;
        }
        else {
            fullIpAddress = ('localhost');
        }

        const url = `ws://${fullIpAddress}:3000`;
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

    const nextLine = () => {
        if (socket) {
            socket.emit('nextLine', { sessionId: sessionId.toUpperCase() });
        }
    };

    const guessAdlibber = (guess) => {
        setSentGuess(true)
        if (socket) {
            socket.emit('guessAdlibber', { sessionId: sessionId.toUpperCase(), guess });
        }
    };

    const removePlayer = (playerToRemove, forceRemove) => {
        console.log(`Asked the server to remove ${playerToRemove}`)
        socket.emit('removePlayer', { sessionId, playerToRemove, forceRemove });
      };

    const renderPickGame = () => (
      <PickGame
        socket={socket}
        ipAddress={serverIP}
        sessionCreated={sessionCreated}
        createSession={createSession}
        gameStarted={gameStarted}
        sessionId={sessionId}
        players={players}
        rounds={rounds}
        setRounds={setRounds}
        currentRound={currentRound}
        sessionList={sessionList}
        leaderboard={leaderboard}
        removePlayer={removePlayer}
        titleTheme={titleTheme}
        AudioPlayer={AudioPlayer}
        isEndScene={isEndScene}
        speakingTheme={speakingTheme}
        guessingTheme={guessingTheme}
        gameMode={gameMode}
        setGameMode={setGameMode}
        currentLine={currentLine}
        isEndGame={isEndGame}
        scriptFile={scriptFile}
        setForceRemove={setForceRemove}
        forceRemove={forceRemove}
        game={game}
        setGame={setGame}
        theme={theme}
      />
    );

    const renderPlayerScreen = () => (
      <PlayerScreen
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
        Audio={Audio}
        speakingTheme={speakingTheme}
        guessingTheme={guessingTheme}
        sentGuess={sentGuess}
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
            <div>
                <AnimatedTitle title="fayaz.One" />
                {kicked && <h2 style={{ color: 'red' }}>You have been kicked by the host.</h2>}
                {!connectionWaiting && !kicked && <input type="text" 
                value={ipAddress} 
                placeholder="Enter the room code"
                onChange={(e) => setIpAddress(e.target.value)} />}
                {!connectionWaiting && !kicked && <button onClick={connectToServer}>Connect</button>}
                {connectionWaiting && <h2>Attempting connection, please wait.</h2>}
                {connectionError && <p style={{ color: 'red' }}>Connection failed. Please check the IP address and try again.</p>}
            </div>
            </div>
        ) : !role ? (
            <div>
                <button onClick={() => {setRole('host'); sessionStorage.setItem('role', 'host')}}>Host</button>
                <button onClick={() => {setRole('player'); sessionStorage.setItem('role', 'player')}}>Player</button>
            </div>
        ) : role === 'host' ? (
            renderPickGame()
        ) : (
            renderPlayerScreen()
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