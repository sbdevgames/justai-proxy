const express = require('express');
const path = require("path");
const request = require("request");
const cors = require('cors');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const https = require("https");

const proxyHost = 'bot.aimylogic.com';
const proxyPath = '/restapi/google/webhook/vTNnGbXl:e1dd8f1b900d5a049c341fa41fb656595b9ca182';
// const proxyHost = 'zb04.just-ai.com';
// const proxyPath = '/chatadapter/chatapi/webhook/yandex/fBpmbPbq:75c24cf503a4301cad73d53c72111eafd0011af9';
const proxyUrl = `https://${proxyHost}${proxyPath}`;
const ngUrl = 'https://3bebd4cd.ngrok.io';

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());
app.use(express.static('public'));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

console.log(__dirname);

app.get('/', (req, res) => {
    console.log("SOME_GET", req, res);

    res.send('Hello World!');
    /*let url = newurl+req.url;
    let r = null;

    console.log(req.method, req.originalUrl, url);

    r = request(url);

    req.pipe(r).pipe(res);*/
});
app.get('/html', (req, res) => {
    console.log(__dirname+'/public/index.html');
    // console.log(__dirname+'/public/exportTest/testGD.html');

    res.sendFile(path.resolve(__dirname+'/public/index.html'));
    // res.sendFile(path.resolve(__dirname+'/public/exportTest/testGD.html'));

    /*let url = newurl+req.url;
    let r = null;

    console.log(req.method, req.originalUrl, url);

    r = request(url);

    req.pipe(r).pipe(res);*/
});

function requestData(params, data){
    return new Promise(function(resolve, reject){
        const headers = {
            ...params.headers,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
        const req = https.request({...params, headers}, function (res) {
            // in addition to parsing the value, deal with possible errors
            // if (error) return reject(error);
            var body = '';

            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){
                try {
                    const response = JSON.parse(body);
                    console.log(response)
                    // JSON.parse() can throw an exception if not valid JSON
                    resolve({body: response});
                } catch(e) {
                    reject(e);
                }
            });
            res.on('data' , d => {
            })
        });
        req.write(data)
        req.on('error', error => {
            if (error) reject(error);
        })
        req.end()
    });
}

app.use(function (req, res, next) {
    console.log('Time: %d', Date.now());
    console.log(req.query, req.body, req.method);
    next()
});

app.post('/', (req, res) => {
    requestData({
        qs:req.query,
        hostname:proxyHost,
        path:proxyPath,
        // uri: proxyUrl,
        method: req.method,
        // json: req.body,
        headers: Object.assign({}, req.headers, {host: proxyHost}),
        gzip: true
    }, JSON.stringify(req.body))
        .then((data)=>{
            console.log(JSON.stringify(data.body));
            // res.json(data.body);

            let items = data.body.expectedInputs[0].inputPrompt.richInitialPrompt.items;

            let newItems = items.filter(item => !!item.simpleResponse);
            let parseItems = items.filter(item => !item.simpleResponse);

            items = newItems;

            let updatedState = {
                command: 'UPDATE_STATE',
                image: null,
                buttons: [],
                text: newItems.map( item => item.simpleResponse.displayText).join(' '),
            };

            if(data.body.expectedInputs[0] && data.body.expectedInputs[0].inputPrompt.richInitialPrompt.suggestions){
                updatedState.buttons = data.body.expectedInputs[0].inputPrompt.richInitialPrompt.suggestions;
            }

            parseItems.forEach(item=>{
                if(!!item.basicCard){
                    if(!!item.basicCard.image){
                        updatedState.image = item.basicCard.image;
                    }
                }
            });

            items.push({
                "htmlResponse":{
                    "updatedState": updatedState,
                    "suppressMic": false,
                    "url": ngUrl+"/html"
                }
            });


            res.json({
                "userStorage": data.body.userStorage,
                "expectUserResponse": data.body.expectUserResponse,
                "conversationToken": data.body.conversationToken,
                "expectedInputs": [
                    {
                        "inputPrompt": {
                            "richInitialPrompt": {
                                "items": items,
                            },
                        },
                        "possibleIntents": data.body.expectedInputs[0].possibleIntents,
                    }
                ],
            });
        })
        .catch( e =>{
            console.error(e);
        });
});

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
});
