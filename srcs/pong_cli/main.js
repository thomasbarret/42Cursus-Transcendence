const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');

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
            const response = await axios.post(`${url}/api/auth/login/`, {
                email: email,
                password: password,
                code: code,
            })

            const cookies = response.headers['set-cookie'].join('; ');

            resolve(cookies);
        } catch (error) {
            if (error.response.data.error === "Invalid credentials")
                return reject("Invalid credentials");
            reject(error);
        }
    });
}



async function main() {
    try {
        let url = await question('Enter the URL of the server: ');

        if (url[url.length - 1] === '/')
            url = url.slice(0, -1);

        let email = await question('Enter your email: ');
        let password = await question('Enter your password: ');

        let cookies = await login(url, email, password);


        console.log(cookies);

        const ws = new WebSocket(`${url.replace('http', 'ws')}/ws/gateway/`, {
            headers: {
                Cookie: cookies,
            },
        });

        ws.on('open', async () => {
            console.log('Connected to the server');

            let gameID = await question('Enter the game ID: ');

            const response = await axios.post(`${url}/api/game/match/join`, {
                    uuid: gameID
                },
                {
                    headers: {
                        Cookie: cookies
                    }
                });
            
            console.log(`${response.data.player_1.display_name} VS ${response.data.player_2.display_name}`);

            console.log("Commands: /ready, /up /down");

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.on('line', (input) => {
                switch (input) {
                    case '/ready':
                        console.log("Ready");
                        ws.send(JSON.stringify({
                            event: 'GAME_MATCH_READY',
                            data: {
                                uuid: gameID,
                            },
                        }));
                        break;
                    case '/up':
                        console.log("Up");
                        ws.send(JSON.stringify({
                            event: 'GAME_MATCH_INPUT',
                            data: {
                                uuid: gameID,
                                direction: -1,
                            },
                        }));
                        break;
                    case '/down':
                        console.log("Down");
                        ws.send(JSON.stringify({
                            event: 'GAME_MATCH_INPUT',
                            data: {
                                uuid: gameID,
                                direction: 1,
                            },
                        }));
                        break;
                    default:
                        console.log("Invalid command");
                        break;
                }
            });


        });

        ws.on('message', (data) => {
            console.log(data);
        });


        ws.on('error', (error) => {
            throw new Error(error);
        });

    } catch (error) {
        console.error(error);
    }
}

main();