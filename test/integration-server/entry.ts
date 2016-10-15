import express from 'express';
import https from 'https';
import cors from 'cors';
import bodyParser from 'body-parser';
import { masterDatabase, shardDatabase, getDatabaseForUuid } from './Database';
import morgan from 'morgan';
import fs from 'fs';
import nconf from 'nconf';

nconf.argv()
     .env()
     .file({ file: 'test/integration-server/config.json' });

var options = {
    key: fs.readFileSync('test/integration-server/key.pem'),
    cert: fs.readFileSync('test/integration-server/cert.pem')
};

var app: any = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
// Enable development logging
app.use(morgan('dev'));

var port = 8080;
var router = express.Router();
var webhookCalls = {};

router.delete('/player/:id', function(req, res) {
    console.log(`Deleting player ${req.params.id}`)
    var db = getDatabaseForUuid(req.params.id);
    return db.query(
        'DELETE FROM players WHERE id = :id',
        {
            replacements: {
                id: req.params.id
            }
        }).then((results, metadata) => {
        var rowsAffected = null;
        if (results) {
            rowsAffected = results[1]['rowCount'];
        }
        console.log('    Delete Player Result:', rowsAffected);

        if (results !== undefined) {
            res.status(200).send({
                message: 'Player deleted successfully.'
            });
        } else {
            res.status(404).send({
                message: 'User with ID not found.'
            });
        }
    })
        .catch(e => {
            console.error(e);
            res.status(500).send({
                message: e
            })
        });
});

router.post('/webhook', function(req, res) {
    webhookCalls[req.body.event] = req.body;
    res.status(200).send({success: true});
});

router.get('/webhook/:event', function(req, res) {
    res.status(200).send(webhookCalls[req.params.event]);
});

app.use('/', router);

https.createServer(options, app).listen(port);
console.log(`Server listening on 0.0.0.0:${port}`);