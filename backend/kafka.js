const { Kafka, CompressionTypes, CompressionCodecs } = require('kafkajs')
const SnappyCodec = require('kafkajs-snappy')
var config = require('./config.json');
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
const dbsingleton = require('./access/db_access');

const db = dbsingleton;

const kafka = new Kafka({
    clientId: config.groupNumber,
    brokers: config.bootstrapServers
});

const producer = kafka.producer();
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
});

const getMessages = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: config.twitter_topic, fromBeginning: true });
    await consumer.subscribe({ topic: config.posts_topic, fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(message.value);
            if (topic == config.twitter_topic) {
                const content = message.value.text;
                const hashtags = message.value.hashtags;
                const username = 'twitter:' + message.value.author_id
                try {
                    const hashtag_ids = [];
                    for (let i = 0; i < hashtags.length; i++) {
                        const data = await db.send_sql(
                            `SELECT * FROM hashtags WHERE name = '${hashtags[i]}'`
                        );
                        if (data.length === 0) {
                            const q = "INSERT INTO hashtags (name, count) VALUES (?, 1)"
                            await db.insert_items(q, [hashtags[i]]);
                            const info = await db.send_sql(
                                `SELECT * FROM hashtags WHERE name = '${hashtags[i]}'`
                            );
                            hashtag_ids.push(info[0].hashtag_id);
                        }
                        hashtag_ids.push(data[0].hashtag_id);
                    }
                    const q2 = `INSERT INTO posts (author_id, content, hashtag_ids, foreign_username) VALUES (-1, ?, ?, ?)`;
                    await db.insert_items(q2, [content, hashtag_ids, username]);
                } catch (err) {
                    console.log(err);
                }
            } else {
                try {
                info = JSON.parse(message.value);
                const content = info.post_text
                const hashtagRegex = /#[^\s]+/g;
                const content_type = info.content_type;
                let hashtags = [];
                let matches = content.match(hashtagRegex);
                if (matches) {
                    hashtags = matches.map(match => match.substring(1));
                }
                const username = info.source_site + ':' + info.username
                const hashtag_ids = [];
                for (let i = 0; i < hashtags.length; i++) {
                    const data = await db.send_sql(
                        `SELECT * FROM hashtags WHERE name = '${hashtags[i]}'`
                    );
                    if (data.length === 0) {
                        const q = "INSERT INTO hashtags (name, count) VALUES (?, 1)"
                        await db.insert_items(q, [hashtags[i]]);
                        const info = await db.send_sql(
                            `SELECT * FROM hashtags WHERE name = '${hashtags[i]}'`
                        );
                        hashtag_ids.push(info[0].hashtag_id);
                    }
                    hashtag_ids.push(data[0].hashtag_id);
                }
                const q2 = `INSERT INTO posts (author_id, content, hashtag_ids, foreign_username) VALUES (-1, ?, ?, ?)`;
                await db.insert_items(q2, [content, hashtag_ids.stringify(), username]);
                } catch (err) {
                    console.log(err);
                }
            }
        },
    });
};

const publishPost = async (username, uuid, content) => {
    await producer.connect();
    const post = {
        username,
        source_site: config.site_id,
        post_uuid_within_site: uuid,
        post_text: content,
        content_type: "text/html",
    };
    await producer.send({
        topic: config.posts_topic,
        messages: [{ value: JSON.stringify(post)}]
    })
}

const retrivePosts = async () => {
    await getTwitterMessages();
    await getPosts();
}

const main = async () => {
    publishPost('hi', '1', 'test');
    getMessages();
}

main();

module.exports = {
    publishPost,
    getMessages
};