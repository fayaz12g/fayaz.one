import React, { useState, useEffect } from 'react';

const ImprovGame = ({ socket, sessionId, setGameStarted, setRounds, setCurrentRound, setPlayerRole, setLeaderboard, setIsEndScene, setIsSpeaker, setCurrentLine, setSentGuess, setIsEndGame, role, players, leaderboard }) => {
    useEffect(() => {
        if (socket) {
            socket.on('gameStarted', ({ rounds, roles, currentround }) => {
                setRounds(rounds);
                setGameStarted(true);
                setCurrentRound(currentround);
                setIsSpeaker(false);
                setIsEndGame(false);
                setIsEndScene(false);
                
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
                
                if (socket && socket.id && roles[socket.id]) {
                    const playerRole = roles[socket.id];
                    setPlayerRole(playerRole);
                } else {
                    console.error('Unable to set player role:', { socketId: socket?.id, roles });
                }

                setIsEndScene(false);
                setIsSpeaker(false);
                setCurrentLine(null);
                setSentGuess(false);
            });

            socket.on('updateLine', ({ line, isAdlib, isSpeaker }) => {
                setCurrentLine({ text: line, isAdlib });
                setIsSpeaker(isSpeaker);
                setIsEndScene(false);
            });

            socket.on('endScene', () => {
                setIsEndScene(true);
                setIsSpeaker(false);
            });

            socket.on('endGame', () => {
                setGameStarted(false);
                setIsEndGame(true);
            });

            socket.on('updatePoints', ({ points }) => {
                setLeaderboard(prevLeaderboard => ({
                    ...prevLeaderboard,
                    ...points
                }));
                console.log("Updating leaderboard");
            });
            
        }

        return () => {
            if (socket) {
                socket.off('gameStarted');
                socket.off('roundStarted');
                socket.off('updateLine');
                socket.off('endScene');
                socket.off('endGame');
            }
        };
    }, [socket]);

    const nextLine = () => {
        if (socket) {
            socket.emit('nextLine', { sessionId: sessionId.toUpperCase() });
        }
    };

    const guessAdlibber = (guess) => {
        setSentGuess(true);
        if (socket) {
            socket.emit('guessAdlibber', { sessionId: sessionId.toUpperCase(), guess });
        }
    };

    return { nextLine, guessAdlibber };
};

export default ImprovGame;