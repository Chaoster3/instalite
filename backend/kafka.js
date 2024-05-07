const { Kafka, CompressionTypes, CompressionCodecs } = require('kafkajs')
const SnappyCodec = require('kafkajs-snappy')
var config = require('./config.json');
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const kafka = new Kafka({
    clientId: config.groupNumber,
    brokers: config.bootstrapServers
});

const producer = kafka.producer();
const consumer = kafka.consumer({
    groupId: config.groupId,
    bootstrapServers: config.bootstrapServers
});

const getTwitterMessages = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: config.twitter_topic, fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const content = message.text;
            const hashtags = message.hashtags;
            const username = 'twitter:' + message.author_id
            console.log(message.value.toString());
        },
    });
};

var other_posts = [];

const getPosts = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: config.posts_topic, fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const content = message.post_text
            const hashtagRegex = /#[^\s]+/g;
            const content_type = message.content_type;
            let hashtags = [];
            let matches = text.match(hashtagRegex);
            if (matches) {
                hashtags = matches.map(match => match.substring(1)); 
            }
            let image;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/html');
            const imgElements = xmlDoc.getElementsByTagName('img');
            if (imgElements.length > 0) {
                image = imgElements[0].getAttribute('src');
            }
            const username = message.source_site + ':' + message.username
        },
    });
};

const publishPost = async (username, uuid, text, contentType, image) => {
    await producer.connect();
    const post = {
        username,
        source_site: config.site_id,
        post_uuid_within_site: uuid,
        post_text: text,
        content_type: contentType,
    };
    await producer.send({
        topic: config.posts_topic,
        messages: [{ value: JSON.stringify({post, attach: image })}]
    })
}

const main = async () => {
    await publishPost('test', 'test', 'test', 'test', 'test', 'test',)
    await getTwitterMessages();
}

main();

setInterval(main, 60 * 60 * 1000);
