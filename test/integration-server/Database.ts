import Sequelize from 'sequelize';
import config from 'nconf';

var user = config.get('server.database_user');
var pass = config.get('server.database_pass');
var host = config.get('server.database_host');
var masterDatabaseName = config.get('server.master_database');
var shardDatabaseName = config.get('server.shard_1_database');

console.log('User:', user);

/**
 * Given a UUID, returns the master database if the UUID is < 80, otherwise returns the shard database.
 * @param uuid A string UUID like "efc8e0cf-17d7-4163-8673-a44ee925b04a".
 */
export function getDatabaseForUuid(uuid) {
    if (!uuid) {
        throw "No UUID provided.";
    }
    return uuid[0] > '7' ? shardDatabase : masterDatabase;
}

export var masterDatabase = new Sequelize(`postgres://${user}:${pass}@${host}/${masterDatabaseName}`);
export var shardDatabase = new Sequelize(`postgres://${user}:${pass}@${host}/${shardDatabaseName}`);