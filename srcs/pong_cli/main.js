const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');
const https = require('https');

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m"
};

async function question(name) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(name, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}

async function login(url, email, password, code = null) {
    return new Promise(async (resolve, reject) => {
        try {
            const instance = axios.create({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const response = await instance.post(`${url}/api/auth/login/`, {
                email: email,
                password: password,
                code: code,
            });

            const cookies = response.headers['set-cookie'].join('; ');
            resolve(cookies);
        } catch (error) {
            console.log(`${colors.red}Login failed.${colors.reset}`);
            if (error.response?.data?.error === "Invalid credentials")
                return reject("Invalid credentials");
            reject(error);
        }
    });
}

async function main(url = null, email = null, password = null) {
    try {
        url = url || await question(`${colors.blue}Enter the URL of the server: ${colors.reset}`);
        if (url[url.length - 1] === '/')
            url = url.slice(0, -1);

        email = email || await question(`${colors.blue}Enter your email: ${colors.reset}`);
        password = password || await question(`${colors.blue}Enter your password: ${colors.reset}`);

        let cookies = await login(url, email, password);
        console.log(`${colors.green}Login successful.${colors.reset}`);

        const ws = new WebSocket(`${url.replace('http', 'ws')}/ws/gateway/`, {
            headers: {
                Cookie: cookies,
            },
        });

        ws.on('open', async () => {
            console.log(`${colors.green}Connected to the server${colors.reset}`);

            let gameID = await question(`${colors.blue}Enter the game ID: ${colors.reset}`);
            const response = await axios.post(`${url}/api/game/match/join`, {
                uuid: gameID
            }, {
                headers: {
                    Cookie: cookies
                }
            });

            console.log(`${colors.yellow}${response.data.player_1.display_name} VS ${response.data.player_2.display_name}${colors.reset}`);
            console.log(`${colors.cyan}Commands: Press Enter to be ready, Arrow keys for moving${colors.reset}`);

            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', (key) => {
                if (key.toString() === '\r') {
                    console.log(`${colors.cyan}Ready${colors.reset}`);
                    ws.send(JSON.stringify({
                        event: 'GAME_MATCH_READY',
                        data: {
                            uuid: gameID,
                        },
                    }));
                } else if (key.toString() === '\u001B\u005B\u0041') { // Flèche haut
                    ws.send(JSON.stringify({
                        event: 'GAME_MATCH_INPUT',
                        data: {
                            uuid: gameID,
                            direction: -1,
                        },
                    }));
                } else if (key.toString() === '\u001B\u005B\u0042') { // Flèche bas
                    ws.send(JSON.stringify({
                        event: 'GAME_MATCH_INPUT',
                        data: {
                            uuid: gameID,
                            direction: 1,
                        },
                    }));
                } else if (key.toString() === '\u0003') { // Ctrl+C pour quitter
                    process.exit();
                }
            });
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                if (message.event === 'GAME_MATCH_START') {
                    console.log(`${colors.green}Game started${colors.reset}`);
                } else if (message.event === 'GAME_MATCH_FINISHED') {
                    console.log(`${colors.magenta}The winner is ${message.data.winner.display_name}${colors.reset}`);
                    console.log(`${colors.yellow}Score: ${message.data.player_1.display_name}=>${message.data.player1_score}${colors.reset} - ${message.data.player_2.display_name}=>${message.data.player2_score}`);

                    ws.close();
                    process.stdin.removeListener('data', () => {});
                    main(url, email, password);
                } else if (message.event === 'GAME_SCORE_UPDATE') {
                    console.log(`${colors.gray}Score: P1=>${message.data.p1_score} - P2=>${message.data.p2_score}${colors.reset}`);
                }
            } catch (error) {
                console.error(`${colors.red}Error parsing message: ${error}${colors.reset}`);
            }
        });

        ws.on('error', (error) => {
            console.log(`${colors.red}WebSocket error: ${error}${colors.reset}`);
        });

    } catch (error) {
        console.error(`${colors.red}Error: ${error}${colors.reset}`);
    }
}

main();
